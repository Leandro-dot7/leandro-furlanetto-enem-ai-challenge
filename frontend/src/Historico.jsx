/**
 * Historico.jsx — Histórico de desempenho do estudante
 * Busca simulados e redações reais do Supabase
 * Exibe gráfico de evolução (recharts) + tabela de histórico
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import PageHeader from './components/ui/PageHeader.jsx';
import FeedbackMessage from './components/ui/FeedbackMessage.jsx';
import {
  BarChart2, BookOpen, FileText, TrendingUp, Calendar,
  CheckCircle, Loader2, ChevronRight, BrainCircuit
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

function EmptyState({ icon: Icon, title, description, linkTo, linkLabel }) {
  return (
    <div className="app-surface-muted rounded-2xl px-6 py-12 text-center sm:py-16">
      <div className="feature-icon mx-auto mb-5">
        <Icon size={24} aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-xl font-bold tracking-tight">{title}</h3>
      <p className="app-text-muted mx-auto mb-6 max-w-sm text-sm leading-6">{description}</p>
      {linkTo && (
        <Link
          to={linkTo}
          className="btn-primary inline-flex min-h-12 items-center justify-center gap-2 px-5 py-3 text-sm"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(iso));
}

export default function Historico() {
  const { user } = useAuth();
  const [simulados, setSimulados] = useState([]);
  const [redacoes, setRedacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aba, setAba] = useState('simulados'); // simulados | redacoes
  const [dataError, setDataError] = useState('');

  useEffect(() => {
    if (!user) return;
    async function fetchData() {
      setLoading(true);
      setDataError('');
      const [{ data: sims, error: simsError }, { data: reds, error: redsError }] = await Promise.all([
        supabase
          .from('simulados')
          .select('*')
          .eq('user_id', user.id)
          .order('criado_em', { ascending: false }),
        supabase
          .from('redacoes')
          .select('id, tema, nota_total, criado_em')
          .eq('user_id', user.id)
          .order('criado_em', { ascending: false }),
      ]);
      if (simsError) throw simsError;
      if (redsError) throw redsError;
      setSimulados(sims || []);
      setRedacoes(reds || []);
      setLoading(false);
    }
    fetchData().catch((error) => {
      console.error('[Historico] Falha ao carregar histórico:', error.message);
      setDataError('Não foi possível carregar seu histórico. Confirme se o schema do Supabase foi executado.');
      setLoading(false);
    });
  }, [user]);

  // Dados do gráfico — últimos 10 simulados em ordem cronológica
  const chartData = [...simulados]
    .reverse()
    .slice(-10)
    .map((s, i) => ({
      nome: `#${i + 1}`,
      acertos: Math.round((s.acertos / s.total_questoes) * 100),
      materia: s.materia,
    }));

  // Estatísticas
  const mediaGeral = simulados.length
    ? Math.round(simulados.reduce((acc, s) => acc + (s.acertos / s.total_questoes) * 100, 0) / simulados.length)
    : 0;

  return (
    <div className="page-stack mx-auto max-w-6xl space-y-8 animate-slide-up">
      <PageHeader
        eyebrow="Visão geral"
        title="Histórico de desempenho"
        description="Acompanhe sua evolução nos simulados e redações."
        actions={<Link to="/simulado" className="btn-primary inline-flex min-h-12 items-center gap-2 px-5 py-3 text-sm">Fazer simulado <ChevronRight size={17} aria-hidden="true" /></Link>}
      />

      {loading ? (
        <div className="app-text-muted flex items-center justify-center gap-3 py-24" role="status">
          <Loader2 size={24} className="app-text-accent animate-spin" aria-hidden="true" />
          Carregando seu histórico…
        </div>
      ) : (
        <>
          {dataError && <FeedbackMessage tone="warning" title="Histórico indisponível">{dataError}</FeedbackMessage>}
          {/* Cards resumo */}
          <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Resumo do seu desempenho">
            {[
              { label: 'Simulados', value: simulados.length, icon: BookOpen },
              { label: 'Redações', value: redacoes.length, icon: FileText },
              { label: 'Média geral', value: simulados.length ? `${mediaGeral}%` : '—', icon: TrendingUp },
              { label: 'Último simulado', value: simulados[0] ? formatDate(simulados[0].criado_em) : '—', icon: Calendar },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="app-surface app-card stat-card min-w-0 p-4 sm:p-6">
                <div className="mb-5 flex items-start justify-between gap-2">
                  <p className="app-text-muted text-sm font-medium">{label}</p>
                  <Icon size={19} className="app-text-accent shrink-0" aria-hidden="true" />
                </div>
                <p className={`font-bold tracking-tight tabular-nums ${label === 'Último simulado' ? 'text-lg sm:text-2xl' : 'text-2xl sm:text-3xl'}`}>{dataError ? '—' : value}</p>
              </div>
            ))}
          </section>

          {/* Gráfico de evolução */}
          {simulados.length >= 2 && (
            <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]" aria-label="Sua evolução e próximos passos">
            <div className="app-surface app-card min-w-0 p-5 sm:p-7">
              <div className="mb-6 flex items-start justify-between gap-3">
              <div>
              <p className="eyebrow app-text-accent mb-2">Cada tentativa conta</p>
              <h2 id="historico-chart-title" className="section-heading text-xl font-bold tracking-tight">
                Evolução dos últimos {Math.min(simulados.length, 10)} simulados
              </h2>
              <p className="app-text-muted mt-2 text-sm">Percentual de acertos, do mais antigo ao mais recente.</p>
              </div>
              <BarChart2 size={22} className="app-text-accent shrink-0" aria-hidden="true" />
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart accessibilityLayer aria-labelledby="historico-chart-title" data={chartData} margin={{ top: 10, right: 12, left: -14, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="var(--app-border)" />
                  <XAxis dataKey="nome" axisLine={false} tickLine={false} tickMargin={10} tick={{ fontSize: 12, fill: 'var(--app-text-muted)' }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--app-text-muted)' }} unit="%" />
                  <Tooltip
                    formatter={(val) => [`${val}%`, 'Acertos']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--app-border)', backgroundColor: 'var(--app-surface)', color: 'var(--app-text)', fontSize: '13px' }}
                    itemStyle={{ color: 'var(--app-text)' }}
                    labelStyle={{ color: 'var(--app-text-muted)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="acertos"
                    stroke="var(--app-primary)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: 'var(--app-surface)', stroke: 'var(--app-primary)', strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                    name="Acertos"
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              <details className="app-text-muted mt-4 text-sm">
                <summary className="min-h-11 cursor-pointer py-3 font-medium">Ver valores do gráfico</summary>
                <ol className="mt-2 space-y-2">
                  {chartData.map((item) => <li key={item.nome} className="flex flex-wrap justify-between gap-2"><span>{item.nome} · {item.materia}</span><span className="font-semibold tabular-nums">{item.acertos}% de acertos</span></li>)}
                </ol>
              </details>
            </div>
            <aside className="app-surface-muted app-card flex flex-col items-start justify-between gap-6 p-6">
              <div>
                <span className="feature-icon aqua mb-5"><BrainCircuit size={24} aria-hidden="true" /></span>
                <h3 className="text-xl font-bold tracking-tight">Transforme a revisão em aprendizado.</h3>
                <p className="app-text-muted mt-3 text-sm leading-6">Olhe para cada resultado e leve os assuntos que precisam de atenção ao Tutor IA.</p>
              </div>
              <Link to="/tutor" className="btn-secondary inline-flex min-h-12 items-center justify-center gap-2 px-4 py-3 text-sm">Abrir Tutor IA <ChevronRight size={16} aria-hidden="true" /></Link>
            </aside>
            </section>
          )}

          {/* Abas */}
          <section className="app-surface app-card p-4 sm:p-7" aria-labelledby="historico-registros-title">
            <div className="mb-6 flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
            <div>
              <h2 id="historico-registros-title" className="section-heading text-xl font-bold tracking-tight">Suas atividades</h2>
              <p className="app-text-muted mt-2 text-sm">Seus registros mais recentes aparecem primeiro.</p>
            </div>
            <div className="app-surface-muted grid grid-cols-2 gap-1 rounded-2xl p-1.5" role="tablist" aria-label="Tipo de atividade">
              {[
                { id: 'simulados', label: `Simulados (${simulados.length})`, icon: BookOpen },
                { id: 'redacoes', label: `Redações (${redacoes.length})`, icon: FileText },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  id={`tab-${id}`}
                  type="button"
                  role="tab"
                  aria-selected={aba === id}
                  aria-controls={`panel-${id}`}
                  tabIndex={aba === id ? 0 : -1}
                  onClick={() => setAba(id)}
                  onKeyDown={(event) => {
                    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
                    event.preventDefault();
                    const next = event.key === 'Home' ? 'simulados' : event.key === 'End' ? 'redacoes' : id === 'simulados' ? 'redacoes' : 'simulados';
                    setAba(next);
                    document.getElementById(`tab-${next}`)?.focus();
                  }}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-[background-color,color,box-shadow] ${aba === id ? 'app-surface shadow-sm' : 'app-text-muted'}`}
                >
                  <Icon size={17} className="hidden shrink-0 sm:block" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
            </div>

            {/* Lista simulados */}
            {aba === 'simulados' && (
              <div id="panel-simulados" role="tabpanel" aria-labelledby="tab-simulados" tabIndex={0}>
                {simulados.length === 0 ? (
                  <EmptyState
                    icon={BookOpen}
                    title="Nenhum simulado ainda"
                    description="Faça seu primeiro simulado para ver seu histórico aqui"
                    linkTo="/simulado"
                    linkLabel="→ Fazer simulado"
                  />
                ) : (
                  <ul className="space-y-3">
                    {simulados.map((s) => {
                      const pct = Math.round((s.acertos / s.total_questoes) * 100);
                      return (
                        <li key={s.id} className="app-surface-muted flex items-center gap-4 rounded-2xl p-4 sm:gap-5 sm:p-5">
                          <div className={`flex h-14 w-16 shrink-0 items-center justify-center rounded-2xl text-lg font-bold tabular-nums
                            ${pct >= 70 ? 'bg-emerald-100 text-emerald-700' : pct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}
                          >
                            {pct}%
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="break-words text-sm font-semibold sm:text-base">{s.materia}</h3>
                            <p className="app-text-muted mt-1 text-xs leading-5 sm:text-sm">{s.acertos}/{s.total_questoes} acertos • {formatDate(s.criado_em)}</p>
                          </div>
                          <CheckCircle
                            size={16}
                            className="app-text-subtle hidden shrink-0 sm:block"
                            aria-hidden="true"
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            {/* Lista redações */}
            {aba === 'redacoes' && (
              <div id="panel-redacoes" role="tabpanel" aria-labelledby="tab-redacoes" tabIndex={0}>
                {redacoes.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="Nenhuma redação ainda"
                    description="Envie sua primeira redação para receber feedback da IA"
                    linkTo="/redacao"
                    linkLabel="→ Praticar redação"
                  />
                ) : (
                  <ul className="space-y-3">
                    {redacoes.map((r) => (
                      <li key={r.id} className="app-surface-muted flex items-center gap-4 rounded-2xl p-4 sm:gap-5 sm:p-5">
                        <div className="app-surface app-text-accent flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl tabular-nums">
                          <span className="text-lg font-bold">{r.nota_total}</span>
                          <span className="app-text-subtle text-xs">/ 1000</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="break-words text-sm font-semibold leading-6 sm:text-base">{r.tema}</h3>
                          <p className="app-text-muted mt-1 text-xs sm:text-sm">{formatDate(r.criado_em)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
