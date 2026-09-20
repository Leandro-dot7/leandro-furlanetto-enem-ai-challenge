-- ==============================================================================
-- Minerva ENEM — Script de Configuração do Banco de Dados (Supabase / PostgreSQL)
-- Execute este script no SQL Editor do seu Dashboard Supabase
-- ==============================================================================

-- 1. Habilitar extensão UUID caso não esteja habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tornar o script reexecutável: remove apenas as políticas gerenciadas por este schema.
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('perfis', 'simulados', 'redacoes', 'tutor_conversas', 'tutor_mensagens')
          AND policyname LIKE 'Usu%'
    LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON %I.%I',
            policy_record.policyname,
            policy_record.schemaname,
            policy_record.tablename
        );
    END LOOP;
END $$;

-- 2. Tabela: perfis (Metas e dados complementares dos estudantes)
CREATE TABLE IF NOT EXISTS public.perfis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    curso_alvo TEXT,
    meta_pontuacao INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security) para perfis
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar o próprio perfil"
    ON public.perfis FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir o próprio perfil"
    ON public.perfis FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar o próprio perfil"
    ON public.perfis FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Tabela: simulados (Resultados e histórico dos simulados gerados por IA)
CREATE TABLE IF NOT EXISTS public.simulados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    materia TEXT NOT NULL,
    total_questoes INTEGER NOT NULL,
    acertos INTEGER NOT NULL,
    respostas JSONB,
    questoes JSONB,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para simulados
ALTER TABLE public.simulados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar seus próprios simulados"
    ON public.simulados FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem salvar seus próprios simulados"
    ON public.simulados FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 4. Tabela: redacoes (Histórico de correções de redação via IA)
CREATE TABLE IF NOT EXISTS public.redacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tema TEXT NOT NULL,
    texto TEXT NOT NULL,
    nota_total INTEGER NOT NULL,
    competencias JSONB NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para redacoes
ALTER TABLE public.redacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar suas próprias redações"
    ON public.redacoes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem salvar suas próprias redações"
    ON public.redacoes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Criação de índices para otimização de consultas do histórico
CREATE INDEX IF NOT EXISTS idx_simulados_user_id ON public.simulados(user_id);
CREATE INDEX IF NOT EXISTS idx_redacoes_user_id ON public.redacoes(user_id);

-- 5. Tabelas: tutor_conversas e tutor_mensagens (histórico persistente do Tutor)
CREATE TABLE IF NOT EXISTS public.tutor_conversas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tutor_mensagens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.tutor_conversas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    papel TEXT NOT NULL CHECK (papel IN ('user', 'model')),
    conteudo TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tutor_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_mensagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar suas próprias conversas"
    ON public.tutor_conversas FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias conversas"
    ON public.tutor_conversas FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias conversas"
    ON public.tutor_conversas FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem visualizar suas próprias mensagens"
    ON public.tutor_mensagens FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar mensagens em suas conversas"
    ON public.tutor_mensagens FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1
            FROM public.tutor_conversas
            WHERE id = conversation_id
              AND public.tutor_conversas.user_id = auth.uid()
        )
    );

CREATE INDEX IF NOT EXISTS idx_tutor_conversas_user_updated
    ON public.tutor_conversas(user_id, atualizado_em DESC);
CREATE INDEX IF NOT EXISTS idx_tutor_mensagens_conversation_created
    ON public.tutor_mensagens(conversation_id, criado_em DESC);

-- 5. Privilégios SQL para o PostgREST/Supabase
-- RLS controla quais linhas cada usuário pode acessar; GRANT controla se o papel
-- pode acessar a tabela. Ambos são necessários para o frontend autenticado.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.perfis TO authenticated;
GRANT SELECT, INSERT ON public.simulados TO authenticated;
GRANT SELECT, INSERT ON public.redacoes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.tutor_conversas TO authenticated;
GRANT SELECT, INSERT ON public.tutor_mensagens TO authenticated;
