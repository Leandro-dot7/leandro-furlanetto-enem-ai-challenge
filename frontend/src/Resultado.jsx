/**
 * Resultado.jsx — Tela de resultado do simulado
 * Recebe dados via location.state do Simulado.jsx
 * Mostra: nota, acertos/total, revisão das questões, CTA para novo simulado
 */
import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Trophy, RotateCcw, BarChart2, CheckCircle, XCircle, ChevronDown, BookOpen, List } from 'lucide-react';
import FeedbackMessage from './components/ui/FeedbackMessage.jsx';

// Calcula a pontuação TRI estimada (simplificado)
function calcPontuacao(acertos, total) {
  const pct = acertos / total;
  if (pct >= 0.9) return Math.round(880 + (pct - 0.9) * 1200);
  if (pct >= 0.7) return Math.round(720 + (pct - 0.7) * 800);
  if (pct >= 0.5) return Math.round(560 + (pct - 0.5) * 800);
  return Math.round(pct * 1120);
}

function getDesempenho(pct) {
  if (pct >= 0.9) return { label: 'Excelente!', color: 'emerald' };
  if (pct >= 0.7) return { label: 'Muito bom!', color: 'indigo' };
  if (pct >= 0.5) return { label: 'Bom! Continue estudando', color: 'amber' };
  return { label: 'Precisa revisar o conteúdo', color: 'red' };
}

