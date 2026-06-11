// STRIVO PLATFORM // INITIAL MOCK DATA DEFINITIONS
const INITIAL_MOCK_DATA = {
    users: [
        { id: 1, name: "Filipe Rosa", role: "diretoria", email: "filipe@vertic.com", parentId: null, status: "active" },
        { id: 2, name: "Marcus Silva", role: "lideranca", email: "marcus.lider@strivo.com", parentId: null, status: "active" },
        { id: 3, name: "Patricia Costa", role: "lideranca", email: "patricia.lider@strivo.com", parentId: null, status: "active" },
        { id: 4, name: "Lucas Nogueira", role: "agente", email: "lucas.agente@strivo.com", parentId: 2, status: "active" },
        { id: 5, name: "Bruna Lima", role: "agente", email: "bruna.agente@strivo.com", parentId: 2, status: "active" },
        { id: 6, name: "Gabriel Santos", role: "agente", email: "gabriel.agente@strivo.com", parentId: 3, status: "active" },
        { id: 7, name: "Renata Rocha", role: "agente", email: "renata.agente@strivo.com", parentId: null, status: "active" }
    ],
    products: [
        { id: 1, name: "Strivo Core FIP", taxAdm: 2.0, feeCap: 1.5, splitStrivo: 60, splitLider: 15, splitAgente: 25, status: "active" },
        { id: 2, name: "Spark Global Equity", taxAdm: 1.5, feeCap: 1.0, splitStrivo: 50, splitLider: 20, splitAgente: 30, status: "active" },
        { id: 3, name: "Reserva Wealth Yield FII", taxAdm: 1.0, feeCap: 2.0, splitStrivo: 70, splitLider: 10, splitAgente: 20, status: "active" },
        { id: 4, name: "PGR Real Estate Fund", taxAdm: 2.5, feeCap: 1.5, splitStrivo: 60, splitLider: 15, splitAgente: 25, status: "active" }
    ],
    leads: [
        { 
            id: 101, 
            name: "Carlos Eduardo Costa", 
            phone: "(11) 99888-7766",
            email: "carlos.eduardo@gmail.com",
            source: "Indicação de Cliente",
            extraInfo: "Cliente interessado em diversificação internacional e blindagem patrimonial.",
            status: "prospect", 
            productId: 1, 
            agentId: 4, 
            leaderId: 2, 
            value: 500000, 
            splits: [{ agentId: 4, pct: 100 }], 
            createdDate: "2026-05-10",
            attachments: [
                { name: "declaracao_bens_carlos.pdf", size: "1.2 MB", date: "2026-05-12" }
            ],
            tasks: [
                { id: 1, text: "Enviar apresentação institucional", dueDate: "2026-06-15", completed: false },
                { id: 2, text: "Ligar para agendar call de alinhamento", dueDate: "2026-06-12", completed: true }
            ]
        },
        { 
            id: 102, 
            name: "Fernanda Souza Lima", 
            phone: "(21) 98777-6655",
            email: "fernanda.souza@yahoo.com.br",
            source: "Anúncio Vertic Tech",
            extraInfo: "Deseja automatizar o controle de faturamento de sua consultoria de RH.",
            status: "contato", 
            productId: 2, 
            agentId: 5, 
            leaderId: 2, 
            value: 1200000, 
            splits: [{ agentId: 5, pct: 100 }], 
            createdDate: "2026-05-15",
            attachments: [],
            tasks: [
                { id: 1, text: "Revisar escopo técnico com equipe Tech", dueDate: "2026-06-18", completed: false }
            ]
        },
        { 
            id: 103, 
            name: "Roberto Andrade Filho", 
            phone: "(31) 97666-5544",
            email: "roberto.filho@andradeadv.com",
            source: "Network Evento Lide",
            extraInfo: "Holding familiar de advocacia. Foco em planejamento sucessório.",
            status: "proposta", 
            productId: 3, 
            agentId: 6, 
            leaderId: 3, 
            value: 800000, 
            splits: [{ agentId: 6, pct: 100 }], 
            createdDate: "2026-05-20",
            attachments: [
                { name: "proposta_comercial_strivo_v1.pdf", size: "2.4 MB", date: "2026-05-21" }
            ],
            tasks: [
                { id: 1, text: "Apresentar proposta de comissões para sócios", dueDate: "2026-06-14", completed: false }
            ]
        },
        { 
            id: 104, 
            name: "Mariana Dias Santos", 
            phone: "(11) 96555-4433",
            email: "mariana.dias@strivo.com",
            source: "Diretoria",
            extraInfo: "Cliente de alto patrimônio sob gestão direta da diretoria da Strivo.",
            status: "fechado", 
            productId: 4, 
            agentId: 7, 
            leaderId: null, 
            value: 2000000, 
            splits: [{ agentId: 7, pct: 100 }], 
            clientCode: "CLI-PGR-982", 
            createdDate: "2026-05-22",
            attachments: [],
            tasks: []
        },
        { 
            id: 105, 
            name: "Julia Martins Melo", 
            phone: "(19) 95444-3322",
            email: "julia.martins@outlook.com",
            source: "Mapeamento LinkedIn",
            extraInfo: "Interessada em repasses multinível para sua assessoria de investimentos parceira.",
            status: "contato", 
            productId: 1, 
            agentId: 4, 
            leaderId: 2, 
            value: 600000, 
            splits: [{ agentId: 4, pct: 50 }, { agentId: 5, pct: 50 }], 
            createdDate: "2026-05-25",
            attachments: [],
            tasks: [
                { id: 1, text: "Configurar simulação de split no dashboard", dueDate: "2026-06-16", completed: false }
            ]
        },
        { 
            id: 106, 
            name: "Geraldo Alencar", 
            phone: "(11) 94333-2211",
            email: "geraldo.alencar@uol.com.br",
            source: "Indicação de Lucas",
            extraInfo: "Empresário do setor de transportes, busca rentabilizar caixa de curto prazo.",
            status: "prospect", 
            productId: 3, 
            agentId: 6, 
            leaderId: 3, 
            value: 450000, 
            splits: [{ agentId: 6, pct: 100 }], 
            createdDate: "2026-05-28",
            attachments: [],
            tasks: []
        }
    ],
    clients: [
        { code: "CLI-FIP-001", name: "Arthur Mendes", agentId: 4, leaderId: 2, productId: 1 },
        { code: "CLI-SPK-002", name: "Beatriz Oliveira", agentId: 5, leaderId: 2, productId: 2 },
        { code: "CLI-RES-003", name: "Cesar Albuquerque", agentId: 6, leaderId: 3, productId: 3 },
        { code: "CLI-DIR-004", name: "Daniela Fraga", agentId: 1, leaderId: null, productId: 1 }
    ],
    aportes: [
        { id: 201, clientName: "Ricardo Eletro Corp", productId: 1, agentId: 4, leaderId: 2, value: 1000000, date: "2026-06-01", status: "pendente_lider", logs: [{ action: "criado", user: "Lucas Nogueira", date: "2026-06-01" }] },
        { id: 202, clientName: "Vivara Participações", productId: 2, agentId: 5, leaderId: 2, value: 2500000, date: "2026-06-03", status: "aprovado_lider", logs: [{ action: "criado", user: "Bruna Lima", date: "2026-06-03" }, { action: "aprovado_lider", user: "Marcus Silva", date: "2026-06-04" }] },
        { id: 203, clientName: "Localiza Rent a Car", productId: 4, agentId: 6, leaderId: 3, value: 600000, date: "2026-05-25", status: "homologado", logs: [{ action: "criado", user: "Gabriel Santos", date: "2026-05-25" }, { action: "aprovado_lider", user: "Patricia Costa", date: "2026-05-26" }, { action: "homologado", user: "Filipe Rosa", date: "2026-05-27" }] }
    ],
    faturamentoHistorico: [
        // Competência Maio/2026
        { period: "2026-05", clientCode: "CLI-FIP-001", clientName: "Arthur Mendes", value: 5000, productId: 1, processedDate: "2026-05-31" },
        { period: "2026-05", clientCode: "CLI-SPK-002", clientName: "Beatriz Oliveira", value: 8000, productId: 2, processedDate: "2026-05-31" },
        { period: "2026-05", clientCode: "CLI-RES-003", clientName: "Cesar Albuquerque", value: 3000, productId: 3, processedDate: "2026-05-31" },
        { period: "2026-05", clientCode: "CLI-DIR-004", clientName: "Daniela Fraga", value: 15000, productId: 1, processedDate: "2026-05-31" }
    ],
    logs: [
        { id: 1, type: "system", message: "Sistema inicializado com dados de demonstração.", date: "2026-06-11 11:00:00" }
    ]
};

// Carrega os dados ou inicializa no localStorage
function loadDataStore() {
    let data = localStorage.getItem('strivo_datastore');
    if (!data) {
        localStorage.setItem('strivo_datastore', JSON.stringify(INITIAL_MOCK_DATA));
        return INITIAL_MOCK_DATA;
    }
    return JSON.parse(data);
}

function saveDataStore(data) {
    localStorage.setItem('strivo_datastore', JSON.stringify(data));
}
