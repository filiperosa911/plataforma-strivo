// STRIVO PLATFORM // INITIAL MOCK DATA DEFINITIONS
const INITIAL_MOCK_DATA = {
    users: [
        { id: 1, name: "Filipe Rosa", role: "diretoria", email: "filipe@vertic.com", parentId: null, status: "active" },
        { id: 2, name: "Diogo Wunsch", role: "diretoria", email: "diogo@strivo.com", parentId: null, status: "active" },
        { id: 3, name: "Gustav Gorski", role: "diretoria", email: "gustav@strivo.com", parentId: null, status: "active" },
        { id: 4, name: "Thiago Vicente", role: "diretoria", email: "thiago@strivo.com", parentId: null, status: "active" },
        { id: 5, name: "Celso Pimenta", role: "lideranca", email: "celso@strivo.com", parentId: 2, status: "active" },
        { id: 6, name: "EQR", role: "agente", email: "eqr@strivo.com", parentId: 5, status: "active" },
        { id: 7, name: "Vex Capital", role: "agente", email: "vex@strivo.com", parentId: 5, status: "active" },
        { id: 8, name: "S2 Invest", role: "agente", email: "s2@strivo.com", parentId: 5, status: "active" }
    ],
    products: [
        { id: 1, name: "Strivo Yield 40 FIF", taxAdm: 1.2, feeCap: 0.0, splitStrivo: 60, splitLider: 15, splitAgente: 25, cnpj: "46.847.516/0001-77", administrator: "VORTX", investorType: "Qualificado", performanceFee: "20% sobre o que exceder o benchmark", benchmark: "CDI+", status: "active" },
        { id: 2, name: "Strivo Yield 45 FIF Cotas FIM", taxAdm: 1.0, feeCap: 0.0, splitStrivo: 50, splitLider: 20, splitAgente: 30, cnpj: "46.785.261/0001-65", administrator: "BTG Pactual", investorType: "Qualificado", performanceFee: "20% do que exceder o CDI", benchmark: "CDI+", status: "active" },
        { id: 3, name: "Swiss CASH FIF Classe FIC Multimercado CP", taxAdm: 1.5, feeCap: 0.0, splitStrivo: 70, splitLider: 10, splitAgente: 20, cnpj: "61.925.539/0001-46", administrator: "Safra", investorType: "Normal", performanceFee: "0%", benchmark: "CDI", status: "active" },
        { id: 4, name: "Triumph FIF Classe FIC Multimercado CP", taxAdm: 1.5, feeCap: 0.0, splitStrivo: 60, splitLider: 15, splitAgente: 25, cnpj: "61.926.195/0001-90", administrator: "Safra", investorType: "Normal", performanceFee: "0%", benchmark: "CDI", status: "active" },
        { id: 5, name: "STYI11", taxAdm: 0.0, feeCap: 4.0, splitStrivo: 60, splitLider: 15, splitAgente: 25, cnpj: "59.678.586/0001-90", administrator: "VORTX", investorType: "Normal", performanceFee: "0%", benchmark: "N/A", status: "active" }
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
            agentId: 6, 
            leaderId: 5, 
            value: 500000, 
            splits: [{ agentId: 6, pct: 100 }], 
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
            agentId: 7, 
            leaderId: 5, 
            value: 1200000, 
            splits: [{ agentId: 7, pct: 100 }], 
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
            agentId: 8, 
            leaderId: 5, 
            value: 800000, 
            splits: [{ agentId: 8, pct: 100 }], 
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
            agentId: 6, 
            leaderId: 5, 
            value: 2000000, 
            splits: [{ agentId: 6, pct: 100 }], 
            clientCode: "CLI-TRI-982", 
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
            agentId: 6, 
            leaderId: 5, 
            value: 600000, 
            splits: [{ agentId: 6, pct: 50 }, { agentId: 7, pct: 50 }], 
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
            agentId: 8, 
            leaderId: 5, 
            value: 450000, 
            splits: [{ agentId: 8, pct: 100 }], 
            createdDate: "2026-05-28",
            attachments: [],
            tasks: []
        },
        { id: 401, name: "João Silva", phone: "", email: "", source: "Importação dados-crm.csv", extraInfo: "Alocação no fundo Triumph FIF Classe FIC Multimercado CP", status: "fechado", productId: 4, agentId: 8, leaderId: 5, value: 2710457.0, splits: [{ agentId: 8, pct: 100 }], clientCode: "CLI-TRI-501", createdDate: "2026-06-09", attachments: [], tasks: [] },
        { id: 402, name: "Maria Oliveira", phone: "", email: "", source: "Importação dados-crm.csv", extraInfo: "Alocação no fundo Triumph FIF Classe FIC Multimercado CP", status: "fechado", productId: 4, agentId: 8, leaderId: 5, value: 7366669.0, splits: [{ agentId: 8, pct: 100 }], clientCode: "CLI-TRI-502", createdDate: "2026-06-12", attachments: [], tasks: [] },
        { id: 403, name: "Pedro Santos", phone: "", email: "", source: "Importação dados-crm.csv", extraInfo: "Alocação no fundo Strivo Yield 40 FIF", status: "fechado", productId: 1, agentId: 7, leaderId: 5, value: 7669332.0, splits: [{ agentId: 7, pct: 100 }], clientCode: "CLI-STR-503", createdDate: "2026-06-05", attachments: [], tasks: [] },
        { id: 404, name: "Ana Costa", phone: "", email: "", source: "Importação dados-crm.csv", extraInfo: "Alocação no fundo Swiss CASH FIF Classe FIC Multimercado CP", status: "fechado", productId: 3, agentId: 6, leaderId: 5, value: 4004542.0, splits: [{ agentId: 6, pct: 100 }], clientCode: "CLI-SWI-504", createdDate: "2026-06-06", attachments: [], tasks: [] },
        { id: 405, name: "Lucas Pereira", phone: "", email: "", source: "Importação dados-crm.csv", extraInfo: "Alocação no fundo Triumph FIF Classe FIC Multimercado CP", status: "fechado", productId: 4, agentId: 6, leaderId: 5, value: 4754205.0, splits: [{ agentId: 6, pct: 100 }], clientCode: "CLI-TRI-505", createdDate: "2026-06-11", attachments: [], tasks: [] },
        { id: 406, name: "Júlia Rodrigues", phone: "", email: "", source: "Importação dados-crm.csv", extraInfo: "Alocação no fundo Swiss CASH FIF Classe FIC Multimercado CP", status: "fechado", productId: 3, agentId: 8, leaderId: 5, value: 5670581.0, splits: [{ agentId: 8, pct: 100 }], clientCode: "CLI-SWI-506", createdDate: "2026-05-31", attachments: [], tasks: [] },
        { id: 407, name: "Marcos Almeida", phone: "", email: "", source: "Importação dados-crm.csv", extraInfo: "Alocação no fundo Strivo Yield 45 FIF Cotas FIM", status: "fechado", productId: 2, agentId: 8, leaderId: 5, value: 9145555.0, splits: [{ agentId: 8, pct: 100 }], clientCode: "CLI-STR-507", createdDate: "2026-06-05", attachments: [], tasks: [] },
        { id: 408, name: "Beatriz Lima", phone: "", email: "", source: "Importação dados-crm.csv", extraInfo: "Alocação no fundo Strivo Yield 40 FIF", status: "fechado", productId: 1, agentId: 8, leaderId: 5, value: 6118387.0, splits: [{ agentId: 8, pct: 100 }], clientCode: "CLI-STR-508", createdDate: "2026-06-16", attachments: [], tasks: [] },
        { id: 409, name: "Gabriel Gomes", phone: "", email: "", source: "Importação dados-crm.csv", extraInfo: "Alocação no fundo Strivo Yield 45 FIF Cotas FIM", status: "fechado", productId: 2, agentId: 8, leaderId: 5, value: 9235130.0, splits: [{ agentId: 8, pct: 100 }], clientCode: "CLI-STR-509", createdDate: "2026-06-04", attachments: [], tasks: [] },
        { id: 410, name: "Camila Martins", phone: "", email: "", source: "Importação dados-crm.csv", extraInfo: "Alocação no fundo Triumph FIF Classe FIC Multimercado CP", status: "fechado", productId: 4, agentId: 6, leaderId: 5, value: 8707834.0, splits: [{ agentId: 6, pct: 100 }], clientCode: "CLI-TRI-510", createdDate: "2026-06-14", attachments: [], tasks: [] },
        { id: 411, name: "Rafael Carvalho", phone: "", email: "", source: "Importação dados-crm.csv", extraInfo: "Alocação no fundo Swiss CASH FIF Classe FIC Multimercado CP", status: "fechado", productId: 3, agentId: 8, leaderId: 5, value: 9557953.0, splits: [{ agentId: 8, pct: 100 }], clientCode: "CLI-SWI-511", createdDate: "2026-05-30", attachments: [], tasks: [] },
        { id: 412, name: "Mariana Ribeiro", phone: "", email: "", source: "Importação dados-crm.csv", extraInfo: "Alocação no fundo Strivo Yield 40 FIF", status: "fechado", productId: 1, agentId: 6, leaderId: 5, value: 7212397.0, splits: [{ agentId: 6, pct: 100 }], clientCode: "CLI-STR-512", createdDate: "2026-06-08", attachments: [], tasks: [] },
        { id: 413, name: "Fernando Alves", phone: "", email: "", source: "Importação dados-crm.csv", extraInfo: "Alocação no fundo Strivo Yield 45 FIF Cotas FIM", status: "fechado", productId: 2, agentId: 7, leaderId: 5, value: 6915850.0, splits: [{ agentId: 7, pct: 100 }], clientCode: "CLI-STR-513", createdDate: "2026-05-28", attachments: [], tasks: [] },
        { id: 414, name: "Larissa Monteiro", phone: "", email: "", source: "Importação dados-crm.csv", extraInfo: "Alocação no fundo Swiss CASH FIF Classe FIC Multimercado CP", status: "fechado", productId: 3, agentId: 6, leaderId: 5, value: 6684402.0, splits: [{ agentId: 6, pct: 100 }], clientCode: "CLI-SWI-514", createdDate: "2026-05-19", attachments: [], tasks: [] },
        { id: 415, name: "Diego Barbosa", phone: "", email: "", source: "Importação dados-crm.csv", extraInfo: "Alocação no fundo Triumph FIF Classe FIC Multimercado CP", status: "fechado", productId: 4, agentId: 7, leaderId: 5, value: 9663502.0, splits: [{ agentId: 7, pct: 100 }], clientCode: "CLI-TRI-515", createdDate: "2026-06-02", attachments: [], tasks: [] },
        { id: 416, name: "Amanda Rocha", phone: "", email: "", source: "Importação dados-crm.csv", extraInfo: "Alocação no fundo Triumph FIF Classe FIC Multimercado CP", status: "fechado", productId: 4, agentId: 8, leaderId: 5, value: 3177548.0, splits: [{ agentId: 8, pct: 100 }], clientCode: "CLI-TRI-516", createdDate: "2026-06-02", attachments: [], tasks: [] },
        { id: 417, name: "Thiago Mendes", phone: "", email: "", source: "Importação dados-crm.csv", extraInfo: "Alocação no fundo Strivo Yield 45 FIF Cotas FIM", status: "fechado", productId: 2, agentId: 8, leaderId: 5, value: 640968.0, splits: [{ agentId: 8, pct: 100 }], clientCode: "CLI-STR-517", createdDate: "2026-06-15", attachments: [], tasks: [] },
        { id: 418, name: "Natália Cardoso", phone: "", email: "", source: "Importação dados-crm.csv", extraInfo: "Alocação no fundo Strivo Yield 40 FIF", status: "fechado", productId: 1, agentId: 6, leaderId: 5, value: 7318523.0, splits: [{ agentId: 6, pct: 100 }], clientCode: "CLI-STR-518", createdDate: "2026-06-13", attachments: [], tasks: [] },
        { id: 419, name: "Bruno Teixeira", phone: "", email: "", source: "Importação dados-crm.csv", extraInfo: "Alocação no fundo Swiss CASH FIF Classe FIC Multimercado CP", status: "fechado", productId: 3, agentId: 7, leaderId: 5, value: 8137478.0, splits: [{ agentId: 7, pct: 100 }], clientCode: "CLI-SWI-519", createdDate: "2026-06-04", attachments: [], tasks: [] },
        { id: 420, name: "Carolina Fernandes", phone: "", email: "", source: "Importação dados-crm.csv", extraInfo: "Alocação no fundo Strivo Yield 45 FIF Cotas FIM", status: "fechado", productId: 2, agentId: 8, leaderId: 5, value: 8359094.0, splits: [{ agentId: 8, pct: 100 }], clientCode: "CLI-STR-520", createdDate: "2026-05-26", attachments: [], tasks: [] }
    ],
    clients: [
        { code: "CLI-FIP-001", name: "Arthur Mendes", agentId: 6, leaderId: 5, productId: 1 },
        { code: "CLI-SPK-002", name: "Beatriz Oliveira", agentId: 7, leaderId: 5, productId: 2 },
        { code: "CLI-RES-003", name: "Cesar Albuquerque", agentId: 8, leaderId: 5, productId: 3 },
        { code: "CLI-DIR-004", name: "Daniela Fraga", agentId: 1, leaderId: null, productId: 1 },
        { code: "CLI-TRI-501", name: "João Silva", agentId: 8, leaderId: 5, productId: 4 },
        { code: "CLI-TRI-502", name: "Maria Oliveira", agentId: 8, leaderId: 5, productId: 4 },
        { code: "CLI-STR-503", name: "Pedro Santos", agentId: 7, leaderId: 5, productId: 1 },
        { code: "CLI-SWI-504", name: "Ana Costa", agentId: 6, leaderId: 5, productId: 3 },
        { code: "CLI-TRI-505", name: "Lucas Pereira", agentId: 6, leaderId: 5, productId: 4 },
        { code: "CLI-SWI-506", name: "Júlia Rodrigues", agentId: 8, leaderId: 5, productId: 3 },
        { code: "CLI-STR-507", name: "Marcos Almeida", agentId: 8, leaderId: 5, productId: 2 },
        { code: "CLI-STR-508", name: "Beatriz Lima", agentId: 8, leaderId: 5, productId: 1 },
        { code: "CLI-STR-509", name: "Gabriel Gomes", agentId: 8, leaderId: 5, productId: 2 },
        { code: "CLI-TRI-510", name: "Camila Martins", agentId: 6, leaderId: 5, productId: 4 },
        { code: "CLI-SWI-511", name: "Rafael Carvalho", agentId: 8, leaderId: 5, productId: 3 },
        { code: "CLI-STR-512", name: "Mariana Ribeiro", agentId: 6, leaderId: 5, productId: 1 },
        { code: "CLI-STR-513", name: "Fernando Alves", agentId: 7, leaderId: 5, productId: 2 },
        { code: "CLI-SWI-514", name: "Larissa Monteiro", agentId: 6, leaderId: 5, productId: 3 },
        { code: "CLI-TRI-515", name: "Diego Barbosa", agentId: 7, leaderId: 5, productId: 4 },
        { code: "CLI-TRI-516", name: "Amanda Rocha", agentId: 8, leaderId: 5, productId: 4 },
        { code: "CLI-STR-517", name: "Thiago Mendes", agentId: 8, leaderId: 5, productId: 2 },
        { code: "CLI-STR-518", name: "Natália Cardoso", agentId: 6, leaderId: 5, productId: 1 },
        { code: "CLI-SWI-519", name: "Bruno Teixeira", agentId: 7, leaderId: 5, productId: 3 },
        { code: "CLI-STR-520", name: "Carolina Fernandes", agentId: 8, leaderId: 5, productId: 2 }
    ],
    aportes: [
        { id: 201, clientName: "Ricardo Eletro Corp", productId: 1, agentId: 6, leaderId: 5, value: 1000000, date: "2026-06-01", status: "pendente_lider", logs: [{ action: "criado", user: "EQR", date: "2026-06-01" }] },
        { id: 202, clientName: "Vivara Participações", productId: 2, agentId: 7, leaderId: 5, value: 2500000, date: "2026-06-03", status: "aprovado_lider", logs: [{ action: "criado", user: "Vex Capital", date: "2026-06-03" }, { action: "aprovado_lider", user: "Celso Pimenta", date: "2026-06-04" }] },
        { id: 203, clientName: "Localiza Rent a Car", productId: 4, agentId: 8, leaderId: 5, value: 600000, date: "2026-05-25", status: "homologado", logs: [{ action: "criado", user: "S2 Invest", date: "2026-05-25" }, { action: "aprovado_lider", user: "Celso Pimenta", date: "2026-05-26" }, { action: "homologado", user: "Filipe Rosa", date: "2026-05-27" }] },
        { id: 301, clientName: "João Silva", productId: 4, agentId: 8, leaderId: 5, value: 2710457.0, date: "2026-06-09", status: "homologado", logs: [{ action: "criado", user: "S2 Invest", date: "2026-06-09" }, { action: "aprovado_lider", user: "Celso Pimenta", date: "2026-06-09" }, { action: "homologado", user: "Filipe Rosa", date: "2026-06-09" }] },
        { id: 302, clientName: "Maria Oliveira", productId: 4, agentId: 8, leaderId: 5, value: 7366669.0, date: "2026-06-12", status: "homologado", logs: [{ action: "criado", user: "S2 Invest", date: "2026-06-12" }, { action: "aprovado_lider", user: "Celso Pimenta", date: "2026-06-12" }, { action: "homologado", user: "Filipe Rosa", date: "2026-06-12" }] },
        { id: 303, clientName: "Pedro Santos", productId: 1, agentId: 7, leaderId: 5, value: 7669332.0, date: "2026-06-05", status: "homologado", logs: [{ action: "criado", user: "Vex Capital", date: "2026-06-05" }, { action: "aprovado_lider", user: "Celso Pimenta", date: "2026-06-05" }, { action: "homologado", user: "Filipe Rosa", date: "2026-06-05" }] },
        { id: 304, clientName: "Ana Costa", productId: 3, agentId: 6, leaderId: 5, value: 4004542.0, date: "2026-06-06", status: "homologado", logs: [{ action: "criado", user: "EQR", date: "2026-06-06" }, { action: "aprovado_lider", user: "Celso Pimenta", date: "2026-06-06" }, { action: "homologado", user: "Filipe Rosa", date: "2026-06-06" }] },
        { id: 305, clientName: "Lucas Pereira", productId: 4, agentId: 6, leaderId: 5, value: 4754205.0, date: "2026-06-11", status: "homologado", logs: [{ action: "criado", user: "EQR", date: "2026-06-11" }, { action: "aprovado_lider", user: "Celso Pimenta", date: "2026-06-11" }, { action: "homologado", user: "Filipe Rosa", date: "2026-06-11" }] },
        { id: 306, clientName: "Júlia Rodrigues", productId: 3, agentId: 8, leaderId: 5, value: 5670581.0, date: "2026-05-31", status: "homologado", logs: [{ action: "criado", user: "S2 Invest", date: "2026-05-31" }, { action: "aprovado_lider", user: "Celso Pimenta", date: "2026-05-31" }, { action: "homologado", user: "Filipe Rosa", date: "2026-05-31" }] },
        { id: 307, clientName: "Marcos Almeida", productId: 2, agentId: 8, leaderId: 5, value: 9145555.0, date: "2026-06-05", status: "homologado", logs: [{ action: "criado", user: "S2 Invest", date: "2026-06-05" }, { action: "aprovado_lider", user: "Celso Pimenta", date: "2026-06-05" }, { action: "homologado", user: "Filipe Rosa", date: "2026-06-05" }] },
        { id: 308, clientName: "Beatriz Lima", productId: 1, agentId: 8, leaderId: 5, value: 6118387.0, date: "2026-06-16", status: "homologado", logs: [{ action: "criado", user: "S2 Invest", date: "2026-06-16" }, { action: "aprovado_lider", user: "Celso Pimenta", date: "2026-06-16" }, { action: "homologado", user: "Filipe Rosa", date: "2026-06-16" }] },
        { id: 309, clientName: "Gabriel Gomes", productId: 2, agentId: 8, leaderId: 5, value: 9235130.0, date: "2026-06-04", status: "homologado", logs: [{ action: "criado", user: "S2 Invest", date: "2026-06-04" }, { action: "aprovado_lider", user: "Celso Pimenta", date: "2026-06-04" }, { action: "homologado", user: "Filipe Rosa", date: "2026-06-04" }] },
        { id: 310, clientName: "Camila Martins", productId: 4, agentId: 6, leaderId: 5, value: 8707834.0, date: "2026-06-14", status: "homologado", logs: [{ action: "criado", user: "EQR", date: "2026-06-14" }, { action: "aprovado_lider", user: "Celso Pimenta", date: "2026-06-14" }, { action: "homologado", user: "Filipe Rosa", date: "2026-06-14" }] },
        { id: 311, clientName: "Rafael Carvalho", productId: 3, agentId: 8, leaderId: 5, value: 9557953.0, date: "2026-05-30", status: "homologado", logs: [{ action: "criado", user: "S2 Invest", date: "2026-05-30" }, { action: "aprovado_lider", user: "Celso Pimenta", date: "2026-05-30" }, { action: "homologado", user: "Filipe Rosa", date: "2026-05-30" }] },
        { id: 312, clientName: "Mariana Ribeiro", productId: 1, agentId: 6, leaderId: 5, value: 7212397.0, date: "2026-06-08", status: "homologado", logs: [{ action: "criado", user: "EQR", date: "2026-06-08" }, { action: "aprovado_lider", user: "Celso Pimenta", date: "2026-06-08" }, { action: "homologado", user: "Filipe Rosa", date: "2026-06-08" }] },
        { id: 313, clientName: "Fernando Alves", productId: 2, agentId: 7, leaderId: 5, value: 6915850.0, date: "2026-05-28", status: "homologado", logs: [{ action: "criado", user: "Vex Capital", date: "2026-05-28" }, { action: "aprovado_lider", user: "Celso Pimenta", date: "2026-05-28" }, { action: "homologado", user: "Filipe Rosa", date: "2026-05-28" }] },
        { id: 314, clientName: "Larissa Monteiro", productId: 3, agentId: 6, leaderId: 5, value: 6684402.0, date: "2026-05-19", status: "homologado", logs: [{ action: "criado", user: "EQR", date: "2026-05-19" }, { action: "aprovado_lider", user: "Celso Pimenta", date: "2026-05-19" }, { action: "homologado", user: "Filipe Rosa", date: "2026-05-19" }] },
        { id: 315, clientName: "Diego Barbosa", productId: 4, agentId: 7, leaderId: 5, value: 9663502.0, date: "2026-06-02", status: "homologado", logs: [{ action: "criado", user: "Vex Capital", date: "2026-06-02" }, { action: "aprovado_lider", user: "Celso Pimenta", date: "2026-06-02" }, { action: "homologado", user: "Filipe Rosa", date: "2026-06-02" }] },
        { id: 316, clientName: "Amanda Rocha", productId: 4, agentId: 8, leaderId: 5, value: 3177548.0, date: "2026-06-02", status: "homologado", logs: [{ action: "criado", user: "S2 Invest", date: "2026-06-02" }, { action: "aprovado_lider", user: "Celso Pimenta", date: "2026-06-02" }, { action: "homologado", user: "Filipe Rosa", date: "2026-06-02" }] },
        { id: 317, clientName: "Thiago Mendes", productId: 2, agentId: 8, leaderId: 5, value: 640968.0, date: "2026-06-15", status: "homologado", logs: [{ action: "criado", user: "S2 Invest", date: "2026-06-15" }, { action: "aprovado_lider", user: "Celso Pimenta", date: "2026-06-15" }, { action: "homologado", user: "Filipe Rosa", date: "2026-06-15" }] },
        { id: 318, clientName: "Natália Cardoso", productId: 1, agentId: 6, leaderId: 5, value: 7318523.0, date: "2026-06-13", status: "homologado", logs: [{ action: "criado", user: "EQR", date: "2026-06-13" }, { action: "aprovado_lider", user: "Celso Pimenta", date: "2026-06-13" }, { action: "homologado", user: "Filipe Rosa", date: "2026-06-13" }] },
        { id: 319, clientName: "Bruno Teixeira", productId: 3, agentId: 7, leaderId: 5, value: 8137478.0, date: "2026-06-04", status: "homologado", logs: [{ action: "criado", user: "Vex Capital", date: "2026-06-04" }, { action: "aprovado_lider", user: "Celso Pimenta", date: "2026-06-04" }, { action: "homologado", user: "Filipe Rosa", date: "2026-06-04" }] },
        { id: 320, clientName: "Carolina Fernandes", productId: 2, agentId: 8, leaderId: 5, value: 8359094.0, date: "2026-05-26", status: "homologado", logs: [{ action: "criado", user: "S2 Invest", date: "2026-05-26" }, { action: "aprovado_lider", user: "Celso Pimenta", date: "2026-05-26" }, { action: "homologado", user: "Filipe Rosa", date: "2026-05-26" }] }
    ],
    faturamentoHistorico: [
        // Competência Maio/2026
        { period: "2026-05", clientCode: "CLI-FIP-001", clientName: "Arthur Mendes", value: 5000, productId: 1, processedDate: "2026-05-31" },
        { period: "2026-05", clientCode: "CLI-SPK-002", clientName: "Beatriz Oliveira", value: 8000, productId: 2, processedDate: "2026-05-31" },
        { period: "2026-05", clientCode: "CLI-RES-003", clientName: "Cesar Albuquerque", value: 3000, productId: 3, processedDate: "2026-05-31" },
        { period: "2026-05", clientCode: "CLI-DIR-004", clientName: "Daniela Fraga", value: 15000, productId: 1, processedDate: "2026-05-31" },
        { period: "2026-06", clientCode: "CLI-TRI-501", clientName: "João Silva", value: 1129.36, productId: 4, processedDate: "2026-06-09" },
        { period: "2026-06", clientCode: "CLI-TRI-502", clientName: "Maria Oliveira", value: 1753.97, productId: 4, processedDate: "2026-06-12" },
        { period: "2026-06", clientCode: "CLI-STR-503", clientName: "Pedro Santos", value: 3286.86, productId: 1, processedDate: "2026-06-05" },
        { period: "2026-06", clientCode: "CLI-SWI-504", clientName: "Ana Costa", value: 1906.92, productId: 3, processedDate: "2026-06-06" },
        { period: "2026-06", clientCode: "CLI-TRI-505", clientName: "Lucas Pereira", value: 1414.94, productId: 4, processedDate: "2026-06-11" },
        { period: "2026-05", clientCode: "CLI-SWI-506", clientName: "Júlia Rodrigues", value: 4387.95, productId: 3, processedDate: "2026-05-31" },
        { period: "2026-06", clientCode: "CLI-STR-507", clientName: "Marcos Almeida", value: 3266.27, productId: 2, processedDate: "2026-06-05" },
        { period: "2026-06", clientCode: "CLI-STR-508", clientName: "Beatriz Lima", value: 582.7, productId: 1, processedDate: "2026-06-16" },
        { period: "2026-06", clientCode: "CLI-STR-509", clientName: "Gabriel Gomes", value: 3664.73, productId: 2, processedDate: "2026-06-04" },
        { period: "2026-06", clientCode: "CLI-TRI-510", clientName: "Camila Martins", value: 1554.97, productId: 4, processedDate: "2026-06-14" },
        { period: "2026-05", clientCode: "CLI-SWI-511", clientName: "Rafael Carvalho", value: 7396.04, productId: 3, processedDate: "2026-05-30" },
        { period: "2026-06", clientCode: "CLI-STR-512", clientName: "Mariana Ribeiro", value: 2747.58, productId: 1, processedDate: "2026-06-08" },
        { period: "2026-05", clientCode: "CLI-STR-513", clientName: "Fernando Alves", value: 4116.58, productId: 2, processedDate: "2026-05-28" },
        { period: "2026-05", clientCode: "CLI-SWI-514", clientName: "Larissa Monteiro", value: 8753.38, productId: 3, processedDate: "2026-05-19" },
        { period: "2026-06", clientCode: "CLI-TRI-515", clientName: "Diego Barbosa", value: 6902.5, productId: 4, processedDate: "2026-06-02" },
        { period: "2026-06", clientCode: "CLI-TRI-516", clientName: "Amanda Rocha", value: 2269.68, productId: 4, processedDate: "2026-06-02" },
        { period: "2026-06", clientCode: "CLI-STR-517", clientName: "Thiago Mendes", value: 76.31, productId: 2, processedDate: "2026-06-15" },
        { period: "2026-06", clientCode: "CLI-STR-518", clientName: "Natália Cardoso", value: 1045.5, productId: 1, processedDate: "2026-06-13" },
        { period: "2026-06", clientCode: "CLI-SWI-519", clientName: "Bruno Teixeira", value: 4843.74, productId: 3, processedDate: "2026-06-04" },
        { period: "2026-05", clientCode: "CLI-STR-520", clientName: "Carolina Fernandes", value: 5639.07, productId: 2, processedDate: "2026-05-26" }
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
    try {
        let parsed = JSON.parse(data);
        // Reset local storage if the database is out of date (missing new imported clients)
        if (!parsed.clients || !parsed.clients.some(c => c.name === "João Silva")) {
            localStorage.setItem('strivo_datastore', JSON.stringify(INITIAL_MOCK_DATA));
            return INITIAL_MOCK_DATA;
        }
        return parsed;
    } catch (e) {
        localStorage.setItem('strivo_datastore', JSON.stringify(INITIAL_MOCK_DATA));
        return INITIAL_MOCK_DATA;
    }
}

function saveDataStore(data) {
    localStorage.setItem('strivo_datastore', JSON.stringify(data));
}
