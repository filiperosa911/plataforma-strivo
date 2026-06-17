// STRIVO PLATFORM // CORE BUSINESS LOGIC & INTERACTION

// Global State
let db = loadDataStore();
let currentRole = 'diretoria';
let currentUserId = 1; // Filipe Rosa
let currentCRMView = 'kanban';
let listenersConnected = false;
let supabaseClient = null;
let supabaseMode = 'LOCAL'; // 'LOCAL' or 'CLOUD'

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    // 1. Initial Local Load (so that if Supabase is disconnected, we still have local data)
    db = loadDataStore();
    
    // Check Supabase Configuration
    const supaUrl = localStorage.getItem('strivo_supabase_url');
    const supaKey = localStorage.getItem('strivo_supabase_key');
    
    const cloudStatusBadge = document.getElementById('cloud-status-badge');
    const btnMigrate = document.getElementById('btn-migrate-data');
    const btnDisconnect = document.getElementById('btn-disconnect-supa');
    
    // Set config values in settings panel inputs if they exist
    const supaUrlInput = document.getElementById('supa-url');
    const supaKeyInput = document.getElementById('supa-anon-key');
    if (supaUrlInput && supaUrl) supaUrlInput.value = supaUrl;
    if (supaKeyInput && supaKey) supaKeyInput.value = supaKey;

    if (supaUrl && supaKey && window.supabase) {
        try {
            supabaseClient = window.supabase.createClient(supaUrl, supaKey);
            supabaseMode = 'CLOUD';
            
            if (cloudStatusBadge) {
                cloudStatusBadge.innerText = 'Modo Nuvem (Online)';
                cloudStatusBadge.className = 'w-fit px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 uppercase tracking-wider';
            }
            if (btnMigrate) {
                btnMigrate.disabled = false;
                btnMigrate.classList.remove('bg-slate-800', 'cursor-not-allowed', 'text-zinc-500');
                btnMigrate.classList.add('bg-zinc-800', 'hover:bg-zinc-700', 'text-zinc-300');
            }
            if (btnDisconnect) btnDisconnect.classList.remove('hidden');
            
            // Load from cloud into global db in memory
            await loadDataStoreFromCloud();
        } catch (err) {
            console.error("Erro de conexão ao Supabase. Revertendo para local:", err);
            supabaseMode = 'LOCAL';
            db = loadDataStore();
        }
    } else {
        supabaseMode = 'LOCAL';
        db = loadDataStore();
        if (cloudStatusBadge) {
            cloudStatusBadge.innerText = 'Modo Local (Offline)';
            cloudStatusBadge.className = 'w-fit px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider';
        }
        if (btnMigrate) {
            btnMigrate.disabled = true;
            btnMigrate.classList.add('bg-slate-800', 'cursor-not-allowed', 'text-zinc-500');
            btnMigrate.classList.remove('bg-zinc-800', 'hover:bg-zinc-700', 'text-zinc-300');
        }
        if (btnDisconnect) btnDisconnect.classList.add('hidden');
    }

    // Initialize standard stages if not present in db
    if (!db.stages || db.stages.length === 0) {
        db.stages = [
            { key: 'prospect', label: 'Prospect', order: 1, colorClass: 'badge-blue' },
            { key: 'contato', label: 'Contato', order: 2, colorClass: 'badge-purple' },
            { key: 'proposta', label: 'Proposta', order: 3, colorClass: 'badge-amber' },
            { key: 'fechado', label: 'Fechado', order: 4, colorClass: 'badge-emerald' }
        ];
        await saveDataStore(db);
    }
    
    // Theme initialization: default to 'light' since requested by user
    const theme = localStorage.getItem('strivo_theme') || 'light';
    if (theme === 'light') {
        document.body.classList.add('light-theme');
        const icon = document.getElementById('theme-toggle-icon');
        if (icon) icon.innerText = '🌙 Modo Escuro';
    } else {
        document.body.classList.remove('light-theme');
        const icon = document.getElementById('theme-toggle-icon');
        if (icon) icon.innerText = '☀️ Modo Claro';
    }

    // CHECK SESSION
    const loggedUserId = sessionStorage.getItem('strivo_logged_user_id');
    if (!loggedUserId) {
        showLoginScreen();
        return;
    }

    currentUserId = parseInt(loggedUserId);
    const loggedUser = db.users.find(u => u.id === currentUserId);
    if (!loggedUser) {
        sessionStorage.removeItem('strivo_logged_user_id');
        showLoginScreen();
        return;
    }
    currentRole = loggedUser.role;

    hideLoginScreen();
    setupEventListeners();
    switchView('crm');
    renderSidebar();
    renderDashboard();
    renderCRM();
    renderFinancial();
    renderApprovals();
    renderPartnerships();
    populateSelects();
    updateDebugInfo();
}

// Sidebar Navigation
function renderSidebar() {
    const user = db.users.find(u => u.id === currentUserId);
    const container = document.getElementById('sidebar-user-info');
    if (container && user) {
        let roleBadge = `<span class="px-2 py-0.5 rounded text-[9px] font-mono `;
        if (user.role === 'diretoria') roleBadge += 'badge-diretoria">Diretoria';
        else if (user.role === 'lideranca') roleBadge += 'badge-lideranca">Liderança';
        else roleBadge += 'badge-agente">Agente Comercial';
        roleBadge += '</span>';

        container.innerHTML = `
            <div class="font-sans font-bold text-white text-sm">${user.name}</div>
            <div class="font-mono text-[9px] text-zinc-500 mt-1 uppercase flex items-center gap-2">
                ${user.email}
            </div>
            <div class="mt-2">${roleBadge}</div>
        `;

        // Toggle Ajustes Funil (Settings) visibility based on role
        const settingsLink = document.getElementById('sidebar-link-settings');
        if (settingsLink) {
            if (user.role === 'diretoria') {
                settingsLink.classList.remove('hidden');
            } else {
                settingsLink.classList.add('hidden');
            }
        }
    }
}

function setupKanbanDragDropEvents() {
    const columns = document.querySelectorAll('.kanban-column');
    columns.forEach(col => {
        col.addEventListener('dragover', (e) => {
            e.preventDefault();
            col.classList.add('drag-over');
        });
        col.addEventListener('dragleave', () => {
            col.classList.remove('drag-over');
        });
        col.addEventListener('drop', (e) => {
            e.preventDefault();
            col.classList.remove('drag-over');
            const leadId = parseInt(e.dataTransfer.getData('text/plain'));
            const targetStatus = col.getAttribute('data-status');
            moveLead(leadId, targetStatus);
        });
    });
}

function setupEventListeners() {
    if (listenersConnected) return;
    listenersConnected = true;

    // Nav links
    document.querySelectorAll('.sidebar-link').forEach(link => {
        // Ignorar o link de logout
        if (link.getAttribute('onclick') && link.getAttribute('onclick').includes('logoutUser')) return;

        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');
            document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            switchView(target);
        });
    });
    // Note: Kanban Drag & Drop events are configured dynamically inside renderCRM()
}

function switchView(viewId) {
    if (viewId === 'settings' && currentRole !== 'diretoria') {
        alert("Acesso restrito à Diretoria Comercial.");
        switchView('dashboard');
        return;
    }

    document.querySelectorAll('.app-view').forEach(view => {
        view.classList.add('hidden');
    });
    const activeView = document.getElementById(`view-${viewId}`);
    if (activeView) activeView.classList.remove('hidden');

    // Refresh view specific content
    if (viewId === 'dashboard') renderDashboard();
    else if (viewId === 'crm') renderCRM();
    else if (viewId === 'pipeline') renderPipeline();
    else if (viewId === 'financial') renderFinancial();
    else if (viewId === 'approvals') renderApprovals();
    else if (viewId === 'partnerships') renderPartnerships();
    else if (viewId === 'settings') renderFunnelStages();
}

// Debug Switcher Lógica
function selectDebugRole(role, userId) {
    currentRole = role;
    currentUserId = parseInt(userId);
    sessionStorage.setItem('strivo_logged_user_id', userId);
    renderSidebar();
    
    // Switch active view to crm to show filtered data
    document.querySelectorAll('.sidebar-link').forEach(l => {
        l.classList.remove('active');
        if (l.getAttribute('data-target') === 'crm') l.classList.add('active');
    });
    switchView('crm');
    
    renderCRM();
    renderFinancial();
    renderApprovals();
    renderPartnerships();
    updateDebugInfo();
    
    logSystem(`Sessão chaveada para papel: ${role.toUpperCase()} (ID: ${userId})`);
}

function updateDebugInfo() {
    const debugSelect = document.getElementById('debug-user-select');
    if (debugSelect) {
        debugSelect.value = currentUserId;
    }
}

// ----------------- FILTERS & HIERARCHY RULES -----------------
function getSubordinateUserIds(userId) {
    const subs = [];
    const directSubs = db.users.filter(u => u.parentId === userId);
    directSubs.forEach(u => {
        subs.push(u.id);
        // Recurse in case of nested hierarchy
        const deepSubs = getSubordinateUserIds(u.id);
        deepSubs.forEach(ds => subs.push(ds));
    });
    return subs;
}

function getVisibleUserIds() {
    if (currentRole === 'diretoria') {
        return db.users.map(u => u.id);
    } else if (currentRole === 'lideranca') {
        return [currentUserId, ...getSubordinateUserIds(currentUserId)];
    } else {
        return [currentUserId];
    }
}

