-- STRIVO CRM // DATABASE SCHEMAS & POLICIES (INSTÂNCIA DEDICADA — api-crm.strivoeduca.com.br)
-- Identidade agora é resolvida via Supabase Auth real (auth.uid()), não mais
-- via header HTTP. Ver "users"."auth_user_id" e as funções get_my_id()/get_my_role().

-- 1. TABELA DE USUÁRIOS (vinculada ao Supabase Auth via auth_user_id)
CREATE TABLE IF NOT EXISTS "users" (
    "id" BIGINT PRIMARY KEY,
    "auth_user_id" UUID UNIQUE REFERENCES auth.users("id") ON DELETE SET NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL CHECK ("role" IN ('diretoria', 'lideranca', 'agente', 'admin')),
    "email" TEXT UNIQUE NOT NULL,
    "parentId" BIGINT REFERENCES "users"("id") ON DELETE SET NULL,
    "username" TEXT UNIQUE NOT NULL,
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
    -- Percentual sobre o que exceder o "benchmark". Numérico (não texto) para
    -- permitir cálculo — ver migração 2026-08-15 no fim do arquivo.
    "performanceFee" NUMERIC(5,2) NOT NULL DEFAULT 0.00,
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


-- ==================== FUNÇÕES AUXILIARES DE SESSÃO (AGORA VIA auth.uid() REAL) ====================

-- Função para obter o ID interno (bigint) do usuário logado, a partir do JWT
-- verificado do Supabase Auth (auth.uid()) — não mais de um header do cliente.
CREATE OR REPLACE FUNCTION get_my_id()
RETURNS BIGINT AS $$
    SELECT "id" FROM "users" WHERE "auth_user_id" = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- Função para obter a role do usuário logado sem causar recursão infinita (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
    SELECT "role" FROM "users" WHERE "auth_user_id" = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- RPC pública (chamável antes do login) que resolve "username" -> email,
-- só para permitir login por username mantendo a autenticação real do
-- Supabase Auth (que exige email). Não expõe mais nenhum outro campo.
CREATE OR REPLACE FUNCTION resolve_login_email(p_username TEXT)
RETURNS TEXT AS $$
    SELECT "email" FROM "users"
    WHERE lower("username") = lower(trim(p_username)) AND "status" = 'active';
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

GRANT EXECUTE ON FUNCTION resolve_login_email(TEXT) TO anon;


-- ==================== POLÍTICAS RLS ====================

-- 1. Remover políticas antigas para evitar erros de duplicidade
DROP POLICY IF EXISTS "Leitura pública de usuários" ON "users";
DROP POLICY IF EXISTS "Leitura de usuários autenticados" ON "users";
DROP POLICY IF EXISTS "Apenas diretoria altera usuários" ON "users";
DROP POLICY IF EXISTS "Inserção inicial ou diretoria em users" ON "users";
DROP POLICY IF EXISTS "Edição apenas diretoria em users" ON "users";
DROP POLICY IF EXISTS "Deleção apenas diretoria em users" ON "users";

DROP POLICY IF EXISTS "Leitura pública de produtos" ON "products";
DROP POLICY IF EXISTS "Leitura de produtos autenticados" ON "products";
DROP POLICY IF EXISTS "Apenas diretoria altera produtos" ON "products";
DROP POLICY IF EXISTS "Inserção de produtos por diretoria" ON "products";
DROP POLICY IF EXISTS "Edição de produtos por diretoria" ON "products";
DROP POLICY IF EXISTS "Deleção de produtos por diretoria" ON "products";

DROP POLICY IF EXISTS "Leitura pública de estágios" ON "stages";
DROP POLICY IF EXISTS "Leitura de estágios autenticados" ON "stages";
DROP POLICY IF EXISTS "Apenas diretoria altera estágios" ON "stages";
DROP POLICY IF EXISTS "Inserção de estágios por diretoria" ON "stages";
DROP POLICY IF EXISTS "Edição de estágios por diretoria" ON "stages";
DROP POLICY IF EXISTS "Deleção de estágios por diretoria" ON "stages";

DROP POLICY IF EXISTS "Visualização de leads conforme hierarquia" ON "leads";
DROP POLICY IF EXISTS "Inserção e edição de leads" ON "leads";
DROP POLICY IF EXISTS "Inserção de leads" ON "leads";
DROP POLICY IF EXISTS "Edição de leads" ON "leads";
DROP POLICY IF EXISTS "Deleção de leads" ON "leads";

DROP POLICY IF EXISTS "Visualização de clientes conforme hierarquia" ON "clients";
DROP POLICY IF EXISTS "Modificação de clientes" ON "clients";
DROP POLICY IF EXISTS "Inserção de clientes por diretoria" ON "clients";
DROP POLICY IF EXISTS "Edição de clientes por diretoria" ON "clients";
DROP POLICY IF EXISTS "Deleção de clientes por diretoria" ON "clients";

DROP POLICY IF EXISTS "Visualização de aportes conforme hierarquia" ON "aportes";
DROP POLICY IF EXISTS "Criação de aportes pelo assessor" ON "aportes";
DROP POLICY IF EXISTS "Apenas diretoria altera aportes e homologa" ON "aportes";
DROP POLICY IF EXISTS "Deleção de aportes por diretoria" ON "aportes";

DROP POLICY IF EXISTS "Visualização de faturamento conforme hierarquia" ON "faturamentoHistorico";
DROP POLICY IF EXISTS "Apenas diretoria insere faturamento historico" ON "faturamentoHistorico";
DROP POLICY IF EXISTS "Inserção de faturamento por diretoria" ON "faturamentoHistorico";
DROP POLICY IF EXISTS "Edição de faturamento por diretoria" ON "faturamentoHistorico";
DROP POLICY IF EXISTS "Deleção de faturamento por diretoria" ON "faturamentoHistorico";


-- 2. Criar novas políticas — leitura exige autenticação real, nunca "true"

-- Regras para a tabela USERS
CREATE POLICY "Leitura de usuários autenticados" ON "users" FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Inserção inicial ou diretoria em users" ON "users" FOR INSERT WITH CHECK (
    (NOT EXISTS (SELECT 1 FROM "users"))
    OR
    get_my_role() = ANY (ARRAY['diretoria', 'admin'])
);

CREATE POLICY "Edição apenas diretoria em users" ON "users" FOR UPDATE USING (
    get_my_role() = ANY (ARRAY['diretoria', 'admin'])
);

CREATE POLICY "Deleção apenas diretoria em users" ON "users" FOR DELETE USING (
    get_my_role() = ANY (ARRAY['diretoria', 'admin'])
);


-- Regras para a tabela PRODUCTS
CREATE POLICY "Leitura de produtos autenticados" ON "products" FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Inserção de produtos por diretoria" ON "products" FOR INSERT WITH CHECK (
    get_my_role() = ANY (ARRAY['diretoria', 'admin'])
);

