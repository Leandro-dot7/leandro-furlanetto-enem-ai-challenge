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
function FeatureCard({ to, icon: Icon, title, description, color }) {
  return (
    <Link
      to={to}
      className={`app-surface app-card-interactive group flex flex-col p-5 rounded-2xl hover:border-${color}-300 focus:outline-none focus:ring-2 focus:ring-indigo-400`}
      aria-label={`Ir para ${title}`}
    >
      <div className={`flex items-center justify-center w-11 h-11 rounded-xl bg-${color}-100 mb-4`}>
        <Icon size={22} className={`text-${color}-600`} aria-hidden="true" />
      </div>
      <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-slate-500 flex-1">{description}</p>
      <div className={`flex items-center gap-1 mt-3 text-xs font-medium text-${color}-600`}>
        <span>Acessar</span>
        <ChevronRight size={14} aria-hidden="true" />
      </div>
    </Link>
  );
}

// Card de estatística
function StatCard({ label, value, icon: Icon, color, suffix = '' }) {
  return (
    <div className="app-surface app-card flex items-center gap-4 p-5">
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-${color}-100 flex-shrink-0`}>
        <Icon size={22} className={`text-${color}-600`} aria-hidden="true" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">
          {value}<span className="text-lg">{suffix}</span>
        </p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
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
    <div className="max-w-5xl mx-auto space-y-8 animate-slide-up">
      <PageHeader
        eyebrow="Seu estúdio de preparação"
        title={`Olá, ${userName}! 👋`}
        description="Acompanhe seu progresso e escolha a próxima atividade para estudar para o ENEM."
      />

      {/* Estatísticas */}
      <section aria-label="Suas estatísticas de estudo">
        {dataError && <FeedbackMessage tone="warning" title="Progresso indisponível">{dataError}</FeedbackMessage>}
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Seu progresso
        </h2>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="app-surface app-card h-24 animate-pulse p-5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label="Simulados feitos" value={stats.total} icon={Target} color="indigo" />
            <StatCard label="Média de acertos" value={stats.mediaAcertos} icon={TrendingUp} color="emerald" suffix="%" />
            <StatCard label="Redações enviadas" value={stats.redacoes} icon={Award} color="amber" />
          </div>
        )}
      </section>

      {/* Acesso rápido */}
      <section aria-label="Acesso rápido às funcionalidades">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          O que você quer fazer?
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard
            to="/simulado"
            icon={BookOpen}
            title="Fazer Simulado"
            description="Questões no estilo ENEM geradas por IA, por área do conhecimento."
            color="indigo"
          />
          <FeatureCard
            to="/tutor"
            icon={BrainCircuit}
            title="Tutor IA"
            description="Tire dúvidas de qualquer matéria do ENEM com seu assistente inteligente."
            color="violet"
          />
          <FeatureCard
            to="/redacao"
            icon={FileText}
            title="Redação"
            description="Escreva e receba correção detalhada pelas 5 competências do ENEM."
            color="amber"
          />
          <FeatureCard
            to="/historico"
            icon={BarChart2}
            title="Histórico"
            description="Acompanhe sua evolução e veja onde precisa melhorar."
            color="emerald"
          />
        </div>
      </section>

      {/* Dica do dia */}
      <section
        className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white"
        aria-label="Dica de estudo do dia"
      >
        <div className="flex items-start gap-3">
          <Flame size={22} className="flex-shrink-0 mt-0.5 text-amber-300" aria-hidden="true" />
          <div>
            <h3 className="font-semibold mb-1">💡 Dica Minerva</h3>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Estudantes que fazem pelo menos <strong className="text-white">3 simulados por semana</strong> e
              revisam os erros com o Tutor IA melhoram em média 18% no desempenho em 30 dias.
              Comece pelo seu simulado de hoje!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