// ----------------- MÓDULO 05: DASHBOARD & RELATÓRIOS -----------------
function renderDashboard() {
    const visibleUserIds = getVisibleUserIds();
    const isDir = currentRole === 'diretoria';
    const isLid = currentRole === 'lideranca';

    // Calculate metrics
    // AUM / Total leads value
    const visibleLeads = db.leads.filter(l => visibleUserIds.includes(l.agentId));
    const totalPipeline = visibleLeads.filter(l => l.status !== 'fechado').reduce((acc, curr) => acc + curr.value, 0);

    // Total Client Accounts
    const visibleClients = db.clients.filter(c => visibleUserIds.includes(c.agentId));

    // Calculate Admin Fee Commissions
    let totalFaturado = 0;
    let totalComissaoRede = 0;
    let totalCasa = 0;

    db.faturamentoHistorico.forEach(fat => {
        const client = db.clients.find(c => c.code === fat.clientCode);
        if (!client) return; // Orphaned

        const product = db.products.find(p => p.id === fat.productId);
        if (!product) return;

        // check if client is within visible hierarchy
        const isClientVisible = visibleUserIds.includes(client.agentId);
        
        // Calculate splits
        const strivoShare = fat.value * (product.splitStrivo / 100);
        const liderShare = fat.value * (product.splitLider / 100);
        const agenteShare = fat.value * (product.splitAgente / 100);

        if (isClientVisible) {
            totalFaturado += fat.value;
            
            if (isDir) {
                totalComissaoRede += (client.leaderId ? liderShare : 0) + agenteShare;
                totalCasa += strivoShare;
            } else if (isLid) {
                // Leader gets leaderShare if they are the leader of that client, plus agentShare if they are the agent
                if (client.leaderId === currentUserId) {
                    totalComissaoRede += liderShare;
                }
                if (client.agentId === currentUserId) {
                    totalComissaoRede += agenteShare;
                }
            } else {
                // Agent gets only their agent share
                if (client.agentId === currentUserId) {
                    totalComissaoRede += agenteShare;
                }
            }
        }
    });

    // Approved Single Fees (Aportes Homologados)
    let totalCaptações = 0;
    let totalFeeCaptaçãoRede = 0;

    db.aportes.forEach(ap => {
        const product = db.products.find(p => p.id === ap.productId);
        if (!product) return;

        const feeValue = ap.value * (product.feeCap / 100);
        const isApVisible = visibleUserIds.includes(ap.agentId);

        if (isApVisible) {
            if (ap.status === 'homologado') {
                totalCaptações += ap.value;
                const liderShare = feeValue * (product.splitLider / 100);
                const agenteShare = feeValue * (product.splitAgente / 100);

                if (isDir) {
                    totalFeeCaptaçãoRede += (ap.leaderId ? liderShare : 0) + agenteShare;
                } else if (isLid) {
                    if (ap.leaderId === currentUserId) totalFeeCaptaçãoRede += liderShare;
                    if (ap.agentId === currentUserId) totalFeeCaptaçãoRede += agenteShare;
                } else {
                    if (ap.agentId === currentUserId) totalFeeCaptaçãoRede += agenteShare;
                }
            }
        }
    });

    // Populate dashboard cards
    document.getElementById('dash-pipeline-value').innerText = formatCurrency(totalPipeline);
    document.getElementById('dash-clients-count').innerText = visibleClients.length;
    
    if (isDir) {
        document.getElementById('dash-main-title').innerText = "Faturamento Total (Casa)";
        document.getElementById('dash-main-value').innerText = formatCurrency(totalCasa);
        document.getElementById('dash-sec-title').innerText = "Comissões Distribuídas (Rede)";
        document.getElementById('dash-sec-value').innerText = formatCurrency(totalComissaoRede);
    } else {
        document.getElementById('dash-main-title').innerText = "Minhas Comissões Recorrentes";
        document.getElementById('dash-main-value').innerText = formatCurrency(totalComissaoRede);
        document.getElementById('dash-sec-title').innerText = "Fees de Captação Homologados";
        document.getElementById('dash-sec-value').innerText = formatCurrency(totalFeeCaptaçãoRede);
    }

    // Render Pipeline by Advisor
    const advisorsBody = document.getElementById('dash-pipeline-advisors-body');
    if (advisorsBody) {
        advisorsBody.innerHTML = '';
        
        // Filter agents/leaders in the visible user list
        const visibleUsers = db.users.filter(u => visibleUserIds.includes(u.id) && (u.role === 'agente' || u.role === 'lideranca'));
        
        // Calculate pipeline value per user (excluding status = 'fechado')
        const pipelineData = visibleUsers.map(user => {
            const userLeads = visibleLeads.filter(l => l.agentId === user.id && l.status !== 'fechado');
            const userPipelineValue = userLeads.reduce((acc, curr) => acc + curr.value, 0);
            return {
                id: user.id,
                name: user.name,
                role: user.role,
                leadsCount: userLeads.length,
                pipelineValue: userPipelineValue
            };
        });

        // Sort by pipeline value descending
        pipelineData.sort((a, b) => b.pipelineValue - a.pipelineValue);

        // Sum values for footer total
        const totalActiveLeadsCount = pipelineData.reduce((acc, curr) => acc + curr.leadsCount, 0);
        const totalActivePipelineValue = pipelineData.reduce((acc, curr) => acc + curr.pipelineValue, 0);

        if (pipelineData.length === 0) {
            advisorsBody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-zinc-500 font-mono text-xs">Nenhum assessor comercial visível.</td></tr>`;
        } else {
            advisorsBody.innerHTML = pipelineData.map(data => {
                const percentage = totalActivePipelineValue > 0 ? (data.pipelineValue / totalActivePipelineValue * 100).toFixed(1) : '0.0';
                const roleLabel = data.role === 'lideranca' ? 'Líder' : 'Agente';
                
                return `
                    <tr class="hover:bg-slate-900/10 transition-colors">
                        <td class="py-2.5 px-4 text-white font-semibold">${data.name}</td>
                        <td class="py-2.5 px-4 font-mono text-[10px] text-zinc-400">${roleLabel}</td>
                        <td class="py-2.5 px-4 text-right text-zinc-300 font-mono text-xs">${data.leadsCount}</td>
                        <td class="py-2.5 px-4 text-right text-emerald-400 font-bold font-mono text-xs">${formatCurrency(data.pipelineValue)}</td>
                        <td class="py-2.5 px-4 text-right text-zinc-300 font-mono text-xs">${percentage}%</td>
                    </tr>
                `;
            }).join('');
        }

        // Update footer totals
        const totalCountEl = document.getElementById('dash-pipeline-advisors-total-count');
        const totalValueEl = document.getElementById('dash-pipeline-advisors-total-value');
        if (totalCountEl) totalCountEl.innerText = totalActiveLeadsCount;
        if (totalValueEl) totalValueEl.innerText = formatCurrency(totalActivePipelineValue);
    }

    // Render Recent Transactions Table
    renderRecentTransactions(visibleUserIds);

    // Render SVG SVG Chart
    renderAnalyticsChart();
}

function renderRecentTransactions(visibleUserIds) {
    const tbody = document.getElementById('dash-transactions-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    const list = [];
    
    // Add processed admin fees
    db.faturamentoHistorico.forEach(fat => {
        const client = db.clients.find(c => c.code === fat.clientCode);
        if (!client || !visibleUserIds.includes(client.agentId)) return;

        const product = db.products.find(p => p.id === fat.productId);
        if (!product) return;

        const agent = db.users.find(u => u.id === client.agentId);

        let payout = 0;
        const liderShare = fat.value * (product.splitLider / 100);
        const agenteShare = fat.value * (product.splitAgente / 100);
        const strivoShare = fat.value * (product.splitStrivo / 100);

        if (currentRole === 'diretoria') payout = strivoShare;
        else if (currentRole === 'lideranca') {
            if (client.leaderId === currentUserId) payout += liderShare;
            if (client.agentId === currentUserId) payout += agenteShare;
        } else {
            if (client.agentId === currentUserId) payout += agenteShare;
        }

        list.push({
            date: fat.processedDate,
            description: `Taxa Adm — ${client.name} (${product.name})`,
            agent: agent ? agent.name : 'N/A',
            total: fat.value,
            net: payout,
            type: 'recorrente'
        });
    });

    // Add homologated Aportes
    db.aportes.filter(ap => ap.status === 'homologado' && visibleUserIds.includes(ap.agentId)).forEach(ap => {
        const product = db.products.find(p => p.id === ap.productId);
        if (!product) return;

        const agent = db.users.find(u => u.id === ap.agentId);
        const feeValue = ap.value * (product.feeCap / 100);

        let payout = 0;
        const liderShare = feeValue * (product.splitLider / 100);
        const agenteShare = feeValue * (product.splitAgente / 100);
        const strivoShare = feeValue * (product.splitStrivo / 100);

        if (currentRole === 'diretoria') payout = strivoShare;
        else if (currentRole === 'lideranca') {
            if (ap.leaderId === currentUserId) payout += liderShare;
            if (ap.agentId === currentUserId) payout += agenteShare;
        } else {
            if (ap.agentId === currentUserId) payout += agenteShare;
        }

        list.push({
            date: ap.date,
            description: `Fee Captação — ${ap.clientName} (${product.name})`,
            agent: agent ? agent.name : 'N/A',
            total: ap.value,
            net: payout,
            type: 'fee'
        });
    });

    // Sort by date desc
    list.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-zinc-500 font-mono text-xs">Nenhum lançamento recente registrado.</td></tr>`;
        return;
    }

    list.slice(0, 5).forEach(item => {
        const badge = item.type === 'recorrente' 
            ? `<span class="px-2 py-0.5 rounded text-[9px] font-mono bg-cyan-950/40 text-cyan-400 border border-cyan-800/40">Recorrente</span>`
            : `<span class="px-2 py-0.5 rounded text-[9px] font-mono bg-yellow-950/40 text-yellow-500 border border-yellow-800/40">Fee Captação</span>`;

        tbody.innerHTML += `
            <tr class="hover:bg-slate-900/10">
                <td class="py-3 px-4 text-zinc-400 font-mono text-xs">${formatDate(item.date)}</td>
                <td class="py-3 px-4 text-zinc-200">${item.description}</td>
                <td class="py-3 px-4 text-zinc-400 font-mono text-xs">${item.agent}</td>
                <td class="py-3 px-4 font-mono text-xs">${badge}</td>
                <td class="py-3 px-4 text-right font-mono text-xs text-emerald-400 font-bold">${formatCurrency(item.net)}</td>
            </tr>
        `;
    });
}