CREATE POLICY "Edição de produtos por diretoria" ON "products" FOR UPDATE USING (
    get_my_role() = ANY (ARRAY['diretoria', 'admin'])
);

CREATE POLICY "Deleção de produtos por diretoria" ON "products" FOR DELETE USING (
    get_my_role() = ANY (ARRAY['diretoria', 'admin'])
);


-- Regras para a tabela STAGES
CREATE POLICY "Leitura de estágios autenticados" ON "stages" FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Inserção de estágios por diretoria" ON "stages" FOR INSERT WITH CHECK (
    get_my_role() = ANY (ARRAY['diretoria', 'admin'])
);

CREATE POLICY "Edição de estágios por diretoria" ON "stages" FOR UPDATE USING (
    get_my_role() = ANY (ARRAY['diretoria', 'admin'])
);

CREATE POLICY "Deleção de estágios por diretoria" ON "stages" FOR DELETE USING (
    get_my_role() = ANY (ARRAY['diretoria', 'admin'])
);


-- Regras para a tabela LEADS (Hierarquia de Acesso)
CREATE POLICY "Visualização de leads conforme hierarquia" ON "leads" FOR SELECT USING (
    "agentId" = get_my_id()
    OR "leaderId" = get_my_id()
    OR get_my_role() = ANY (ARRAY['diretoria', 'admin'])
);

CREATE POLICY "Inserção de leads" ON "leads" FOR INSERT WITH CHECK (
    "agentId" = get_my_id()
    OR "leaderId" = get_my_id()
    OR get_my_role() = ANY (ARRAY['diretoria', 'admin'])
);

CREATE POLICY "Edição de leads" ON "leads" FOR UPDATE USING (
    "agentId" = get_my_id()
    OR "leaderId" = get_my_id()
    OR get_my_role() = ANY (ARRAY['diretoria', 'admin'])
);

CREATE POLICY "Deleção de leads" ON "leads" FOR DELETE USING (
    "agentId" = get_my_id()
    OR "leaderId" = get_my_id()
    OR get_my_role() = ANY (ARRAY['diretoria', 'admin'])
);


-- Regras para a tabela CLIENTS (Hierarquia de Acesso)
CREATE POLICY "Visualização de clientes conforme hierarquia" ON "clients" FOR SELECT USING (
    "agentId" = get_my_id()
    OR "leaderId" = get_my_id()
    OR get_my_role() = ANY (ARRAY['diretoria', 'admin'])
);

