/**
 * Resultado.jsx — Tela de resultado do simulado
 * Recebe dados via location.state do Simulado.jsx
 * Mostra: nota, acertos/total, revisão das questões, CTA para novo simulado
 */
import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Trophy, RotateCcw, BarChart2, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
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
  if (pct >= 0.9) return { label: 'Excelente! 🏆', color: 'emerald' };
  if (pct >= 0.7) return { label: 'Muito bom! 👏', color: 'indigo' };
  if (pct >= 0.5) return { label: 'Bom! Continue estudando 📚', color: 'amber' };
  return { label: 'Precisa revisar o conteúdo 💪', color: 'red' };
}

// Card de revisão de questão
function QuestaoRevisao({ questao, resposta, idx }) {
  const [open, setOpen] = React.useState(false);
  const correto = resposta === questao.gabarito;

  return (
    <div className={`border rounded-xl overflow-hidden ${correto ? 'border-emerald-200' : 'border-red-200'}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors text-sm
          ${correto ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-red-50 hover:bg-red-100'}`}
        aria-expanded={open}
        aria-controls={`questao-${idx}`}
      >
        {correto
          ? <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
          : <XCircle size={16} className="text-red-600 flex-shrink-0" />
        }
        <span className="font-medium flex-1 line-clamp-2">
          Questão {idx + 1} — {questao.enunciado.slice(0, 80)}…
        </span>
        <ChevronDown
          size={16}
          className={`flex-shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div id={`questao-${idx}`} className="px-4 py-4 bg-white border-t text-sm space-y-2">
          <p className="text-slate-700 mb-3">{questao.enunciado}</p>
          <div className="space-y-1.5">
            {Object.entries(questao.alternativas).map(([l, t]) => (
              <div
                key={l}
                className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs
                  ${l === questao.gabarito ? 'bg-emerald-100 text-emerald-800 font-medium' :
                    l === resposta && resposta !== questao.gabarito ? 'bg-red-100 text-red-700' :
                    'text-slate-600'
                  }`}
              >
                <span className="font-bold flex-shrink-0">{l})</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800">
            <strong>💡 Explicação:</strong> {questao.explicacao}
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
      <div className="max-w-lg mx-auto text-center py-16">
        <p className="text-slate-500 mb-4">Nenhum simulado encontrado.</p>
        <Link to="/simulado" className="text-indigo-600 font-medium hover:underline">
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
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      {/* Card de resultado */}
      <div className="app-surface app-card rounded-2xl p-8 text-center">
        {persistError && (
          <div className="mb-5 text-left">
            <FeedbackMessage tone="warning" title="Histórico indisponível">
              Resultado calculado, mas não foi possível salvar no histórico: {persistError}
            </FeedbackMessage>
          </div>
        )}
        <div className={`flex items-center justify-center w-16 h-16 rounded-2xl bg-${desempenho.color}-100 mx-auto mb-4`}>
          <Trophy size={28} className={`text-${desempenho.color}-600`} aria-hidden="true" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-1">{desempenho.label}</h1>
        <p className="text-slate-500 text-sm mb-6">Simulado de {materia}</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-slate-900">{acertos}/{total}</p>
            <p className="text-xs text-slate-500 mt-1">Acertos</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-slate-900">{Math.round(pct * 100)}%</p>
            <p className="text-xs text-slate-500 mt-1">Aproveitamento</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-2xl font-bold text-slate-900">{pontuacao}</p>
            <p className="text-xs text-slate-500 mt-1">Pts est. TRI</p>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="mb-8">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100}>
            <div
            className={`h-full bg-${desempenho.color}-500 rounded-full transition-[width] duration-700`}
              style={{ width: `${pct * 100}%` }}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/simulado')}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <RotateCcw size={15} aria-hidden="true" />
            Novo simulado
          </button>
          <Link
            to="/historico"
            className="flex-1 flex items-center justify-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium py-2.5 rounded-xl transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <BarChart2 size={15} aria-hidden="true" />
            Ver histórico
          </Link>
        </div>
      </div>

      {/* Revisão das questões */}
      {questoes && questoes.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Revisão das questões
          </h2>
          <div className="space-y-2">
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
  );
}