function renderAnalyticsChart() {
    const chartDiv = document.getElementById('analytics-chart-container');
    if (!chartDiv) return;

    // We will render a custom SVG line chart showing the monthly evolution of commissions/revenue
    const dataPoints = [4200, 6800, 5500, 9300, 12800]; // Historical simulation data
    const labels = ["Jan", "Fev", "Mar", "Abr", "Mai"];
    
    let chartColor = '#06b6d4';
    if (currentRole === 'lideranca') chartColor = '#f59e0b';
    if (currentRole === 'agente') chartColor = '#10b981';

    const width = 600;
    const height = 150;
    const padding = 20;

    const maxVal = Math.max(...dataPoints) * 1.15;
    const minVal = 0;

    let pointsPath = '';
    let areaPath = `M ${padding} ${height - padding} `;

    dataPoints.forEach((val, i) => {
        const x = padding + (i * (width - 2 * padding) / (dataPoints.length - 1));
        const y = height - padding - ((val - minVal) * (height - 2 * padding) / (maxVal - minVal));
        
        if (i === 0) {
            pointsPath += `M ${x} ${y} `;
        } else {
            pointsPath += `L ${x} ${y} `;
        }
        areaPath += `L ${x} ${y} `;
    });
    
    areaPath += `L ${width - padding} ${height - padding} Z`;

    let grids = '';
    for(let i=0; i<5; i++) {
        const y = padding + (i * (height - 2 * padding) / 4);
        grids += `<line x1="${padding}" y1="${y}" x2="${width-padding}" y2="${y}" stroke="rgba(255,255,255,0.03)" stroke-width="1" />`;
    }

    let labelsSvg = '';
    labels.forEach((lbl, i) => {
        const x = padding + (i * (width - 2 * padding) / (labels.length - 1));
        labelsSvg += `<text x="${x}" y="${height - 2}" fill="#52525b" font-family="JetBrains Mono" font-size="9" text-anchor="middle">${lbl}</text>`;
    });

    chartDiv.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" class="w-full h-full">
            ${grids}
            <path d="${areaPath}" fill="url(#chartGrad)" opacity="0.1" />
            <path d="${pointsPath}" fill="none" stroke="${chartColor}" stroke-width="2" stroke-linecap="round" />
            ${labelsSvg}
            <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${chartColor}" />
                    <stop offset="100%" stop-color="${chartColor}" stop-opacity="0" />
                </linearGradient>
            </defs>
        </svg>
    `;
}

// ----------------- MÓDULO 02: CRM & KANBAN -----------------
function renderCRM() {
    const visibleUserIds = getVisibleUserIds();
    const visibleLeads = db.leads.filter(l => visibleUserIds.includes(l.agentId));

    // Ensure stages exist
    if (!db.stages || db.stages.length === 0) {
        db.stages = [
            { key: 'prospect', label: 'Prospect', order: 1, colorClass: 'badge-blue' },
            { key: 'contato', label: 'Contato', order: 2, colorClass: 'badge-purple' },
            { key: 'proposta', label: 'Proposta', order: 3, colorClass: 'badge-amber' },
            { key: 'fechado', label: 'Fechado', order: 4, colorClass: 'badge-emerald' }
        ];
        saveDataStore(db);
    }

    const stages = db.stages;

    // 1. Render view according to current view mode
    if (currentCRMView === 'kanban') {
        const grid = document.getElementById('crm-kanban-columns-grid');
        if (!grid) return;

        // Dynamically set grid columns based on number of stages
        grid.style.gridTemplateColumns = `repeat(${stages.length}, minmax(220px, 1fr))`;
        grid.innerHTML = '';

        stages.forEach(stage => {
            const stageLeads = visibleLeads.filter(l => l.status === stage.key);

            // Build column container
            const colWrapper = document.createElement('div');
            colWrapper.className = 'glass-card p-4 space-y-4 flex flex-col';

            // Column header
            const header = document.createElement('div');
            header.className = 'flex justify-between items-center border-b border-zinc-800 pb-2';
            header.innerHTML = `
                <span class="font-mono text-[9px] uppercase tracking-wider flex items-center gap-2">
                    <span class="status-badge ${stage.colorClass}">${stage.label}</span>
                </span>
                <span class="text-zinc-500 font-mono text-[9px]">(${stageLeads.length})</span>
            `;
            colWrapper.appendChild(header);

            // Cards container (drop zone)
            const cardsContainer = document.createElement('div');
            cardsContainer.className = 'kanban-column space-y-3 flex-1 min-h-[80px]';
            cardsContainer.setAttribute('data-status', stage.key);

            // Drag & drop events
            cardsContainer.addEventListener('dragover', (e) => {
                e.preventDefault();
                cardsContainer.classList.add('drag-over');
            });
            cardsContainer.addEventListener('dragleave', () => {
                cardsContainer.classList.remove('drag-over');
            });
            cardsContainer.addEventListener('drop', (e) => {
                e.preventDefault();
                cardsContainer.classList.remove('drag-over');
                const leadId = parseInt(e.dataTransfer.getData('text/plain'));
                moveLead(leadId, stage.key);
            });

            if (stageLeads.length === 0) {
                cardsContainer.innerHTML = `<div class="py-12 text-center text-zinc-600 font-mono text-[10px]">Arraste leads aqui</div>`;
            } else {
                stageLeads.forEach(lead => {
                    const product = db.products.find(p => p.id === lead.productId);
                    const agent = db.users.find(u => u.id === lead.agentId);

                    const card = document.createElement('div');
                    card.className = 'lead-card space-y-3';
                    card.draggable = true;
                    card.setAttribute('data-id', lead.id);

                    card.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('text/plain', lead.id);
                    });

                    // Split text configuration
                    let splitText = '';
                    if (lead.splits && lead.splits.length > 1) {
                        splitText = `<span class="bg-zinc-800 text-[8px] text-amber-500 font-mono px-1 py-0.5 rounded border border-amber-800/40 uppercase">SPLIT ${lead.splits.length}x</span>`;
                    }

                    let codeBadge = '';
                    if (lead.status === 'fechado' && lead.clientCode) {
                        codeBadge = `<div class="font-mono text-[9px] text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-1.5 py-0.5 rounded mt-2 text-center uppercase tracking-wider">${lead.clientCode}</div>`;
                    }

                    // Create attachments and tasks icons or badges
                    let metaBadges = '';
                    if ((lead.attachments && lead.attachments.length > 0) || (lead.tasks && lead.tasks.length > 0)) {
                        let attachmentIcon = '';
                        if (lead.attachments && lead.attachments.length > 0) {
                            attachmentIcon = `<span class="bg-zinc-800/80 text-cyan-400 px-1.5 py-0.5 rounded border border-zinc-700/50" title="${lead.attachments.length} anexo(s)">📎 ${lead.attachments.length}</span>`;
                        }

                        let taskIcon = '';
                        if (lead.tasks && lead.tasks.length > 0) {
                            const completedTasks = lead.tasks.filter(t => t.completed).length;
                            const totalTasks = lead.tasks.length;
                            const colorClass = completedTasks === totalTasks ? 'text-emerald-400 border-emerald-900/50' : 'text-amber-500 border-amber-900/50';
                            taskIcon = `<span class="bg-zinc-800/80 px-1.5 py-0.5 rounded border ${colorClass}" title="${completedTasks}/${totalTasks} tarefas concluídas">📅 ${completedTasks}/${totalTasks}</span>`;
                        }
                        metaBadges = `<div class="flex gap-1.5 mt-2 font-mono text-[8px]">${attachmentIcon}${taskIcon}</div>`;
                    }

                    card.innerHTML = `
                        <div class="flex justify-between items-start">
                            <h4 class="font-bold text-xs text-white leading-snug">${lead.name}</h4>
                            ${splitText}
                        </div>
                        <div class="space-y-1 font-mono text-[9px] text-zinc-400">
                            <div>PRODUTO: <span class="text-zinc-200">${product ? product.name : 'Indefinido'}</span></div>
                            <div>VALOR: <span class="text-emerald-400 font-bold">${formatCurrency(lead.value)}</span></div>
                            <div>ASSESSOR: <span class="text-zinc-200">${agent ? agent.name : 'N/A'}</span></div>
                        </div>
                        ${metaBadges}
                        <div class="flex justify-end gap-1.5 pt-1">
                            <button onclick="openLeadModal(${lead.id})" class="text-[9px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors uppercase">[ Editar ]</button>
                        </div>
                        ${codeBadge}
                    `;

                    cardsContainer.appendChild(card);
                });
            }

            colWrapper.appendChild(cardsContainer);
            grid.appendChild(colWrapper);
        });

    } else if (currentCRMView === 'list') {
        const tableBody = document.getElementById('crm-list-table-body');
        if (!tableBody) return;

        if (visibleLeads.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-zinc-500 font-mono text-xs">Nenhum lead sob sua visualização.</td></tr>`;
            return;
        }

        tableBody.innerHTML = visibleLeads.map(lead => {
            const product = db.products.find(p => p.id === lead.productId);
            const agent = db.users.find(u => u.id === lead.agentId);

            // Get status tag color/label from dynamic stages
            const stageInfo = stages.find(s => s.key === lead.status);
            const stageIdx = stageInfo ? stages.indexOf(stageInfo) + 1 : 0;
            const statusText = stageInfo ? `${String(stageIdx).padStart(2, '0')}. ${stageInfo.label}` : lead.status.toUpperCase();
            const statusBadgeClass = stageInfo ? `status-badge ${stageInfo.colorClass}` : 'status-badge badge-zinc';

            // Task completion meta for list view
            let taskMeta = '';
            if (lead.tasks && lead.tasks.length > 0) {
                const completed = lead.tasks.filter(t => t.completed).length;
                taskMeta = `<span class="ml-1 text-[9px] font-mono text-zinc-500" title="Tarefas">(📅 ${completed}/${lead.tasks.length})</span>`;
            }

            let attachmentMeta = '';
            if (lead.attachments && lead.attachments.length > 0) {
                attachmentMeta = `<span class="ml-1 text-[9px] font-mono text-cyan-400" title="Anexos">(📎 ${lead.attachments.length})</span>`;
            }

            return `
                <tr class="hover:bg-slate-900/30 transition-colors">
                    <td class="py-2.5 px-4 font-semibold text-white">
                        <div class="flex items-center gap-1">
                            ${lead.name}
                            ${attachmentMeta}
                            ${taskMeta}
                        </div>
                    </td>
                    <td class="py-2.5 px-4 font-mono text-[11px] text-zinc-350">${lead.phone || '-'}</td>
                    <td class="py-2.5 px-4 font-sans text-xs text-zinc-350">${lead.email || '-'}</td>
                    <td class="py-2.5 px-4">
                        <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${statusBadgeClass}">
                            ${statusText}
                        </span>
                    </td>
                    <td class="py-2.5 px-4 text-zinc-300 font-sans text-xs">${agent ? agent.name : 'N/A'}</td>
                    <td class="py-2.5 px-4 text-right font-mono text-[11px] text-emerald-400 font-bold">${formatCurrency(lead.value)}</td>
                    <td class="py-2.5 px-4 text-right">
                        <button onclick="openLeadModal(${lead.id})" class="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-colors font-mono text-[10px] px-2 py-1 rounded uppercase font-bold">
                            Editar
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }
}

function moveLead(leadId, targetStatus) {
    const lead = db.leads.find(l => l.id === leadId);
    if (!lead) return;

    // Check permissions: only assigned agent or their leader or director can move lead
    const visibleUserIds = getVisibleUserIds();
    if (!visibleUserIds.includes(lead.agentId)) {
        alert("Sem permissão para alterar este lead.");
        renderCRM();
        return;
    }

    const oldStatus = lead.status;
    lead.status = targetStatus;

    // Se moveu para "fechado" e não tem código de cliente, gera um código automático de cliente e cadastra
    if (targetStatus === 'fechado' && !lead.clientCode) {
        const product = db.products.find(p => p.id === lead.productId);
        const codePrefix = product ? product.name.substring(0, 3).toUpperCase() : 'STV';
        const num = Math.floor(100 + Math.random() * 900);
        lead.clientCode = `CLI-${codePrefix}-${num}`;

        // Cadastra na lista de clientes ativos se já não existir
        const exists = db.clients.some(c => c.code === lead.clientCode);
        if (!exists) {
            db.clients.push({
                code: lead.clientCode,
                name: lead.name,
                agentId: lead.agentId,
                leaderId: lead.leaderId,
                productId: lead.productId
            });
            logSystem(`Lead convertido em cliente: ${lead.name} (${lead.clientCode})`);
        }
    }

    saveDataStore(db);
    renderCRM();
    logSystem(`Lead "${lead.name}" movido de ${oldStatus.toUpperCase()} para ${targetStatus.toUpperCase()}`);
}

function openLeadModal(leadId) {
    const lead = leadId ? db.leads.find(l => l.id === leadId) : null;
    const modal = document.getElementById('lead-modal');
    if (!modal) return;

    // Fill selects
    const productSelect = document.getElementById('lead-modal-product');
    const agentSelect = document.getElementById('lead-modal-agent');
    const stageSelect = document.getElementById('lead-modal-stage');
    
    productSelect.innerHTML = db.products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    
    // Filter agents select by hierarchy
    const visibleUsers = db.users.filter(u => u.role === 'agente' || u.role === 'lideranca');
    agentSelect.innerHTML = visibleUsers.map(u => `<option value="${u.id}">${u.name} (${u.role.toUpperCase()})</option>`).join('');

    // Fill dynamic stages select
    if (stageSelect && db.stages) {
        stageSelect.innerHTML = db.stages.map(s => `<option value="${s.key}">${s.label}</option>`).join('');
    }

    const tasksList = document.getElementById('lead-tasks-list');
    const attachmentsList = document.getElementById('lead-attachments-list');
    const taskForm = document.getElementById('add-task-form-container');
    const attachmentForm = document.getElementById('add-attachment-container');

    if (lead) {
        document.getElementById('lead-modal-title').innerText = "Editar Lead";
        document.getElementById('lead-modal-id').value = lead.id;
        document.getElementById('lead-modal-name').value = lead.name;
        document.getElementById('lead-modal-value').value = lead.value;
        document.getElementById('lead-modal-phone').value = lead.phone || '';
        document.getElementById('lead-modal-email').value = lead.email || '';
        document.getElementById('lead-modal-source').value = lead.source || '';
        document.getElementById('lead-modal-extrainfo').value = lead.extraInfo || '';
        productSelect.value = lead.productId;
        agentSelect.value = lead.agentId;
        if (stageSelect) stageSelect.value = lead.status;

        // Reset tasks inputs
        document.getElementById('new-task-text').value = '';
        document.getElementById('new-task-date').value = new Date().toISOString().split('T')[0];

        // Enable and render tasks / attachments
        if (taskForm) taskForm.classList.remove('hidden');
        if (attachmentForm) attachmentForm.classList.remove('hidden');
        renderLeadTasks(lead.id);
        renderLeadAttachments(lead.id);
    } else {
        document.getElementById('lead-modal-title').innerText = "Novo Lead";
        document.getElementById('lead-modal-id').value = '';
        document.getElementById('lead-modal-name').value = '';
        document.getElementById('lead-modal-value').value = '100000';
        document.getElementById('lead-modal-phone').value = '';
        document.getElementById('lead-modal-email').value = '';
        document.getElementById('lead-modal-source').value = '';
        document.getElementById('lead-modal-extrainfo').value = '';
        productSelect.selectedIndex = 0;
        agentSelect.value = currentUserId; // default to active user if they can register
        if (stageSelect) stageSelect.selectedIndex = 0;

        // Hide task/attachment creation forms and show info message
        if (taskForm) taskForm.classList.add('hidden');
        if (attachmentForm) attachmentForm.classList.add('hidden');
        
        if (tasksList) {
            tasksList.innerHTML = `<div class="py-4 text-center text-zinc-500 font-mono text-[10px]">Salve o lead primeiro para agendar tarefas.</div>`;
        }
        if (attachmentsList) {
            attachmentsList.innerHTML = `<div class="py-4 text-center text-zinc-500 font-mono text-[10px]">Salve o lead primeiro para anexar arquivos.</div>`;
        }
    }

    modal.classList.remove('hidden');
}

function closeLeadModal() {
    const modal = document.getElementById('lead-modal');
    if (modal) modal.classList.add('hidden');
}

function saveLead(event) {
    event.preventDefault();
    const idVal = document.getElementById('lead-modal-id').value;
    const name = document.getElementById('lead-modal-name').value;
    const value = parseFloat(document.getElementById('lead-modal-value').value);
    const productId = parseInt(document.getElementById('lead-modal-product').value);
    const agentId = parseInt(document.getElementById('lead-modal-agent').value);
    const phone = document.getElementById('lead-modal-phone').value;
    const email = document.getElementById('lead-modal-email').value;
    const source = document.getElementById('lead-modal-source').value;
    const extraInfo = document.getElementById('lead-modal-extrainfo').value;
    const stage = document.getElementById('lead-modal-stage').value;

    const agent = db.users.find(u => u.id === agentId);
    const leaderId = agent ? agent.parentId : null;

    if (idVal) {
        // Edit
        const lead = db.leads.find(l => l.id === parseInt(idVal));
        if (lead) {
            lead.name = name;
            lead.value = value;
            lead.productId = productId;
            lead.agentId = agentId;
            lead.leaderId = leaderId;
            lead.phone = phone;
            lead.email = email;
            lead.source = source;
            lead.extraInfo = extraInfo;
            // update split to 100% for that single advisor by default if changed
            lead.splits = [{ agentId: agentId, pct: 100 }];

            // Convert to client if stage changed to fechado and code is not set
            if (stage === 'fechado' && lead.status !== 'fechado' && !lead.clientCode) {
                const product = db.products.find(p => p.id === productId);
                const codePrefix = product ? product.name.substring(0, 3).toUpperCase() : 'STV';
                const num = Math.floor(100 + Math.random() * 900);
                lead.clientCode = `CLI-${codePrefix}-${num}`;

                const exists = db.clients.some(c => c.code === lead.clientCode);
                if (!exists) {
                    db.clients.push({
                        code: lead.clientCode,
                        name: lead.name,
                        agentId: agentId,
                        leaderId: leaderId,
                        productId: productId
                    });
                    logSystem(`Lead convertido em cliente: ${lead.name} (${lead.clientCode})`);
                }
            }
            lead.status = stage;
        }
    } else {
        // Create
        const newId = 100 + db.leads.length + 1;
        let clientCode = null;
        
        if (stage === 'fechado') {
            const product = db.products.find(p => p.id === productId);
            const codePrefix = product ? product.name.substring(0, 3).toUpperCase() : 'STV';
            const num = Math.floor(100 + Math.random() * 900);
            clientCode = `CLI-${codePrefix}-${num}`;

            db.clients.push({
                code: clientCode,
                name: name,
                agentId: agentId,
                leaderId: leaderId,
                productId: productId
            });
            logSystem(`Lead convertido em cliente no ato de criação: ${name} (${clientCode})`);
        }

        db.leads.push({
            id: newId,
            name: name,
            status: stage,
            productId: productId,
            agentId: agentId,
            leaderId: leaderId,
            value: value,
            splits: [{ agentId: agentId, pct: 100 }],
            createdDate: new Date().toISOString().split('T')[0],
            phone: phone,
            email: email,
            source: source,
            extraInfo: extraInfo,
            attachments: [],
            tasks: [],
            clientCode: clientCode
        });
        logSystem(`Novo Lead adicionado: ${name}`);
    }

    saveDataStore(db);
    closeLeadModal();
    renderCRM();
}

// CRM View Toggle Logic
function setCRMView(viewMode) {
    currentCRMView = viewMode;
    
    const btnKanban = document.getElementById('toggle-view-kanban');
    const btnList = document.getElementById('toggle-view-list');
    
    if (btnKanban && btnList) {
        btnKanban.classList.remove('active');
        btnList.classList.remove('active');
        
        if (viewMode === 'kanban') {
            btnKanban.classList.add('active');
        } else {
            btnList.classList.add('active');
        }
    }
    
    const kanbanView = document.getElementById('crm-kanban-view');
    const listView = document.getElementById('crm-list-view');
    
    if (kanbanView && listView) {
        if (viewMode === 'kanban') {
            kanbanView.classList.remove('hidden');
            listView.classList.add('hidden');
        } else {
            listView.classList.remove('hidden');
            kanbanView.classList.add('hidden');
        }
    }
    
    renderCRM();
}

// Lead Tasks Logic
function renderLeadTasks(leadId) {
    const lead = db.leads.find(l => l.id === leadId);
    const container = document.getElementById('lead-tasks-list');
    if (!container) return;

    if (!lead || !lead.tasks || lead.tasks.length === 0) {
        container.innerHTML = `<div class="py-4 text-center text-zinc-500 font-mono text-[10px]">Nenhuma tarefa agendada.</div>`;
        return;
    }

    container.innerHTML = lead.tasks.map(task => {
        const completedClass = task.completed ? 'completed' : '';
        const textCompletedClass = task.completed ? 'task-text-completed' : '';
        const checkedAttr = task.completed ? 'checked' : '';
        
        return `
            <div class="task-item ${completedClass} flex items-center justify-between">
                <div class="flex items-start gap-2.5 flex-1 min-w-0">
                    <input type="checkbox" ${checkedAttr} onclick="toggleLeadTask(${leadId}, ${task.id})" class="mt-0.5 rounded border-zinc-800 text-cyan-500 focus:ring-0 focus:ring-offset-0 bg-slate-900 cursor-pointer">
                    <div class="min-w-0">
                        <p class="text-zinc-200 text-xs font-sans break-all ${textCompletedClass}">${task.text}</p>
                        <span class="text-[9px] font-mono text-zinc-500">Prazo: ${formatDate(task.dueDate)}</span>
                    </div>
                </div>
                <button type="button" onclick="deleteLeadTask(${leadId}, ${task.id})" class="text-red-500/70 hover:text-red-400 font-mono text-[9px] uppercase ml-2 select-none">[ Excluir ]</button>
            </div>
        `;
    }).join('');
}

function addCurrentLeadTask() {
    const leadIdVal = document.getElementById('lead-modal-id').value;
    if (!leadIdVal) return;
    const leadId = parseInt(leadIdVal);
    const lead = db.leads.find(l => l.id === leadId);
    if (!lead) return;

    const taskText = document.getElementById('new-task-text').value.trim();
    let taskDate = document.getElementById('new-task-date').value;

    if (!taskText) {
        alert('Por favor, descreva a tarefa.');
        return;
    }

    if (!taskDate) {
        taskDate = new Date().toISOString().split('T')[0];
    }

    if (!lead.tasks) lead.tasks = [];

    const newTaskId = lead.tasks.length > 0 ? Math.max(...lead.tasks.map(t => t.id)) + 1 : 1;
    lead.tasks.push({
        id: newTaskId,
        text: taskText,
        dueDate: taskDate,
        completed: false
    });

    saveDataStore(db);
    logSystem(`Tarefa agendada para lead "${lead.name}": ${taskText}`);
    
    document.getElementById('new-task-text').value = '';
    document.getElementById('new-task-date').value = new Date().toISOString().split('T')[0];
    
    renderLeadTasks(leadId);
    renderCRM();
}

function toggleLeadTask(leadId, taskId) {
    const lead = db.leads.find(l => l.id === leadId);
    if (!lead || !lead.tasks) return;

    const task = lead.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    saveDataStore(db);
    logSystem(`Tarefa "${task.text}" no lead "${lead.name}" marcada como ${task.completed ? 'CONCLUÍDA' : 'PENDENTE'}`);
    
    renderLeadTasks(leadId);
    renderCRM();
}

function deleteLeadTask(leadId, taskId) {
    const lead = db.leads.find(l => l.id === leadId);
    if (!lead || !lead.tasks) return;

    const taskIndex = lead.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const taskText = lead.tasks[taskIndex].text;
    lead.tasks.splice(taskIndex, 1);
    saveDataStore(db);
    logSystem(`Tarefa "${taskText}" excluída do lead "${lead.name}"`);
    
    renderLeadTasks(leadId);
    renderCRM();
}

// Lead Attachments Logic
function renderLeadAttachments(leadId) {
    const lead = db.leads.find(l => l.id === leadId);
    const container = document.getElementById('lead-attachments-list');
    if (!container) return;

    if (!lead || !lead.attachments || lead.attachments.length === 0) {
        container.innerHTML = `<div class="py-4 text-center text-zinc-500 font-mono text-[10px]">Nenhum anexo encontrado.</div>`;
        return;
    }

    container.innerHTML = lead.attachments.map((file, index) => {
        return `
            <div class="attachment-item flex items-center justify-between">
                <div class="flex items-center gap-2 flex-1 min-w-0">
                    <span class="text-base shrink-0">📄</span>
                    <div class="min-w-0">
                        <a href="javascript:void(0)" onclick="downloadLeadAttachment(${leadId}, ${index})" class="attachment-name font-semibold hover:text-cyan-400 hover:underline block truncate">${file.name}</a>
                        <span class="attachment-meta">${file.size} • ${formatDate(file.date)}</span>
                    </div>
                </div>
                <button type="button" onclick="deleteLeadAttachment(${leadId}, ${index})" class="text-red-500/70 hover:text-red-400 font-mono text-[9px] uppercase ml-2 select-none">[ Excluir ]</button>
            </div>
        `;
    }).join('');
}

function uploadCurrentLeadFile(fileInput) {
    const leadIdVal = document.getElementById('lead-modal-id').value;
    if (!leadIdVal) return;
    const leadId = parseInt(leadIdVal);
    const lead = db.leads.find(l => l.id === leadId);
    if (!lead) return;

    if (fileInput.files.length === 0) return;
    const file = fileInput.files[0];

    let sizeStr = '';
    if (file.size < 1024 * 1024) {
        sizeStr = (file.size / 1024).toFixed(1) + ' KB';
    } else {
        sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    }

    if (!lead.attachments) lead.attachments = [];

    lead.attachments.push({
        name: file.name,
        size: sizeStr,
        date: new Date().toISOString().split('T')[0]
    });

    saveDataStore(db);
    logSystem(`Arquivo anexado ao lead "${lead.name}": ${file.name} (${sizeStr})`);
    
    fileInput.value = ''; // clear input
    renderLeadAttachments(leadId);
    renderCRM();
}

function deleteLeadAttachment(leadId, index) {
    const lead = db.leads.find(l => l.id === leadId);
    if (!lead || !lead.attachments) return;

    const file = lead.attachments[index];
    if (!file) return;

    lead.attachments.splice(index, 1);
    saveDataStore(db);
    logSystem(`Anexo "${file.name}" excluído do lead "${lead.name}"`);
    
    renderLeadAttachments(leadId);
    renderCRM();
}

function downloadLeadAttachment(leadId, index) {
    const lead = db.leads.find(l => l.id === leadId);
    if (!lead || !lead.attachments || !lead.attachments[index]) return;
    const file = lead.attachments[index];
    
    const content = `Simulação de arquivo anexo da plataforma Strivo.\n\nNome do arquivo: ${file.name}\nTamanho: ${file.size}\nData de upload: ${file.date}\nLead: ${lead.name}\n\nEste é um arquivo simulado gerado pelo CRM Strivo.`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.endsWith('.txt') || file.name.endsWith('.pdf') || file.name.endsWith('.docx') || file.name.endsWith('.xlsx') ? file.name : file.name + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    logSystem(`Download do anexo simulado: ${file.name}`);
}

// ----------------- MÓDULO 03: MOTOR DE FATURAMENTO -----------------
function renderFinancial() {
    // Render list of processed items
    const tbody = document.getElementById('fin-statements-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    const visibleUserIds = getVisibleUserIds();

    const list = db.faturamentoHistorico.filter(fat => {
        const client = db.clients.find(c => c.code === fat.clientCode);
        return client && visibleUserIds.includes(client.agentId);
    });

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-zinc-500 font-mono text-xs">Nenhum faturamento processado na competência atual.</td></tr>`;
        return;
    }

    list.forEach(fat => {
        const client = db.clients.find(c => c.code === fat.clientCode);
        const product = db.products.find(p => p.id === fat.productId);
        const agent = db.users.find(u => u.id === client.agentId);

        let payoutStrivo = fat.value * (product.splitStrivo / 100);
        let payoutLider = fat.value * (product.splitLider / 100);
        let payoutAgente = fat.value * (product.splitAgente / 100);

        tbody.innerHTML += `
            <tr class="hover:bg-slate-900/10">
                <td class="py-3 px-4 font-mono text-xs text-zinc-400">${fat.period}</td>
                <td class="py-3 px-4 font-mono text-xs text-cyan-400">${fat.clientCode}</td>
                <td class="py-3 px-4 text-zinc-200">${fat.clientName}</td>
                <td class="py-3 px-4 text-zinc-400">${product ? product.name : 'N/A'}</td>
                <td class="py-3 px-4 font-mono text-xs text-right text-zinc-300">${formatCurrency(fat.value)}</td>
                <td class="py-3 px-4 text-right font-mono text-xs">
                    <div class="text-[10px] text-zinc-500">Casa: ${formatCurrency(payoutStrivo)}</div>
                    <div class="text-[10px] text-amber-500">Líder: ${formatCurrency(payoutLider)}</div>
                    <div class="text-[10px] text-emerald-400">Agente: ${formatCurrency(payoutAgente)}</div>
                </td>
            </tr>
        `;
    });
}

