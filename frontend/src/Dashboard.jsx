/**
 * Dashboard.jsx — Painel principal do estudante
 * Mostra: boas-vindas, cards de acesso rápido, resumo de progresso
 * Dados de progresso: buscados do Supabase (histórico de simulados)
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import PageHeader from './components/ui/PageHeader.jsx';
import FeedbackMessage from './components/ui/FeedbackMessage.jsx';
import {
  BookOpen,
  BrainCircuit,
  FileText,
  BarChart2,
  ChevronRight,
  Target,
  TrendingUp,
  Award,
  Flame,
} from 'lucide-react';

// Card de acesso rápido
function FeatureCard({ to, icon: Icon, title, description, aqua = false }) {
  return (
    <Link
      to={to}
      className="app-surface app-card app-card-interactive group flex h-full flex-col p-6 sm:p-7"
      aria-label={`Ir para ${title}`}
    >
      <div className="mb-6 flex items-center justify-between">
        <span className={`feature-icon ${aqua ? 'aqua' : ''}`}>
          <Icon size={23} aria-hidden="true" />
        </span>
        <ChevronRight size={20} className="app-text-subtle" aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-xl font-bold tracking-tight">
        {title}
      </h3>
      <p className="app-text-muted flex-1 text-sm leading-6">{description}</p>
      <div className="app-text-accent mt-6 flex items-center gap-2 text-sm font-semibold">
        <span>Acessar</span>
        <ChevronRight size={14} aria-hidden="true" />
      </div>
    </Link>
  );
}

// Card de estatística
function StatCard({ label, value, icon: Icon, suffix = '' }) {
  return (
    <div className="app-surface app-card stat-card min-w-0 p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="app-text-muted text-sm font-medium">{label}</p>
        <Icon size={20} className="app-text-accent shrink-0" aria-hidden="true" />
      </div>
      <p className="text-4xl font-bold tracking-tight tabular-nums">
        {value}<span className="app-text-subtle ml-1 text-xl">{suffix}</span>
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, mediaAcertos: 0, redacoes: 0 });
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState('');

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Estudante';

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;

      try {
        // Busca histórico de simulados do usuário no Supabase
        const { data: simulados, error: simuladosError } = await supabase
          .from('simulados')
          .select('acertos, total_questoes')
          .eq('user_id', user.id);

        const { count: redacoes, error: redacoesError } = await supabase
          .from('redacoes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (simuladosError) throw simuladosError;
        if (redacoesError) throw redacoesError;

        if (simulados && simulados.length > 0) {
          const media =
            simulados.reduce((acc, s) => acc + (s.acertos / s.total_questoes) * 100, 0) /
            simulados.length;

          setStats({
            total: simulados.length,
            mediaAcertos: Math.round(media),
            redacoes: redacoes || 0,
          });
        } else {
          setStats({ total: 0, mediaAcertos: 0, redacoes: redacoes || 0 });
        }
      } catch (error) {
        console.error('[Dashboard] Falha ao carregar histórico:', error.message);
        setDataError('Não foi possível carregar seu histórico. Confirme se o schema do Supabase foi executado.');
        // Silencia erros de tabela não existente (setup inicial)
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  return (
    <div className="page-stack mx-auto max-w-6xl space-y-8 animate-slide-up">
      <PageHeader
        eyebrow="Seu estúdio de preparação"
        title={`Olá, ${userName}!`}
        description="Acompanhe seu progresso e escolha a próxima atividade para estudar para o ENEM."
      />

      <section className="grid gap-5 lg:grid-cols-[1.6fr_1fr]" aria-label="Sua próxima atividade">
        <div className="app-surface app-card relative overflow-hidden p-6 sm:p-9">
          <div className="mb-8 flex items-center gap-3">
            <span className="feature-icon"><BookOpen size={24} aria-hidden="true" /></span>
            <p className="eyebrow app-text-accent">Um passo mais perto do ENEM</p>
          </div>
          <h2 className="max-w-lg text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Seu próximo desafio começa aqui.</h2>
          <p className="app-text-muted mt-4 max-w-lg text-base leading-7">Questões no estilo ENEM, por área do conhecimento. Escolha uma matéria e coloque o que aprendeu em prática.</p>
          <Link to="/simulado" className="btn-primary mt-8 inline-flex min-h-12 items-center justify-center gap-3 px-6 py-3">
            Fazer Simulado <ChevronRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <aside className="app-surface-muted app-card flex flex-col justify-between gap-6 p-6 sm:p-8" aria-label="Dica de estudo do dia">
          <div>
            <span className="feature-icon aqua mb-5"><Flame size={24} aria-hidden="true" /></span>
            <p className="eyebrow app-text-accent mb-3">Dica Minerva</p>
            <h2 className="text-2xl font-bold tracking-tight">Revisar também é avançar.</h2>
            <p className="app-text-muted mt-3 text-sm leading-6">Depois do simulado, reserve um momento para entender seus erros. Leve suas dúvidas ao Tutor IA e retome os conceitos antes do próximo desafio.</p>
          </div>
          <Link to="/tutor" className="btn-secondary inline-flex min-h-12 items-center justify-center gap-2 px-5 py-3">Revisar com o Tutor IA <ChevronRight size={17} aria-hidden="true" /></Link>
        </aside>
      </section>

      {/* Estatísticas */}
      <section aria-label="Suas estatísticas de estudo">
        {dataError && <FeedbackMessage tone="warning" title="Progresso indisponível">{dataError}</FeedbackMessage>}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-heading text-xl font-bold tracking-tight">
          Seu progresso
        </h2>
        <Link to="/historico" className="app-text-accent inline-flex min-h-11 items-center gap-1 text-sm font-semibold">Ver histórico <ChevronRight size={16} aria-hidden="true" /></Link>
        </div>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-3" role="status" aria-label="Carregando suas estatísticas">
            <span className="sr-only">Carregando suas estatísticas…</span>
            {[1, 2, 3].map((i) => (
              <div key={i} className="app-surface app-card h-36 animate-pulse p-5" aria-hidden="true" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Simulados feitos" value={dataError ? '—' : stats.total} icon={Target} />
            <StatCard label="Média de acertos" value={dataError || !stats.total ? '—' : stats.mediaAcertos} icon={TrendingUp} suffix={dataError || !stats.total ? '' : '%'} />
            <StatCard label="Redações enviadas" value={dataError ? '—' : stats.redacoes} icon={Award} />
          </div>
        )}
      </section>

      {/* Acesso rápido */}
      <section aria-label="Acesso rápido às funcionalidades">
        <h2 className="section-heading mb-4 text-xl font-bold tracking-tight">
          O que você quer fazer?
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            to="/tutor"
            icon={BrainCircuit}
            title="Tutor IA"
            description="Tire dúvidas de qualquer matéria do ENEM com seu assistente inteligente."
          />
          <FeatureCard
            to="/redacao"
            icon={FileText}
            title="Redação"
            description="Escreva e receba correção detalhada pelas 5 competências do ENEM."
            aqua
          />
          <FeatureCard
            to="/historico"
            icon={BarChart2}
            title="Histórico"
            description="Acompanhe sua evolução e veja onde precisa melhorar."
          />
        </div>
      </section>

    </div>
  );
}
