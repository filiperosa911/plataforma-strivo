-- STRIVO PLATFORM // DATABASE SCHEMAS & POLICIES (UPDATED FOR PERFECT MOCK-DATA SYNC)

-- 1. TABELA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS "users" (
    "id" BIGINT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL CHECK ("role" IN ('diretoria', 'lideranca', 'agente')),
    "email" TEXT UNIQUE NOT NULL,
    "parentId" BIGINT REFERENCES "users"("id") ON DELETE SET NULL,
    "username" TEXT UNIQUE NOT NULL,
    "password" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active'
);

-- Habilitar RLS para users
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

-- 2. TABELA DE PRODUTOS / FUNDOS
CREATE TABLE IF NOT EXISTS "products" (
    "id" BIGINT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "taxAdm" NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    "feeCap" NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    "splitStrivo" NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    "splitLider" NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    "splitAgente" NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    "cnpj" TEXT,
    "administrator" TEXT,
    "investorType" TEXT,
    "performanceFee" TEXT,
    "benchmark" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active'
);

-- Habilitar RLS para products
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;

-- 3. TABELA DE ESTÁGIOS DO FUNIL CRM
CREATE TABLE IF NOT EXISTS "stages" (
    "key" TEXT PRIMARY KEY,
    "label" TEXT NOT NULL,
    "order" INT NOT NULL,
    "colorClass" TEXT NOT NULL
);

-- Habilitar RLS para stages
ALTER TABLE "stages" ENABLE ROW LEVEL SECURITY;

-- 4. TABELA DE LEADS
CREATE TABLE IF NOT EXISTS "leads" (
    "id" BIGINT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "source" TEXT,
    "extraInfo" TEXT,
    "status" TEXT NOT NULL REFERENCES "stages"("key") DEFAULT 'prospect',
    "productId" BIGINT REFERENCES "products"("id") ON DELETE SET NULL,
    "agentId" BIGINT NOT NULL REFERENCES "users"("id"),
    "leaderId" BIGINT REFERENCES "users"("id"),
    "value" NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    "splits" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "clientCode" TEXT,
    "createdDate" TEXT NOT NULL,
    "attachments" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "tasks" JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Habilitar RLS para leads
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;

-- 5. TABELA DE CLIENTES (CONTAS EFETIVADAS)
CREATE TABLE IF NOT EXISTS "clients" (
    "code" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "agentId" BIGINT NOT NULL REFERENCES "users"("id"),
    "leaderId" BIGINT REFERENCES "users"("id"),
    "productId" BIGINT REFERENCES "products"("id") ON DELETE SET NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdDate" TEXT
);

-- Habilitar RLS para clients
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;

-- 6. TABELA DE APORTES (TRANSAÇÕES FINANCEIRAS)
CREATE TABLE IF NOT EXISTS "aportes" (
    "id" BIGINT PRIMARY KEY,
    "leadId" BIGINT REFERENCES "leads"("id") ON DELETE SET NULL,
    "productId" BIGINT NOT NULL REFERENCES "products"("id"),
    "value" NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "agentId" BIGINT NOT NULL REFERENCES "users"("id"),
    "leaderId" BIGINT REFERENCES "users"("id"),
    "clientName" TEXT,
    "logs" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "comissaoStrivo" NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    "comissaoLider" NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    "comissaoAgente" NUMERIC(15,2) NOT NULL DEFAULT 0.00
);

-- Habilitar RLS para aportes
ALTER TABLE "aportes" ENABLE ROW LEVEL SECURITY;

-- 7. TABELA DE HISTÓRICO DE FATURAMENTO (TAXA DE ADMINISTRAÇÃO MENSAL)
CREATE TABLE IF NOT EXISTS "faturamentoHistorico" (
    "period" TEXT NOT NULL, -- Ex: '2026-05'
    "clientCode" TEXT NOT NULL REFERENCES "clients"("code") ON DELETE CASCADE,
    "clientName" TEXT,
    "value" NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    "productId" BIGINT NOT NULL REFERENCES "products"("id"),
    "processedDate" TEXT,
    PRIMARY KEY ("clientCode", "productId", "period")
);

-- Habilitar RLS para faturamentoHistorico
ALTER TABLE "faturamentoHistorico" ENABLE ROW LEVEL SECURITY;


-- ==================== POLÍTICAS RLS (SEGURANÇA EXTREMA) ====================

-- Regras para a tabela USERS
CREATE POLICY "Leitura pública de usuários" ON "users" FOR SELECT USING (true);
CREATE POLICY "Apenas diretoria altera usuários" ON "users" FOR ALL USING (
    EXISTS (
        SELECT 1 FROM "users" u 
        WHERE u.id = NULLIF(current_setting('request.jwt.claim.sub', true), '')::bigint 
        AND u.role = 'diretoria'
    )
);

-- Regras para a tabela PRODUCTS
CREATE POLICY "Leitura pública de produtos" ON "products" FOR SELECT USING (true);
CREATE POLICY "Apenas diretoria altera produtos" ON "products" FOR ALL USING (
    EXISTS (
        SELECT 1 FROM "users" u 
        WHERE u.id = NULLIF(current_setting('request.jwt.claim.sub', true), '')::bigint 
        AND u.role = 'diretoria'
    )
);

-- Regras para a tabela STAGES
CREATE POLICY "Leitura pública de estágios" ON "stages" FOR SELECT USING (true);
CREATE POLICY "Apenas diretoria altera estágios" ON "stages" FOR ALL USING (
    EXISTS (
        SELECT 1 FROM "users" u 
        WHERE u.id = NULLIF(current_setting('request.jwt.claim.sub', true), '')::bigint 
        AND u.role = 'diretoria'
    )
);

-- Regras para a tabela LEADS (Hierarquia de Acesso)
CREATE POLICY "Visualização de leads conforme hierarquia" ON "leads"
    FOR SELECT USING (
        "agentId" = NULLIF(current_setting('request.jwt.claim.sub', true), '')::bigint
        OR "leaderId" = NULLIF(current_setting('request.jwt.claim.sub', true), '')::bigint
        OR EXISTS (
            SELECT 1 FROM "users" u 
            WHERE u.id = NULLIF(current_setting('request.jwt.claim.sub', true), '')::bigint 
            AND u.role = 'diretoria'
        )
    );

CREATE POLICY "Inserção e edição de leads" ON "leads"
    FOR ALL USING (
        "agentId" = NULLIF(current_setting('request.jwt.claim.sub', true), '')::bigint
        OR "leaderId" = NULLIF(current_setting('request.jwt.claim.sub', true), '')::bigint
        OR EXISTS (
            SELECT 1 FROM "users" u 
            WHERE u.id = NULLIF(current_setting('request.jwt.claim.sub', true), '')::bigint 
            AND u.role = 'diretoria'
        )
    );

-- Regras para a tabela CLIENTS (Hierarquia de Acesso)
CREATE POLICY "Visualização de clientes conforme hierarquia" ON "clients"
    FOR SELECT USING (
        "agentId" = NULLIF(current_setting('request.jwt.claim.sub', true), '')::bigint
        OR "leaderId" = NULLIF(current_setting('request.jwt.claim.sub', true), '')::bigint
        OR EXISTS (
            SELECT 1 FROM "users" u 
            WHERE u.id = NULLIF(current_setting('request.jwt.claim.sub', true), '')::bigint 
            AND u.role = 'diretoria'
        )
    );

CREATE POLICY "Modificação de clientes" ON "clients"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "users" u 
            WHERE u.id = NULLIF(current_setting('request.jwt.claim.sub', true), '')::bigint 
            AND u.role = 'diretoria'
        )
    );