// Upload simulation
function simulateSpreadsheetUpload() {
    const uploadLogs = document.getElementById('upload-processing-logs');
    if (!uploadLogs) return;

    uploadLogs.innerHTML = `<div class="flex items-center gap-2 text-zinc-400 font-mono text-xs"><span class="loader-spin"></span> Processando planilha faturamento_competencia_atual.xlsx...</div>`;

    setTimeout(() => {
        // Read simulate:
        // We will inject new logs. We'll simulate processing a file containing 5 clients.
        // One client (CLI-NEW-999) is orphaned/doesn't exist, which triggers an alert.
        const fileData = [
            { code: "CLI-FIP-001", name: "Arthur Mendes", value: 12000 },
            { code: "CLI-SPK-002", name: "Beatriz Oliveira", value: 9500 },
            { code: "CLI-RES-003", name: "Cesar Albuquerque", value: 5000 },
            { code: "CLI-DIR-004", name: "Daniela Fraga", value: 30000 },
            { code: "CLI-ORFAN-999", name: "Roberto Marinho S/A", value: 15000 }, // Will trigger orphaned alert
        ];

        let processedCount = 0;
        let warningLogs = [];
        let successLogs = [];

        fileData.forEach(row => {
            const client = db.clients.find(c => c.code === row.code);
            if (!client) {
                warningLogs.push(`[ ALERTA ] Código de cliente "${row.code}" (${row.name}) não localizado no sistema. Faturamento de ${formatCurrency(row.value)} bloqueado na carteira de órfãos!`);
                return;
            }

            // check if faturamento exists in current competency
            const exists = db.faturamentoHistorico.find(f => f.period === '2026-06' && f.clientCode === row.code);
            if (exists) {
                exists.value = row.value; // Overwrite
            } else {
                db.faturamentoHistorico.push({
                    period: '2026-06',
                    clientCode: row.code,
                    clientName: row.name,
                    value: row.value,
                    productId: client.productId,
                    processedDate: new Date().toISOString().split('T')[0]
                });
            }
            
            processedCount++;
            successLogs.push(`[ SUCESSO ] Código ${row.code} processado. Divisão calculada.`);
        });

        // Write HTML logs
        let finalLogHtml = `<div class="text-zinc-500 font-mono text-[10px] uppercase border-b border-zinc-800 pb-2 mb-2">// RELATÓRIO DO MOTOR DE RATEIOS</div>`;
        
        warningLogs.forEach(w => {
            finalLogHtml += `<div class="text-rose-400 font-mono text-xs leading-relaxed mt-1">${w}</div>`;
        });

        successLogs.forEach(s => {
            finalLogHtml += `<div class="text-emerald-400 font-mono text-xs leading-relaxed mt-1">${s}</div>`;
        });

        finalLogHtml += `<div class="text-zinc-400 font-mono text-xs mt-3 font-semibold border-t border-zinc-900 pt-2">Upload finalizado. ${processedCount} registros inseridos com sucesso na competência atual (2026-06).</div>`;

        uploadLogs.innerHTML = finalLogHtml;

        // Save states
        saveDataStore(db);
        renderFinancial();
        renderDashboard();
        
        logSystem(`Planilha de faturamento importada com sucesso. ${processedCount} linhas computadas.`);
    }, 2000);
}

