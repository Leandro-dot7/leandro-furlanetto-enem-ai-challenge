-- ==============================================================================
-- Minerva ENEM — Script de Configuração do Banco de Dados (Supabase / PostgreSQL)
-- Execute este script no SQL Editor do seu Dashboard Supabase
-- ==============================================================================

-- 1. Habilitar extensão UUID caso não esteja habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