CREATE POLICY "Inserção de clientes por diretoria" ON "clients" FOR INSERT WITH CHECK (
    get_my_role() = ANY (ARRAY['diretoria', 'admin'])
);

CREATE POLICY "Edição de clientes por diretoria" ON "clients" FOR UPDATE USING (
    get_my_role() = ANY (ARRAY['diretoria', 'admin'])
);

CREATE POLICY "Deleção de clientes por diretoria" ON "clients" FOR DELETE USING (
    get_my_role() = ANY (ARRAY['diretoria', 'admin'])
);


-- Regras para a tabela APORTES
CREATE POLICY "Visualização de aportes conforme hierarquia" ON "aportes" FOR SELECT USING (
    "agentId" = get_my_id()
    OR "leaderId" = get_my_id()
    OR get_my_role() = ANY (ARRAY['diretoria', 'admin'])
);

CREATE POLICY "Criação de aportes pelo assessor" ON "aportes" FOR INSERT WITH CHECK (
    "agentId" = get_my_id()
    OR get_my_role() = ANY (ARRAY['diretoria', 'admin'])
);

CREATE POLICY "Apenas diretoria altera aportes e homologa" ON "aportes" FOR UPDATE USING (
    get_my_role() = ANY (ARRAY['diretoria', 'admin'])
);

CREATE POLICY "Deleção de aportes por diretoria" ON "aportes" FOR DELETE USING (
    get_my_role() = ANY (ARRAY['diretoria', 'admin'])
);


-- Regras para a tabela FATURAMENTO HISTORICO
CREATE POLICY "Visualização de faturamento conforme hierarquia" ON "faturamentoHistorico" FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "clients" c
        WHERE c.code = "clientCode"
        AND (
            c."agentId" = get_my_id()
            OR c."leaderId" = get_my_id()
        )
    )
    OR get_my_role() = ANY (ARRAY['diretoria', 'admin'])
);

CREATE POLICY "Inserção de faturamento por diretoria" ON "faturamentoHistorico" FOR INSERT WITH CHECK (
    get_my_role() = ANY (ARRAY['diretoria', 'admin'])
);

CREATE POLICY "Edição de faturamento por diretoria" ON "faturamentoHistorico" FOR UPDATE USING (
    get_my_role() = ANY (ARRAY['diretoria', 'admin'])
);

CREATE POLICY "Deleção de faturamento por diretoria" ON "faturamentoHistorico" FOR DELETE USING (
    get_my_role() = ANY (ARRAY['diretoria', 'admin'])
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Trigger para executar a função antes de salvar o aporte.
-- Dispara em QUALQUER INSERT/UPDATE (não só quando value/productId mudam)
-- para impedir que um PATCH parcial grave comissão sem recalcular.
CREATE OR REPLACE TRIGGER trigger_calculate_aporte_commission
    BEFORE INSERT OR UPDATE ON "aportes"
    FOR EACH ROW
    EXECUTE FUNCTION calculate_aporte_commission();


-- ==================== MIGRAÇÕES ====================

-- 2026-08-15 — "performanceFee" de TEXT para NUMERIC.
-- Antes guardava frases ("20% sobre o que exceder o CDI"); a taxa agora é
-- editável na tela de produtos e precisa ser calculável. A referência de
-- cálculo continua na coluna "benchmark", que já existia em separado.
-- Os CREATE TABLE acima usam IF NOT EXISTS, então em bancos já provisionados
-- só este bloco aplica a mudança. Idempotente: não faz nada se já for numérico.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'products'
          AND column_name = 'performanceFee'
          AND data_type <> 'numeric'
    ) THEN
        -- O grupo é NÃO-capturante de propósito: substring(... from 'regex')
        -- devolve só o primeiro grupo entre parênteses quando eles existem, e
        -- um '(...)' comum faria "20% sobre o CDI" (grupo opcional sem match)
        -- virar NULL e, pelo COALESCE, 0.00 silenciosamente.
        -- O replace trata decimal com vírgula ("12,5%"), que não faz cast direto.
        ALTER TABLE "products"
            ALTER COLUMN "performanceFee" TYPE NUMERIC(5,2)
            USING COALESCE(
                NULLIF(
                    replace(
                        substring("performanceFee" from '[0-9]+(?:[.,][0-9]+)?'),
                        ',', '.'
                    ),
                    ''
                )::NUMERIC,
                0.00
            );

        ALTER TABLE "products"
            ALTER COLUMN "performanceFee" SET DEFAULT 0.00;

        UPDATE "products" SET "performanceFee" = 0.00 WHERE "performanceFee" IS NULL;

        ALTER TABLE "products"
            ALTER COLUMN "performanceFee" SET NOT NULL;
    END IF;
END $$;