// ----------------- MÓDULO 04: CENTRAL DE APROVAÇÕES -----------------
function renderApprovals() {
    const tbody = document.getElementById('approvals-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    const visibleUserIds = getVisibleUserIds();

    const pendingList = db.aportes.filter(ap => {
        // Visibility check
        const isApVisible = visibleUserIds.includes(ap.agentId);
        if (!isApVisible) return false;

        // Filter based on active role
        if (currentRole === 'agente') {
            return true; // show all their own
        } else if (currentRole === 'lideranca') {
            // Leader sees only pending_lider and approved_lider of their subordinates + their own
            return ap.status === 'pendente_lider' || ap.status === 'aprovado_lider' || ap.status === 'homologado';
        } else {
            // Director sees all
            return true;
        }
    });

    if (pendingList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-zinc-500 font-mono text-xs">Nenhum aporte pendente de homologação.</td></tr>`;
        return;
    }

    pendingList.forEach(ap => {
        const product = db.products.find(p => p.id === ap.productId);
        const agent = db.users.find(u => u.id === ap.agentId);
        const feeValue = ap.value * (product ? product.feeCap : 0) / 100;

        let statusBadge = '';
        let actionBtn = '';

        if (ap.status === 'pendente_lider') {
            statusBadge = `<span class="status-badge badge-amber">Aguardando Líder</span>`;
            if (currentRole === 'lideranca' && ap.leaderId === currentUserId) {
                actionBtn = `<button onclick="approveAporte(${ap.id})" class="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold font-mono text-[9px] px-2.5 py-1 rounded transition-colors uppercase">Aprovar</button>`;
            } else if (currentRole === 'diretoria') {
                actionBtn = `<button onclick="approveAporte(${ap.id})" class="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold font-mono text-[9px] px-2.5 py-1 rounded transition-colors uppercase">Aprovar (Líder)</button>`;
            }
        } else if (ap.status === 'aprovado_lider') {
            statusBadge = `<span class="status-badge badge-cyan">Homologação Pendente</span>`;
            if (currentRole === 'diretoria') {
                actionBtn = `<button onclick="homologateAporte(${ap.id})" class="bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold font-mono text-[9px] px-2.5 py-1 rounded transition-colors uppercase">Homologar</button>`;
            }
        } else if (ap.status === 'homologado') {
            statusBadge = `<span class="status-badge badge-emerald">Liberado / Pago</span>`;
        }

        tbody.innerHTML += `
            <tr class="hover:bg-slate-900/10">
                <td class="py-3 px-4 font-mono text-xs text-zinc-400">${formatDate(ap.date)}</td>
                <td class="py-3 px-4 text-zinc-200 font-semibold">${ap.clientName}</td>
                <td class="py-3 px-4 text-zinc-400">${product ? product.name : 'N/A'}</td>
                <td class="py-3 px-4 font-mono text-xs">${agent ? agent.name : 'N/A'}</td>
                <td class="py-3 px-4 font-mono text-xs text-right text-zinc-300">${formatCurrency(ap.value)}</td>
                <td class="py-3 px-4 font-mono text-xs text-right text-emerald-400 font-bold">${formatCurrency(feeValue)}</td>
                <td class="py-3 px-4 font-mono text-xs">${statusBadge}</td>
                <td class="py-3 px-4 text-right">${actionBtn}</td>
            </tr>
        `;
    });
}

function approveAporte(aporteId) {
    const ap = db.aportes.find(a => a.id === aporteId);
    if (!ap) return;

    ap.status = 'aprovado_lider';
    ap.logs.push({
        action: "aprovado_lider",
        user: db.users.find(u => u.id === currentUserId).name,
        date: new Date().toISOString().split('T')[0]
    });

    saveDataStore(db);
    renderApprovals();
    renderDashboard();
    logSystem(`Aporte de "${ap.clientName}" aprovado pela liderança comercial.`);
}

function homologateAporte(aporteId) {
    const ap = db.aportes.find(a => a.id === aporteId);
    if (!ap) return;

    ap.status = 'homologado';
    ap.logs.push({
        action: "homologado",
        user: db.users.find(u => u.id === currentUserId).name,
        date: new Date().toISOString().split('T')[0]
    });

    saveDataStore(db);
    renderApprovals();
    renderDashboard();
    logSystem(`Aporte de "${ap.clientName}" homologado pela diretoria. Comissão liberada.`);
}

function openAporteModal() {
    const modal = document.getElementById('aporte-modal');
    if (!modal) return;

    document.getElementById('aporte-modal-product').innerHTML = db.products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    
    const visibleUsers = db.users.filter(u => u.role === 'agente');
    document.getElementById('aporte-modal-agent').innerHTML = visibleUsers.map(u => `<option value="${u.id}">${u.name}</option>`).join('');

    if (currentRole === 'agente') {
        document.getElementById('aporte-modal-agent').value = currentUserId;
        document.getElementById('aporte-modal-agent-wrapper').classList.add('hidden');
    } else {
        document.getElementById('aporte-modal-agent-wrapper').classList.remove('hidden');
    }

    modal.classList.remove('hidden');
}

function closeAporteModal() {
    const modal = document.getElementById('aporte-modal');
    if (modal) modal.classList.add('hidden');
}

function saveAporte(event) {
    event.preventDefault();
    const name = document.getElementById('aporte-modal-client').value;
    const value = parseFloat(document.getElementById('aporte-modal-value').value);
    const productId = parseInt(document.getElementById('aporte-modal-product').value);
    const agentId = parseInt(document.getElementById('aporte-modal-agent').value);

    const agent = db.users.find(u => u.id === agentId);
    const leaderId = agent ? agent.parentId : null;

    const newId = 200 + db.aportes.length + 1;
    db.aportes.push({
        id: newId,
        clientName: name,
        productId: productId,
        agentId: agentId,
        leaderId: leaderId,
        value: value,
        date: new Date().toISOString().split('T')[0],
        status: "pendente_lider",
        logs: [{ action: "criado", user: db.users.find(u => u.id === currentUserId).name, date: new Date().toISOString().split('T')[0] }]
    });

    saveDataStore(db);
    closeAporteModal();
    renderApprovals();
    logSystem(`Novo aporte cadastrado para "${name}" pelo assessor.`);
}

// ----------------- MÓDULO 01: GESTÃO DE PARCERIAS (CRUD) -----------------
function renderPartnerships() {
    const isDir = currentRole === 'diretoria';
    
    // Render Users Table
    const userTbody = document.getElementById('users-table-body');
    if (userTbody) {
        userTbody.innerHTML = '';
        db.users.forEach(u => {
            const parent = u.parentId ? db.users.find(pu => pu.id === u.parentId) : null;
            let roleBadge = '';
            if (u.role === 'diretoria') roleBadge = `<span class="px-1.5 py-0.5 rounded text-[8px] font-mono badge-diretoria">DIRETORIA</span>`;
            else if (u.role === 'lideranca') roleBadge = `<span class="px-1.5 py-0.5 rounded text-[8px] font-mono badge-lideranca">LIDERANÇA</span>`;
            else roleBadge = `<span class="px-1.5 py-0.5 rounded text-[8px] font-mono badge-agente">AGENTE</span>`;

            let actions = '';
            if (isDir) {
                actions = `<button onclick="editUserPrompt(${u.id})" class="text-[9px] font-mono text-cyan-400 hover:text-cyan-300 mr-2">[ Editar ]</button>`;
            }

            userTbody.innerHTML += `
                <tr class="hover:bg-slate-900/10">
                    <td class="py-2.5 px-4 font-mono text-xs text-zinc-400">${u.id}</td>
                    <td class="py-2.5 px-4 text-zinc-200 font-semibold">${u.name}</td>
                    <td class="py-2.5 px-4 font-mono text-[10px] text-zinc-500">${u.email}</td>
                    <td class="py-2.5 px-4">${roleBadge}</td>
                    <td class="py-2.5 px-4 font-mono text-xs text-zinc-400">${parent ? parent.name : 'N/A'}</td>
                    <td class="py-2.5 px-4 text-right">${actions}</td>
                </tr>
            `;
        });
    }

    // Render Products Table
    const prodTbody = document.getElementById('products-table-body');
    if (prodTbody) {
        prodTbody.innerHTML = '';
        db.products.forEach(p => {
            let actions = '';
            if (isDir) {
                actions = `<button onclick="editProductPrompt(${p.id})" class="text-[9px] font-mono text-cyan-400 hover:text-cyan-300 mr-2">[ Editar ]</button>`;
            }

            prodTbody.innerHTML += `
                <tr class="hover:bg-slate-900/10">
                    <td class="py-2.5 px-4 font-mono text-xs text-zinc-400">${p.id}</td>
                    <td class="py-2.5 px-4 text-zinc-200 font-semibold">${p.name}</td>
                    <td class="py-2.5 px-4 font-mono text-xs text-zinc-300 text-right">${p.taxAdm.toFixed(1)}%</td>
                    <td class="py-2.5 px-4 font-mono text-xs text-zinc-300 text-right">${p.feeCap.toFixed(1)}%</td>
                    <td class="py-2.5 px-4 font-mono text-xs text-right">
                        <div class="text-[10px] text-zinc-400">Casa: ${p.splitStrivo}% / Líder: ${p.splitLider}% / Agente: ${p.splitAgente}%</div>
                    </td>
                    <td class="py-2.5 px-4 text-right">${actions}</td>
                </tr>
            `;
        });
    }
}

function openUserModal() {
    if (currentRole !== 'diretoria') {
        alert("Apenas a Diretoria pode gerenciar usuários.");
        return;
    }
    const modal = document.getElementById('user-modal');
    if (!modal) return;

    // populate leaders select
    const leaders = db.users.filter(u => u.role === 'lideranca');
    const leaderSelect = document.getElementById('user-modal-parent');
    leaderSelect.innerHTML = `<option value="">Nenhum (Direto)</option>` + 
        leaders.map(l => `<option value="${l.id}">${l.name}</option>`).join('');

    document.getElementById('user-modal-title').innerText = "Novo Usuário";
    document.getElementById('user-modal-id').value = '';
    document.getElementById('user-modal-name').value = '';
    document.getElementById('user-modal-email').value = '';
    document.getElementById('user-modal-role').value = 'agente';
    leaderSelect.value = '';

    modal.classList.remove('hidden');
}

function closeUserModal() {
    const modal = document.getElementById('user-modal');
    if (modal) modal.classList.add('hidden');
}

function editUserPrompt(userId) {
    const user = db.users.find(u => u.id === userId);
    if (!user) return;

    openUserModal();
    document.getElementById('user-modal-title').innerText = "Editar Usuário";
    document.getElementById('user-modal-id').value = user.id;
    document.getElementById('user-modal-name').value = user.name;
    document.getElementById('user-modal-email').value = user.email;
    document.getElementById('user-modal-role').value = user.role;
    document.getElementById('user-modal-parent').value = user.parentId || '';
}

function saveUser(event) {
    event.preventDefault();
    const idVal = document.getElementById('user-modal-id').value;
    const name = document.getElementById('user-modal-name').value;
    const email = document.getElementById('user-modal-email').value;
    const role = document.getElementById('user-modal-role').value;
    const parentIdVal = document.getElementById('user-modal-parent').value;
    const parentId = parentIdVal ? parseInt(parentIdVal) : null;

    if (idVal) {
        // Edit
        const user = db.users.find(u => u.id === parseInt(idVal));
        if (user) {
            user.name = name;
            user.email = email;
            user.role = role;
            user.parentId = parentId;
        }
        logSystem(`Usuário atualizado: ${name}`);
    } else {
        // Create
        const newId = db.users.length + 1;
        db.users.push({
            id: newId,
            name: name,
            email: email,
            role: role,
            parentId: parentId,
            status: "active"
        });
        logSystem(`Novo usuário cadastrado: ${name} (${role.toUpperCase()})`);
    }

    saveDataStore(db);
    closeUserModal();
    populateSelects();
    renderPartnerships();
    renderSidebar();
}

function openProductModal() {
    if (currentRole !== 'diretoria') {
        alert("Apenas a Diretoria pode gerenciar produtos.");
        return;
    }
    const modal = document.getElementById('product-modal');
    if (!modal) return;

    document.getElementById('product-modal-title').innerText = "Novo Produto / Fundo";
    document.getElementById('product-modal-id').value = '';
    document.getElementById('product-modal-name').value = '';
    document.getElementById('product-modal-taxadm').value = '2.0';
    document.getElementById('product-modal-feecap').value = '1.5';
    document.getElementById('product-modal-splitstrivo').value = '60';
    document.getElementById('product-modal-splitlider').value = '15';
    document.getElementById('product-modal-splitagente').value = '25';

    modal.classList.remove('hidden');
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    if (modal) modal.classList.add('hidden');
}

function editProductPrompt(productId) {
    const p = db.products.find(prod => prod.id === productId);
    if (!p) return;

    openProductModal();
    document.getElementById('product-modal-title').innerText = "Editar Produto / Fundo";
    document.getElementById('product-modal-id').value = p.id;
    document.getElementById('product-modal-name').value = p.name;
    document.getElementById('product-modal-taxadm').value = p.taxAdm;
    document.getElementById('product-modal-feecap').value = p.feeCap;
    document.getElementById('product-modal-splitstrivo').value = p.splitStrivo;
    document.getElementById('product-modal-splitlider').value = p.splitLider;
    document.getElementById('product-modal-splitagente').value = p.splitAgente;
}

function saveProduct(event) {
    event.preventDefault();
    const idVal = document.getElementById('product-modal-id').value;
    const name = document.getElementById('product-modal-name').value;
    const taxAdm = parseFloat(document.getElementById('product-modal-taxadm').value);
    const feeCap = parseFloat(document.getElementById('product-modal-feecap').value);
    const splitStrivo = parseInt(document.getElementById('product-modal-splitstrivo').value);
    const splitLider = parseInt(document.getElementById('product-modal-splitlider').value);
    const splitAgente = parseInt(document.getElementById('product-modal-splitagente').value);

    // Validação de soma de split = 100%
    if (splitStrivo + splitLider + splitAgente !== 100) {
        alert("ERRO: A soma dos splits (Casa + Líder + Agente) deve ser exatamente 100%!");
        return;
    }

    if (idVal) {
        // Edit
        const p = db.products.find(prod => prod.id === parseInt(idVal));
        if (p) {
            p.name = name;
            p.taxAdm = taxAdm;
            p.feeCap = feeCap;
            p.splitStrivo = splitStrivo;
            p.splitLider = splitLider;
            p.splitAgente = splitAgente;
        }
        logSystem(`Produto atualizado: ${name}`);
    } else {
        // Create
        const newId = db.products.length + 1;
        db.products.push({
            id: newId,
            name: name,
            taxAdm: taxAdm,
            feeCap: feeCap,
            splitStrivo: splitStrivo,
            splitLider: splitLider,
            splitAgente: splitAgente,
            status: "active"
        });
        logSystem(`Novo Produto adicionado: ${name}`);
    }

    saveDataStore(db);
    closeProductModal();
    renderPartnerships();
}

function populateSelects() {
    const debugSelect = document.getElementById('debug-user-select');
    if (debugSelect) {
        debugSelect.innerHTML = db.users.map(u => `<option value="${u.id}">${u.name} (${u.role.toUpperCase()})</option>`).join('');
    }
}

// ----------------- UTILITIES -----------------
function formatCurrency(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function logSystem(message) {
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    
    db.logs.unshift({
        id: db.logs.length + 1,
        type: "system",
        message: message,
        date: timeStr
    });
    saveDataStore(db);
    
    // Render system log in UI if exists
    const logsContainer = document.getElementById('sys-logs-content');
    if (logsContainer) {
        logsContainer.innerHTML = db.logs.slice(0, 10).map(l => `
            <div class="border-b border-zinc-900 pb-2 mb-2 font-mono text-[11px] text-zinc-400">
                <span class="text-zinc-600">[ ${l.date} ]</span> ${l.message}
            </div>
        `).join('');
    }
}

// Funnel Stages Management
function renderFunnelStages() {
    const container = document.getElementById('funnel-stages-list');
    if (!container) return;

    if (!db.stages) {
        db.stages = [
            { key: 'prospect', label: 'Prospect', order: 1, colorClass: 'badge-blue' },
            { key: 'contato', label: 'Contato', order: 2, colorClass: 'badge-purple' },
            { key: 'proposta', label: 'Proposta', order: 3, colorClass: 'badge-amber' },
            { key: 'fechado', label: 'Fechado', order: 4, colorClass: 'badge-emerald' }
        ];
        saveDataStore(db);
    }

    container.innerHTML = db.stages.map((stage, idx) => {
        const isProtected = stage.key === 'fechado' || stage.key === 'prospect';
        const deleteBtn = isProtected ? 
            `<span class="text-zinc-600 font-mono text-[9px] uppercase tracking-wider select-none">[ Protegido ]</span>` : 
            `<button onclick="deleteStage('${stage.key}')" class="text-red-500 hover:text-red-400 font-mono text-[9px] uppercase tracking-wider select-none">[ Excluir ]</button>`;
        
        const renameAction = isProtected ? '' : `<button onclick="renameStagePrompt('${stage.key}')" class="text-cyan-400 hover:text-cyan-300 font-mono text-[9px] uppercase mr-2">[ Renomear ]</button>`;
        
        const upBtn = idx > 0 ? `<button onclick="moveStageOrder('${stage.key}', -1)" class="text-zinc-400 hover:text-white font-mono text-[10px] font-bold px-1 select-none">▲</button>` : `<span class="text-zinc-700 font-mono text-[10px] px-1 select-none">▲</span>`;
        const downBtn = idx < db.stages.length - 1 ? `<button onclick="moveStageOrder('${stage.key}', 1)" class="text-zinc-400 hover:text-white font-mono text-[10px] font-bold px-1 select-none">▼</button>` : `<span class="text-zinc-700 font-mono text-[10px] px-1 select-none">▼</span>`;

        return `
            <div class="flex items-center justify-between bg-slate-900/40 border border-zinc-900 p-3 rounded-lg">
                <div class="flex items-center gap-3">
                    <div class="flex flex-col items-center">
                        ${upBtn}
                        ${downBtn}
                    </div>
                    <div>
                        <span class="status-badge ${stage.colorClass}">${stage.label}</span>
                        <span class="text-[9px] font-mono text-zinc-500 ml-2">(Chave: ${stage.key})</span>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${renameAction}
                    ${deleteBtn}
                </div>
            </div>
        `;
    }).join('');
}

function createNewStage(event) {
    event.preventDefault();
    const labelInput = document.getElementById('new-stage-label');
    const colorSelect = document.getElementById('new-stage-color');
    if (!labelInput || !colorSelect) return;

    const label = labelInput.value.trim();
    const colorClass = colorSelect.value;

    if (!label) return;

    const key = label.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .trim();

    if (!key || db.stages.some(s => s.key === key)) {
        alert('Já existe uma etapa com nome semelhante. Escolha outro nome.');
        return;
    }

    const nextOrder = db.stages.length > 0 ? Math.max(...db.stages.map(s => s.order)) + 1 : 1;

    db.stages.push({
        key: key,
        label: label,
        order: nextOrder,
        colorClass: colorClass
    });

    saveDataStore(db);
    logSystem(`Nova etapa do funil criada: ${label} (Chave: ${key})`);

    labelInput.value = '';
    colorSelect.selectedIndex = 0;

    renderFunnelStages();
    renderCRM();
}

function deleteStage(stageKey) {
    const count = db.leads.filter(l => l.status === stageKey).length;
    if (count > 0) {
        alert(`Não é possível excluir esta etapa pois existem ${count} lead(s) nela. Mova os leads primeiro.`);
        return;
    }

    if (confirm('Tem certeza que deseja excluir esta etapa do funil?')) {
        db.stages = db.stages.filter(s => s.key !== stageKey);
        saveDataStore(db);
        logSystem(`Etapa do funil excluída: ${stageKey}`);
        renderFunnelStages();
        renderCRM();
    }
}

function renameStagePrompt(stageKey) {
    const stage = db.stages.find(s => s.key === stageKey);
    if (!stage) return;

    const newName = prompt('Digite o novo nome para esta etapa:', stage.label);
    if (newName && newName.trim()) {
        const oldName = stage.label;
        stage.label = newName.trim();
        saveDataStore(db);
        logSystem(`Etapa do funil "${oldName}" renomeada para "${stage.label}"`);
        renderFunnelStages();
        renderCRM();
    }
}

function moveStageOrder(stageKey, direction) {
    const idx = db.stages.findIndex(s => s.key === stageKey);
    if (idx === -1) return;

    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= db.stages.length) return;

    const temp = db.stages[idx];
    db.stages[idx] = db.stages[targetIdx];
    db.stages[targetIdx] = temp;

    db.stages.forEach((s, index) => {
        s.order = index + 1;
    });

    saveDataStore(db);
    logSystem(`Ordem das etapas do funil alterada.`);
    renderFunnelStages();
    renderCRM();
}

// =================== PIPELINE PYRAMID VIEW ===================
function renderPipeline() {
    const visibleUserIds = getVisibleUserIds();
    const visibleLeads = db.leads.filter(l => visibleUserIds.includes(l.agentId));

    // Ensure stages
    if (!db.stages || db.stages.length === 0) return;

    const stages = db.stages;

    // Calculate data per stage
    const stageData = stages.map((stage, idx) => {
        const stageLeads = visibleLeads.filter(l => l.status === stage.key);
        const totalValue = stageLeads.reduce((acc, l) => acc + l.value, 0);
        return {
            key: stage.key,
            label: stage.label,
            colorClass: stage.colorClass,
            leadsCount: stageLeads.length,
            totalValue: totalValue,
            order: idx
        };
    });

    // Sum only active stages (excluding 'fechado') for totals
    const activeStageData = stageData.filter(s => s.key !== 'fechado');
    const grandTotalValue = activeStageData.reduce((acc, s) => acc + s.totalValue, 0);
    const grandTotalLeads = activeStageData.reduce((acc, s) => acc + s.leadsCount, 0);
    const avgTicket = grandTotalLeads > 0 ? grandTotalValue / grandTotalLeads : 0;

    // Update summary cards
    const totalValueEl = document.getElementById('pipeline-total-value');
    const totalLeadsEl = document.getElementById('pipeline-total-leads');
    const avgTicketEl = document.getElementById('pipeline-avg-ticket');
    const stagesCountEl = document.getElementById('pipeline-stages-count');

    if (totalValueEl) totalValueEl.innerText = formatCurrency(grandTotalValue);
    if (totalLeadsEl) totalLeadsEl.innerText = grandTotalLeads;
    if (avgTicketEl) avgTicketEl.innerText = formatCurrency(avgTicket);
    if (stagesCountEl) stagesCountEl.innerText = `${stages.length} etapas ativas`;

    // ---- RENDER PYRAMID ----
    const pyramidContainer = document.getElementById('pipeline-pyramid-container');
    if (!pyramidContainer) return;

    // Map colorClass to pyramid background class
    const colorMap = {
        'badge-blue': 'pyramid-bg-blue',
        'badge-purple': 'pyramid-bg-purple',
        'badge-amber': 'pyramid-bg-amber',
        'badge-emerald': 'pyramid-bg-emerald',
        'badge-cyan': 'pyramid-bg-cyan',
        'badge-zinc': 'pyramid-bg-zinc'
    };

    // Build pyramid: top = widest (first stage), bottom = narrowest (last stage)
    // Width proportionally decreasing from 100% to minimum ~30%
    const totalStages = stageData.length;

    if (totalStages === 0) {
        pyramidContainer.innerHTML = `<div class="py-12 text-center text-zinc-500 font-mono text-xs">Nenhuma etapa configurada.</div>`;
        return;
    }

    let pyramidHTML = '<div class="pyramid-stack">';

    stageData.forEach((stage, idx) => {
        // Width goes from 100% (top) to 35% (bottom) linearly
        const widthPercent = totalStages === 1 ? 100 : 100 - (idx * (65 / (totalStages - 1)));
        
        let percentageLabel = '';
        if (stage.key === 'fechado') {
            percentageLabel = 'Histórico';
        } else {
            const percentage = grandTotalValue > 0 ? (stage.totalValue / grandTotalValue * 100).toFixed(1) : '0.0';
            percentageLabel = `${percentage}%`;
        }
        
        const bgClass = colorMap[stage.colorClass] || 'pyramid-bg-zinc';

        // Rounded corners: top-left/top-right for first layer, bottom-left/bottom-right for last
        let borderRadius = '4px';
        if (idx === 0 && totalStages > 1) borderRadius = '12px 12px 4px 4px';
        else if (idx === totalStages - 1 && totalStages > 1) borderRadius = '4px 4px 12px 12px';
        else if (totalStages === 1) borderRadius = '12px';

        pyramidHTML += `
            <div class="pyramid-layer" style="width: ${widthPercent}%; border-radius: ${borderRadius};">
                <div class="pyramid-layer-inner ${bgClass}" style="border-radius: ${borderRadius};"></div>
                <div class="pyramid-layer-content">
                    <div class="flex items-center gap-3">
                        <span class="pyramid-layer-label">${stage.label}</span>
                        <span class="pyramid-layer-leads">${stage.leadsCount} lead${stage.leadsCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="flex items-center gap-4">
                        <span class="pyramid-layer-leads">${percentageLabel}</span>
                        <span class="pyramid-layer-value">${formatCurrency(stage.totalValue)}</span>
                    </div>
                </div>
            </div>
        `;
    });

    pyramidHTML += '</div>';
    pyramidContainer.innerHTML = pyramidHTML;

    // ---- RENDER PIPELINE BY USER ----
    const usersBody = document.getElementById('pipeline-users-body');
    const usersCountEl = document.getElementById('pipeline-users-count');
    const usersTotalLeadsEl = document.getElementById('pipeline-users-total-leads');
    const usersTotalValueEl = document.getElementById('pipeline-users-total-value');

    if (usersBody) {
        usersBody.innerHTML = '';
        
        // Filter users based on visible user IDs
        const visibleUsers = db.users.filter(u => visibleUserIds.includes(u.id) && (u.role === 'agente' || u.role === 'lideranca' || u.role === 'diretoria'));
        
        // Active stage keys (excluding 'fechado')
        const activeStageKeys = stages.map(s => s.key).filter(k => k !== 'fechado');
        // Leads in active stages
        const activeLeads = visibleLeads.filter(l => activeStageKeys.includes(l.status));
        
        const userPipelineData = visibleUsers.map(user => {
            const userLeads = activeLeads.filter(l => l.agentId === user.id);
            const userPipelineValue = userLeads.reduce((acc, curr) => acc + curr.value, 0);
            return {
                id: user.id,
                name: user.name,
                role: user.role,
                leadsCount: userLeads.length,
                pipelineValue: userPipelineValue
            };
        });

        // Sort descending by value
        userPipelineData.sort((a, b) => b.pipelineValue - a.pipelineValue);

        const totalActiveLeadsCount = userPipelineData.reduce((acc, curr) => acc + curr.leadsCount, 0);
        const totalActivePipelineValue = userPipelineData.reduce((acc, curr) => acc + curr.pipelineValue, 0);

        if (usersCountEl) usersCountEl.innerText = `${visibleUsers.length} assessores`;
        if (usersTotalLeadsEl) usersTotalLeadsEl.innerText = totalActiveLeadsCount;
        if (usersTotalValueEl) usersTotalValueEl.innerText = formatCurrency(totalActivePipelineValue);

        if (userPipelineData.length === 0) {
            usersBody.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-zinc-500 font-mono text-xs">Nenhum assessor com dados.</td></tr>`;
        } else {
            usersBody.innerHTML = userPipelineData.map(data => {
                const percentage = totalActivePipelineValue > 0 ? (data.pipelineValue / totalActivePipelineValue * 100).toFixed(1) : '0.0';
                
                let roleBadge = '';
                if (data.role === 'diretoria') roleBadge = '<span class="text-[8px] px-1 py-0.2 bg-red-950/40 text-red-400 border border-red-900/40 rounded ml-1 font-mono uppercase">Dir</span>';
                else if (data.role === 'lideranca') roleBadge = '<span class="text-[8px] px-1 py-0.2 bg-purple-950/40 text-purple-400 border border-purple-900/40 rounded ml-1 font-mono uppercase">Líd</span>';
                else roleBadge = '<span class="text-[8px] px-1 py-0.2 bg-blue-950/40 text-blue-400 border border-blue-900/40 rounded ml-1 font-mono uppercase">Com</span>';

                return `
                    <tr class="hover:bg-slate-900/30 transition-colors">
                        <td class="py-2.5 px-3">
                            <div class="flex items-center gap-1.5">
                                <span class="font-semibold text-white text-xs">${data.name}</span>
                                ${roleBadge}
                            </div>
                        </td>
                        <td class="py-2.5 px-3 text-right font-mono text-xs text-zinc-300">${data.leadsCount}</td>
                        <td class="py-2.5 px-3 text-right font-mono text-xs text-emerald-400 font-bold">${formatCurrency(data.pipelineValue)}</td>
                        <td class="py-2.5 px-3 text-right font-mono text-xs text-zinc-400">${percentage}%</td>
                    </tr>
                `;
            }).join('');
        }
    }

    // ---- RENDER DETAIL TABLE ----
    const tableBody = document.getElementById('pipeline-detail-body');
    if (tableBody) {
        const maxValue = Math.max(...stageData.map(s => s.totalValue), 1);

        tableBody.innerHTML = stageData.map(stage => {
            let percentageLabel = '';
            if (stage.key === 'fechado') {
                percentageLabel = 'Histórico';
            } else {
                const percentage = grandTotalValue > 0 ? (stage.totalValue / grandTotalValue * 100).toFixed(1) : '0.0';
                percentageLabel = `${percentage}%`;
            }
            
            const barWidth = (stage.totalValue / maxValue * 100).toFixed(1);
            const bgClass = colorMap[stage.colorClass] || 'pyramid-bg-zinc';

            // Get color for progress bar fill
            const fillColors = {
                'badge-blue': '#3b82f6',
                'badge-purple': '#a855f7',
                'badge-amber': '#f59e0b',
                'badge-emerald': '#10b981',
                'badge-cyan': '#06b6d4',
                'badge-zinc': '#71717a'
            };
            const fillColor = fillColors[stage.colorClass] || '#71717a';

            return `
                <tr class="hover:bg-slate-900/30 transition-colors">
                    <td class="py-2.5 px-4">
                        <span class="status-badge ${stage.colorClass}">${stage.label}</span>
                    </td>
                    <td class="py-2.5 px-4 text-right font-mono text-xs text-zinc-300">${stage.leadsCount}</td>
                    <td class="py-2.5 px-4 text-right font-mono text-xs text-emerald-400 font-bold">${formatCurrency(stage.totalValue)}</td>
                    <td class="py-2.5 px-4 text-right font-mono text-xs text-zinc-400">${percentageLabel}</td>
                    <td class="py-2.5 px-4">
                        <div class="pipeline-progress-bar">
                            <div class="pipeline-progress-fill" style="width: ${barWidth}%; background: ${fillColor};"></div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Update footer totals
    const footerLeads = document.getElementById('pipeline-table-total-leads');
    const footerValue = document.getElementById('pipeline-table-total-value');
    if (footerLeads) footerLeads.innerText = grandTotalLeads;
    if (footerValue) footerValue.innerText = formatCurrency(grandTotalValue);
}

function toggleTheme() {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem('strivo_theme', isLight ? 'light' : 'dark');
    const icon = document.getElementById('theme-toggle-icon');
    if (icon) icon.innerText = isLight ? '🌙 Modo Escuro' : '☀️ Modo Claro';
    renderAnalyticsChart(); // Redraw chart
}

// Global Exports for DOM actions
window.selectDebugRole = selectDebugRole;
window.approveAporte = approveAporte;
window.homologateAporte = homologateAporte;
window.openLeadModal = openLeadModal;
window.closeLeadModal = closeLeadModal;
window.saveLead = saveLead;
window.simulateSpreadsheetUpload = simulateSpreadsheetUpload;
window.openAporteModal = openAporteModal;
window.closeAporteModal = closeAporteModal;
window.saveAporte = saveAporte;
window.openUserModal = openUserModal;
window.closeUserModal = closeUserModal;
window.saveUser = saveUser;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.saveProduct = saveProduct;
window.editUserPrompt = editUserPrompt;
window.editProductPrompt = editProductPrompt;
window.switchView = switchView;
window.toggleTheme = toggleTheme;
window.setCRMView = setCRMView;
window.addCurrentLeadTask = addCurrentLeadTask;
window.toggleLeadTask = toggleLeadTask;
window.deleteLeadTask = deleteLeadTask;
window.uploadCurrentLeadFile = uploadCurrentLeadFile;
window.deleteLeadAttachment = deleteLeadAttachment;
window.downloadLeadAttachment = downloadLeadAttachment;
window.renderFunnelStages = renderFunnelStages;
window.createNewStage = createNewStage;
window.deleteStage = deleteStage;
window.renameStagePrompt = renameStagePrompt;
window.moveStageOrder = moveStageOrder;
window.renderPipeline = renderPipeline;

// ================= TELA DE LOGIN & SESSÃO LOGIC =================
function showLoginScreen() {
    const loginContainer = document.getElementById('login-container');
    if (loginContainer) loginContainer.classList.remove('hidden');

    const debugBar = document.querySelector('.debug-bar');
    if (debugBar) debugBar.classList.add('hidden');

    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-error-msg').classList.add('hidden');
}

function hideLoginScreen() {
    const loginContainer = document.getElementById('login-container');
    if (loginContainer) loginContainer.classList.add('hidden');

    const debugBar = document.querySelector('.debug-bar');
    if (debugBar) debugBar.classList.remove('hidden');
}

function attemptLogin(event) {
    if (event) event.preventDefault();
    
    const usernameInput = document.getElementById('login-username').value.trim().toLowerCase();
    const passwordInput = document.getElementById('login-password').value.trim();
    const errorMsg = document.getElementById('login-error-msg');
    const loginCard = document.querySelector('.login-card');

    // Mapeamento especial para sem acentos e normalização simples
    const normalizedUsernameInput = usernameInput.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const user = db.users.find(u => {
        if (!u.username) return false;
        const normalizedDbUsername = u.username.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        return normalizedDbUsername === normalizedUsernameInput && u.password === passwordInput;
    });

    if (user) {
        sessionStorage.setItem('strivo_logged_user_id', user.id);
        errorMsg.classList.add('hidden');
        initApp(); // Reinicializa com a nova sessão do usuário
    } else {
        errorMsg.classList.remove('hidden');
        
        // Efeito Shake no card de login
        if (loginCard) {
            loginCard.classList.add('shake-card');
            setTimeout(() => {
                loginCard.classList.remove('shake-card');
            }, 500);
        }
    }
}

function logoutUser(event) {
    if (event) event.preventDefault();
    if (confirm("Deseja realmente sair da conta comercial?")) {
        sessionStorage.removeItem('strivo_logged_user_id');
        showLoginScreen();
    }
}

function toggleCredentialsPanel() {
    const panel = document.getElementById('credentials-panel');
    const arrow = document.getElementById('credentials-arrow');
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        arrow.innerText = '▲';
    } else {
        panel.classList.add('hidden');
        arrow.innerText = '▼';
    }
}

// Global Exports para Login
window.attemptLogin = attemptLogin;
window.logoutUser = logoutUser;
window.toggleCredentialsPanel = toggleCredentialsPanel;

// ==================== SUPABASE CLOUD SYNC & CONFIG ====================
async function loadDataStoreFromCloud() {
    try {
        const [
            rUsers,
            rProducts,
            rLeads,
            rClients,
            rStages,
            rAportes,
            rFatHistorico
        ] = await Promise.all([
            supabaseClient.from('users').select('*'),
            supabaseClient.from('products').select('*'),
            supabaseClient.from('leads').select('*'),
            supabaseClient.from('clients').select('*'),
            supabaseClient.from('stages').select('*'),
            supabaseClient.from('aportes').select('*'),
            supabaseClient.from('faturamentoHistorico').select('*')
        ]);

        if (rUsers.error) throw rUsers.error;
        if (rProducts.error) throw rProducts.error;
        if (rLeads.error) throw rLeads.error;
        if (rClients.error) throw rClients.error;
        if (rStages.error) throw rStages.error;
        if (rAportes.error) throw rAportes.error;
        if (rFatHistorico.error) throw rFatHistorico.error;

        db = {
            users: rUsers.data || [],
            products: rProducts.data || [],
            leads: rLeads.data || [],
            clients: rClients.data || [],
            stages: rStages.data || [],
            aportes: rAportes.data || [],
            faturamentoHistorico: rFatHistorico.data || []
        };
        
        logSystem("Dados carregados com sucesso do Supabase na nuvem.");
    } catch (err) {
        console.error("Falha ao carregar do Supabase:", err);
        logSystem("Erro de conexão ao carregar dados do Supabase. Usando localBackup.");
        db = loadDataStore();
    }
}

function saveSupabaseConfig(event) {
    if (event) event.preventDefault();
    const url = document.getElementById('supa-url').value.trim();
    const key = document.getElementById('supa-anon-key').value.trim();
    
    if (!url || !key) {
        alert("Por favor, preencha a URL e a Chave Anon do seu Supabase.");
        return;
    }
    
    localStorage.setItem('strivo_supabase_url', url);
    localStorage.setItem('strivo_supabase_key', key);
    alert("Configurações salvas! Conectando ao banco de dados Supabase...");
    initApp();
}

function disconnectSupabase() {
    if (confirm("Deseja realmente desconectar da nuvem e voltar ao Modo Local (offline)?")) {
        localStorage.removeItem('strivo_supabase_url');
        localStorage.removeItem('strivo_supabase_key');
        supabaseClient = null;
        supabaseMode = 'LOCAL';
        alert("Modo Nuvem desconectado.");
        initApp();
    }
}

async function migrateLocalDataToSupabase() {
    if (supabaseMode !== 'CLOUD' || !supabaseClient) {
        alert("Por favor, conecte ao Supabase primeiro!");
        return;
    }
    
    const progressEl = document.getElementById('migration-progress-msg');
    const localData = loadDataStore();
    
    if (progressEl) {
        progressEl.classList.remove('hidden');
        progressEl.innerText = "Iniciando migração...";
    }
    
    try {
        if (progressEl) progressEl.innerText = "Enviando usuários...";
        const rUsers = await supabaseClient.from('users').upsert(localData.users);
        if (rUsers.error) throw rUsers.error;
        
        if (progressEl) progressEl.innerText = "Enviando produtos...";
        const rProducts = await supabaseClient.from('products').upsert(localData.products);
        if (rProducts.error) throw rProducts.error;
        
        if (progressEl) progressEl.innerText = "Enviando estágios...";
        const rStages = await supabaseClient.from('stages').upsert(localData.stages || []);
        if (rStages.error) throw rStages.error;
        
        if (progressEl) progressEl.innerText = "Enviando leads...";
        const rLeads = await supabaseClient.from('leads').upsert(localData.leads);
        if (rLeads.error) throw rLeads.error;
        
        if (progressEl) progressEl.innerText = "Enviando clientes...";
        const rClients = await supabaseClient.from('clients').upsert(localData.clients);
        if (rClients.error) throw rClients.error;
        
        if (progressEl) progressEl.innerText = "Enviando aportes...";
        const rAportes = await supabaseClient.from('aportes').upsert(localData.aportes);
        if (rAportes.error) throw rAportes.error;
        
        if (progressEl) progressEl.innerText = "Enviando histórico de faturamento...";
        const rFat = await supabaseClient.from('faturamentoHistorico').upsert(localData.faturamentoHistorico);
        if (rFat.error) throw rFat.error;
        
        if (progressEl) {
            progressEl.innerText = "✅ Migração de dados concluída com sucesso!";
            setTimeout(() => progressEl.classList.add('hidden'), 5000);
        }
        alert("Toda a sua base local de dados foi migrada e sincronizada com sucesso no Supabase!");
        
        await initApp();
    } catch (err) {
        console.error("Erro na migração de dados:", err);
        if (progressEl) {
            progressEl.innerText = `❌ Erro na migração: ${err.message || err}`;
        }
        alert(`Erro na migração: ${err.message || err}`);
    }
}

async function saveDataStore(data) {
    // 1. Salvar no localStorage local (backup offline)
    localStorage.setItem('strivo_datastore', JSON.stringify(data));
    
    // 2. Se modo nuvem ativo, upsert das tabelas modificadas para o Supabase
    if (supabaseMode === 'CLOUD' && supabaseClient) {
        try {
            await Promise.all([
                supabaseClient.from('users').upsert(data.users),
                supabaseClient.from('products').upsert(data.products),
                supabaseClient.from('stages').upsert(data.stages || []),
                supabaseClient.from('leads').upsert(data.leads),
                supabaseClient.from('clients').upsert(data.clients),
                supabaseClient.from('aportes').upsert(data.aportes),
                supabaseClient.from('faturamentoHistorico').upsert(data.faturamentoHistorico)
            ]);
        } catch (err) {
            console.error("Erro na sincronização automática do Supabase:", err);
            logSystem("Falha ao salvar alterações no Supabase. Modificações mantidas localmente.");
        }
    }
}

// Sobrescrever a função global saveDataStore do mock-data.js
window.saveDataStore = saveDataStore;

// Exportações globais para os formulários do index.html
window.saveSupabaseConfig = saveSupabaseConfig;
window.disconnectSupabase = disconnectSupabase;
window.migrateLocalDataToSupabase = migrateLocalDataToSupabase;
window.loadDataStoreFromCloud = loadDataStoreFromCloud;
