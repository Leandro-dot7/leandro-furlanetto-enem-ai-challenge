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
  CheckCircle, Loader2
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

function EmptyState({ icon: Icon, title, description, linkTo, linkLabel }) {
  return (
    <div className="app-surface app-card rounded-2xl p-8 text-center">
      <div className="flex items-center justify-center w-12 h-12 bg-slate-100 rounded-xl mx-auto mb-3">
        <Icon size={22} className="text-slate-400" aria-hidden="true" />
      </div>
      <h3 className="font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 mb-4">{description}</p>
      {linkTo && (
        <Link
          to={linkTo}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-400 rounded-xl px-4 py-2 transition-[border-color,color,box-shadow] focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
    <div className="max-w-4xl mx-auto space-y-6 animate-slide-up">
      <PageHeader
        eyebrow="Visão geral"
        title="Histórico de desempenho"
        description="Acompanhe sua evolução nos simulados e redações."
        actions={<BarChart2 size={22} className="text-emerald-600" aria-hidden="true" />}
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="text-indigo-500 animate-spin" />
        </div>
      ) : (
        <>
          {dataError && <FeedbackMessage tone="warning" title="Histórico indisponível">{dataError}</FeedbackMessage>}
          {/* Cards resumo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Simulados', value: simulados.length, icon: BookOpen, color: 'indigo' },
              { label: 'Redações', value: redacoes.length, icon: FileText, color: 'amber' },
              { label: 'Média geral', value: `${mediaGeral}%`, icon: TrendingUp, color: 'emerald' },
              { label: 'Último simulado', value: simulados[0] ? formatDate(simulados[0].criado_em) : '—', icon: Calendar, color: 'violet' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="app-surface app-card flex items-center gap-3 rounded-2xl p-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-${color}-100 flex-shrink-0`}>
                  <Icon size={18} className={`text-${color}-600`} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">{value}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Gráfico de evolução */}
          {simulados.length >= 2 && (
            <div className="app-surface app-card rounded-2xl p-6">
              <h2 className="font-semibold text-slate-900 mb-4 text-sm">
                📈 Evolução dos últimos {Math.min(simulados.length, 10)} simulados
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="nome" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} unit="%" />
                  <Tooltip
                    formatter={(val) => [`${val}%`, 'Acertos']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="acertos"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#6366f1' }}
                    activeDot={{ r: 6 }}
                    name="Acertos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Abas */}
          <div>
            <div className="flex gap-2 mb-4" role="tablist">
              {[
                { id: 'simulados', label: `Simulados (${simulados.length})`, icon: BookOpen },
                { id: 'redacoes', label: `Redações (${redacoes.length})`, icon: FileText },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={aba === id}
                  onClick={() => setAba(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-[background-color,color,box-shadow] focus:outline-none focus:ring-2 focus:ring-indigo-400
                    ${aba === id
                      ? 'bg-indigo-600 text-white'
                      : 'app-surface border border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                >
                  <Icon size={15} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>

            {/* Lista simulados */}
            {aba === 'simulados' && (
              <div role="tabpanel" aria-label="Histórico de simulados">
                {simulados.length === 0 ? (
                  <EmptyState
                    icon={BookOpen}
                    title="Nenhum simulado ainda"
                    description="Faça seu primeiro simulado para ver seu histórico aqui"
                    linkTo="/simulado"
                    linkLabel="→ Fazer simulado"
                  />
                ) : (
                  <div className="space-y-2">
                    {simulados.map((s) => {
                      const pct = Math.round((s.acertos / s.total_questoes) * 100);
                      return (
                        <div key={s.id} className="app-surface app-card flex items-center gap-4 rounded-2xl p-4">
                          <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm
                            ${pct >= 70 ? 'bg-emerald-100 text-emerald-700' : pct >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}
                          >
                            {pct}%
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 text-sm">{s.materia}</p>
                            <p className="text-xs text-slate-500">{s.acertos}/{s.total_questoes} acertos • {formatDate(s.criado_em)}</p>
                          </div>
                          <CheckCircle
                            size={16}
                            className={pct >= 70 ? 'text-emerald-500' : 'text-slate-300'}
                            aria-hidden="true"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Lista redações */}
            {aba === 'redacoes' && (
              <div role="tabpanel" aria-label="Histórico de redações">
                {redacoes.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="Nenhuma redação ainda"
                    description="Envie sua primeira redação para receber feedback da IA"
                    linkTo="/redacao"
                    linkLabel="→ Praticar redação"
                  />
                ) : (
                  <div className="space-y-2">
                    {redacoes.map((r) => (
                      <div key={r.id} className="app-surface app-card flex items-center gap-4 rounded-2xl p-4">
                        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-amber-100 rounded-xl font-bold text-sm text-amber-700">
                          {r.nota_total}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 text-sm truncate">{r.tema}</p>
                          <p className="text-xs text-slate-500">{formatDate(r.criado_em)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