// Card de revisão de questão
function QuestaoRevisao({ questao, resposta, idx }) {
  const [open, setOpen] = React.useState(false);
  const correto = resposta === questao.gabarito;

  return (
    <div className="app-surface app-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-5 text-left text-sm transition-colors hover:bg-[var(--app-surface-muted)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500 sm:gap-4 sm:px-6"
        aria-expanded={open}
        aria-controls={`questao-${idx}`}
      >
        {correto
          ? <CheckCircle size={22} className="text-emerald-600 flex-shrink-0" aria-hidden="true" />
          : <XCircle size={22} className="text-red-600 flex-shrink-0" aria-hidden="true" />
        }
        <span className="min-w-0 flex-1">
          <span className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1"><span className="font-bold">Questão {idx + 1}</span><span className="app-text-subtle text-xs">{correto ? 'Resposta correta' : 'Para revisar'}</span></span>
          <span className="app-text-muted line-clamp-2 leading-relaxed">{questao.enunciado.slice(0, 80)}…</span>
        </span>
        <ChevronDown
          size={16}
          className={`app-text-subtle flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div id={`questao-${idx}`} className="space-y-5 border-t border-[var(--app-border)] px-4 py-6 text-sm sm:px-6">
          <p className="whitespace-pre-line text-base leading-8">{questao.enunciado}</p>
          <div className="space-y-2">
            {Object.entries(questao.alternativas).map(([l, t]) => (
              <div
                key={l}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl text-sm leading-relaxed
                  ${l === questao.gabarito ? 'bg-emerald-100 text-emerald-800 font-medium' :
                    l === resposta && resposta !== questao.gabarito ? 'bg-red-100 text-red-700' :
                    'app-surface-muted app-text-muted'
                  }`}
              >
                <span className="font-bold flex-shrink-0">{l})</span>
                <span className="min-w-0 flex-1">{t}
                  {l === questao.gabarito && <span className="mt-1 block text-xs font-bold">Gabarito{l === resposta ? ' · Sua resposta' : ''}</span>}
                  {l === resposta && l !== questao.gabarito && <span className="mt-1 block text-xs font-bold">Sua resposta</span>}
                </span>
              </div>
            ))}
          </div>
          <div className="app-surface-muted rounded-2xl p-5 text-sm leading-7">
            <strong className="app-text-accent mb-2 flex items-center gap-2"><BookOpen size={17} aria-hidden="true" />Entenda a resposta</strong>
            <p className="app-text-muted">{questao.explicacao}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Resultado() {
  const location = useLocation();
  const navigate = useNavigate();

  // Se não houver dados (acesso direto à URL), redireciona
  const state = location.state;
  if (!state) {
    return (
      <div className="app-surface app-card mx-auto max-w-lg px-6 py-16 text-center">
        <span className="feature-icon mx-auto mb-5" aria-hidden="true"><List /></span>
        <h2 className="mb-2 text-2xl font-extrabold">Seu próximo treino começa aqui</h2>
        <p className="app-text-muted mb-6">Nenhum simulado encontrado.</p>
        <Link to="/simulado" className="btn-primary min-h-12 px-6">
          Fazer um simulado
        </Link>
      </div>
    );
  }

  const { acertos, total, materia, questoes, respostas, persistError } = state;
  const pct = acertos / total;
  const pontuacao = calcPontuacao(acertos, total);
  const desempenho = getDesempenho(pct);

  return (
    <div className="page-stack mx-auto max-w-6xl space-y-6">
      <header>
        <p className="eyebrow mb-2">Sessão concluída</p>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">{desempenho.label}</h1>
        <p className="app-text-muted mt-2 text-sm">Simulado de {materia}. Reserve um momento para revisar suas respostas.</p>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
      {/* Card de resultado */}
      <div className="app-surface app-card p-6 sm:p-8 lg:sticky lg:top-6">
        {persistError && (
          <div className="mb-5 text-left">
            <FeedbackMessage tone="warning" title="Histórico indisponível">
              Resultado calculado, mas não foi possível salvar no histórico: {persistError}
            </FeedbackMessage>
          </div>
        )}
        <div className="feature-icon aqua mb-6">
          <Trophy size={28} aria-hidden="true" />
        </div>

        <h2 className="eyebrow mb-3">Seu aproveitamento</h2>
        <p className="app-text-accent text-6xl font-extrabold tracking-tight tabular-nums">{Math.round(pct * 100)}<span className="ml-1 text-3xl">%</span></p>
        <p className="app-text-muted mb-6 mt-2 text-sm">{acertos} de {total} questões corretas</p>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="stat-card app-surface-muted rounded-2xl p-4">
            <p className="text-2xl font-extrabold tabular-nums">{acertos}/{total}</p>
            <p className="app-text-subtle mt-1 text-xs">Acertos</p>
          </div>
          <div className="stat-card app-surface-muted rounded-2xl p-4">
            <p className="text-2xl font-extrabold tabular-nums">{pontuacao}</p>
            <p className="app-text-subtle mt-1 text-xs">Pts est. TRI</p>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="mb-6">
          <div className="app-surface-muted h-2 overflow-hidden rounded-full" role="progressbar" aria-label="Aproveitamento no simulado" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-[width] duration-700"
              style={{ width: `${pct * 100}%` }}
            />
          </div>
          <p className="app-text-subtle mt-3 text-xs leading-relaxed">A pontuação é uma estimativa simplificada e não corresponde à nota oficial do ENEM.</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/simulado')}
            className="btn-primary min-h-12 w-full gap-2 px-4 text-sm"
          >
            <RotateCcw size={15} aria-hidden="true" />
            Novo simulado
          </button>
          <Link
            to="/historico"
            className="btn-secondary min-h-12 w-full gap-2 px-4 text-sm"
          >
            <BarChart2 size={15} aria-hidden="true" />
            Ver histórico
          </Link>
        </div>
      </div>

      {/* Revisão das questões */}
      {questoes && questoes.length > 0 && (
        <div className="min-w-0">
          <h2 className="section-heading mb-2 text-xl font-bold">
            Revisão das questões
          </h2>
          <p className="app-text-muted mb-5 text-sm">Abra uma questão para comparar sua escolha com o gabarito.</p>
          <div className="space-y-3">
            {questoes.map((q, i) => (
              <QuestaoRevisao
                key={q.id}
                questao={q}
                resposta={respostas?.[i]}
                idx={i}
              />
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