-- Regras para a tabela APORTES
CREATE POLICY "Visualização de aportes conforme hierarquia" ON "aportes"
    FOR SELECT USING (
        "agentId" = NULLIF(current_setting('request.jwt.claim.sub', true), '')::bigint
        OR "leaderId" = NULLIF(current_setting('request.jwt.claim.sub', true), '')::bigint
        OR EXISTS (
            SELECT 1 FROM "users" u 
            WHERE u.id = NULLIF(current_setting('request.jwt.claim.sub', true), '')::bigint 
            AND u.role = 'diretoria'
        )
    );

CREATE POLICY "Criação de aportes pelo assessor" ON "aportes"
    FOR INSERT WITH CHECK (
        "agentId" = NULLIF(current_setting('request.jwt.claim.sub', true), '')::bigint
    );

CREATE POLICY "Apenas diretoria altera aportes e homologa" ON "aportes"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "users" u 
            WHERE u.id = NULLIF(current_setting('request.jwt.claim.sub', true), '')::bigint 
            AND u.role = 'diretoria'
        )
    );

-- Regras para a tabela FATURAMENTO HISTORICO
CREATE POLICY "Visualização de faturamento conforme hierarquia" ON "faturamentoHistorico"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "clients" c
            WHERE c.code = "clientCode"
            AND (
                c."agentId" = NULLIF(current_setting('request.jwt.claim.sub', true), '')::bigint
                OR c."leaderId" = NULLIF(current_setting('request.jwt.claim.sub', true), '')::bigint
            )
        )
        OR EXISTS (
            SELECT 1 FROM "users" u 
            WHERE u.id = NULLIF(current_setting('request.jwt.claim.sub', true), '')::bigint 
            AND u.role = 'diretoria'
        )
    );

CREATE POLICY "Apenas diretoria insere faturamento historico" ON "faturamentoHistorico"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "users" u 
            WHERE u.id = NULLIF(current_setting('request.jwt.claim.sub', true), '')::bigint 
            AND u.role = 'diretoria'
        )
    );


-- ==================== GATILHOS DE SEGURANÇA (TRIGGER) ====================

-- Função para calcular as comissões no servidor de forma inviolável
CREATE OR REPLACE FUNCTION calculate_aporte_commission()
RETURNS TRIGGER AS $$
DECLARE
    v_feeCap NUMERIC;
    v_splitStrivo NUMERIC;
    v_splitLider NUMERIC;
    v_splitAgente NUMERIC;
    v_feeValue NUMERIC;
BEGIN
    -- Obter os parâmetros de taxa de captação e divisão do produto
    SELECT "feeCap", "splitStrivo", "splitLider", "splitAgente"
    INTO v_feeCap, v_splitStrivo, v_splitLider, v_splitAgente
    FROM "products"
    WHERE "id" = NEW."productId";

    -- Calcular o valor da taxa de captação gerada pelo aporte
    v_feeValue := NEW."value" * (COALESCE(v_feeCap, 0.00) / 100.0);

    -- Preencher comissões no servidor do Supabase de forma automatizada e segura
    NEW."comissaoStrivo" := v_feeValue * (COALESCE(v_splitStrivo, 0.00) / 100.0);
    NEW."comissaoLider" := v_feeValue * (COALESCE(v_splitLider, 0.00) / 100.0);
    NEW."comissaoAgente" := v_feeValue * (COALESCE(v_splitAgente, 0.00) / 100.0);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar a função antes de salvar o aporte
CREATE OR REPLACE TRIGGER trigger_calculate_aporte_commission
    BEFORE INSERT OR UPDATE OF "value", "productId" ON "aportes"
    FOR EACH ROW
    EXECUTE FUNCTION calculate_aporte_commission();
