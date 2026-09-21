/**
 * Simulado.jsx — Simulado gerado por IA
 * Fluxo:
 *   1. Tela de configuração (escolha matéria + nº questões)
 *   2. Loading enquanto Gemini gera as questões
 *   3. Exibe questões uma a uma (ou todas)
 *   4. Ao finalizar, salva resultado no Supabase e vai para /resultado
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import api from './lib/api';
import { Loader2, ChevronRight, CheckCircle, XCircle, Sparkles, BookOpen, ListChecks, Target } from 'lucide-react';
import FeedbackMessage from './components/ui/FeedbackMessage.jsx';

const MATERIAS = [
  { label: 'Linguagens e Códigos', value: 'Linguagens e Códigos' },
  { label: 'Ciências Humanas', value: 'Ciências Humanas' },
  { label: 'Ciências da Natureza', value: 'Ciências da Natureza' },
  { label: 'Matemática', value: 'Matemática' },
];

const NUM_OPCOES = [3, 5, 10];

// Tela de configuração
function ConfigScreen({ onStart }) {
  const [materia, setMateria] = useState(MATERIAS[0].value);
  const [numQuestoes, setNumQuestoes] = useState(5);

  return (
    <div className="page-stack mx-auto max-w-5xl space-y-6">
      <header>
        <p className="eyebrow mb-2">Prática que ensina</p>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Novo Simulado</h1>
        <p className="app-text-muted mt-2 text-sm">Escolha seu foco e transforme cada questão em aprendizado.</p>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="app-surface app-card p-5 sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <span className="feature-icon" aria-hidden="true"><ListChecks size={24} /></span>
          <div>
            <h2 className="section-heading text-xl font-bold">Monte sua sessão</h2>
            <p className="app-text-muted mt-1 text-sm">No seu ritmo, com o foco que você precisa.</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Área do conhecimento */}
          <div>
            <label htmlFor="materia" className="mb-3 block text-sm font-bold">
              <span className="app-text-accent mr-2">01</span> Área do conhecimento
            </label>
            <select
              id="materia"
              name="materia"
              value={materia}
              onChange={(e) => setMateria(e.target.value)}
              className="app-surface-muted min-h-14 w-full rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {MATERIAS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Número de questões */}
          <div>
            <p className="mb-3 block text-sm font-bold" id="num-label">
              <span className="app-text-accent mr-2">02</span> Quantidade de questões
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-3" role="group" aria-labelledby="num-label">
              {NUM_OPCOES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNumQuestoes(n)}
                  aria-pressed={numQuestoes === n}
                  className={`rounded-2xl border px-2 py-5 text-center transition-[background-color,border-color,box-shadow] focus-visible:ring-2 focus-visible:ring-violet-500
                    ${numQuestoes === n
                      ? 'border-violet-600 bg-violet-700 text-white shadow-sm'
                      : 'app-surface-muted hover:border-violet-400'
                    }`}
                >
                  <span className="block text-3xl font-extrabold tabular-nums">{n}</span>
                  <span className="mt-1 block text-xs">questões</span>
                </button>
              ))}
            </div>
          </div>

          <div className="app-surface-muted flex items-start gap-3 rounded-2xl p-4 text-sm leading-relaxed">
            <Sparkles size={18} className="app-text-accent mt-0.5 shrink-0" aria-hidden="true" />
            <p className="app-text-muted">Questões geradas por IA no estilo ENEM, com gabarito e explicação para entender cada resposta.</p>
          </div>

          <button
            onClick={() => onStart(materia, numQuestoes)}
            className="btn-primary min-h-12 w-full gap-2 px-4 py-3"
          >
            <Sparkles size={16} aria-hidden="true" />
            Gerar Simulado com IA
          </button>
        </div>
      </div>
      <aside className="space-y-4">
        <div className="app-surface app-card p-6">
          <span className="feature-icon aqua mb-5" aria-hidden="true"><Target size={24} /></span>
          <p className="eyebrow mb-2">Sua sessão</p>
          <h2 className="text-xl font-bold">{materia}</h2>
          <p className="app-text-muted mt-2 text-sm">{numQuestoes} questões para praticar</p>
          <ol className="app-text-muted mt-6 space-y-4 border-t border-[var(--app-border)] pt-5 text-sm leading-relaxed">
            <li><span className="app-text-accent font-bold">1.</span> Leia e escolha uma alternativa.</li>
            <li><span className="app-text-accent font-bold">2.</span> Confirme e entenda a explicação.</li>
            <li><span className="app-text-accent font-bold">3.</span> Revise seu resultado ao terminar.</li>
          </ol>
        </div>
        <p className="app-text-subtle px-2 text-xs leading-relaxed">Reserve um momento para ler com calma. A revisão também faz parte do treino.</p>
      </aside>
      </div>
    </div>
  );
}

// Tela de loading
function LoadingScreen({ materia }) {
  return (
    <div className="mx-auto max-w-2xl py-8 sm:py-16">
      <div className="app-surface app-card px-6 py-12 text-center sm:p-16" role="status" aria-live="polite" aria-busy="true">
        <div className="feature-icon mx-auto mb-6">
          <Loader2 size={28} className="animate-spin" aria-hidden="true" />
        </div>
        <p className="eyebrow mb-3">Preparando sua sessão</p>
        <h2 className="mb-3 text-2xl font-extrabold tracking-tight">Gerando seu simulado…</h2>
        <p className="app-text-muted text-sm leading-7">
          A IA está criando questões de <strong>{materia}</strong> no estilo ENEM.
          <br />A geração pode levar até cerca de um minuto.
        </p>
      </div>
    </div>
  );
}

// Tela de questão
function QuestaoScreen({ questao, totalQuestoes, onResponder }) {
  const [selecionada, setSelecionada] = useState(null);
  const [respondida, setRespondida] = useState(false);

  const alternativas = Object.entries(questao.alternativas);

  function handleResponder() {
    if (!selecionada) return;
    setRespondida(true);
  }

  function handleProxima() {
    onResponder(selecionada);
  }

  const letra = selecionada;
  const gabarito = questao.gabarito;

  return (
    <div className="page-stack mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="eyebrow mb-1">Sessão de prática</p><h2 className="text-2xl font-extrabold tracking-tight">Uma questão de cada vez</h2></div>
        <span className="app-surface inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"><BookOpen size={16} className="app-text-accent" aria-hidden="true" />ENEM</span>
      </div>
      <div className="app-surface app-card overflow-hidden">
        {/* Header */}
        <div className="app-surface-muted flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <span className="text-sm font-bold">
            Questão {questao.id} de {totalQuestoes}
          </span>
          <span className="app-text-subtle text-xs">
            {respondida ? 'Confira a explicação antes de seguir' : 'Selecione uma alternativa'}
          </span>
        </div>

        <div className="p-5 sm:p-8 lg:p-10">
        {/* Enunciado */}
        <div className="mb-8">
          <p className="whitespace-pre-line text-base leading-8 sm:text-lg">{questao.enunciado}</p>
        </div>

        {/* Alternativas */}
        <div className="mb-8 space-y-3" role="radiogroup" aria-label="Alternativas">
          {alternativas.map(([letra_op, texto]) => {
            let classes = 'flex items-start gap-3 p-4 sm:p-5 rounded-2xl border cursor-pointer transition-[background-color,border-color,box-shadow] text-sm leading-relaxed focus-within:ring-2 focus-within:ring-violet-500 focus-within:ring-offset-2';

            if (respondida) {
              if (letra_op === gabarito) {
                classes += ' bg-emerald-50 border-emerald-400 text-emerald-800';
              } else if (letra_op === selecionada && letra_op !== gabarito) {
                classes += ' bg-red-50 border-red-400 text-red-800';
              } else {
                classes += ' app-surface-muted app-text-subtle';
              }
            } else if (selecionada === letra_op) {
              classes += ' app-surface-muted border-violet-500 ring-2 ring-violet-500';
            } else {
              classes += ' app-surface hover:border-violet-400';
            }

            return (
              <label key={letra_op} className={classes}>
                <input
                  type="radio"
                  name="alternativa"
                  value={letra_op}
                  className="sr-only"
                  disabled={respondida}
                  onChange={() => setSelecionada(letra_op)}
                />
                <span className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-xl text-xs font-bold border
                  ${respondida && letra_op === gabarito ? 'bg-emerald-500 border-emerald-500 text-white' :
                    respondida && letra_op === selecionada ? 'bg-red-500 border-red-500 text-white' :
                    selecionada === letra_op ? 'bg-violet-700 border-violet-700 text-white' :
                    'app-surface-muted app-text-muted'
                  }`}
                  aria-hidden="true"
                >
                  {letra_op}
                </span>
                <span className="min-w-0 flex-1 pt-1">{texto}</span>
                {respondida && letra_op === gabarito && <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />}
                {respondida && letra_op === selecionada && letra_op !== gabarito && <XCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />}
              </label>
            );
          })}
        </div>

        {/* Explicação (após responder) */}
        {respondida && (
          <div className={`p-5 rounded-2xl mb-6 text-sm leading-7 border
            ${letra === gabarito
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <strong className="mb-2 block">{letra === gabarito ? 'Correto!' : `A resposta era ${gabarito}.`}</strong>
            {questao.explicacao}
          </div>
        )}

        {/* Botões */}
        <div className="flex justify-end gap-3 border-t border-[var(--app-border)] pt-5">
          {!respondida ? (
            <button
              onClick={handleResponder}
              disabled={!selecionada}
              className="btn-primary min-h-12 w-full gap-2 px-5 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              Confirmar resposta
            </button>
          ) : (
            <button
              onClick={handleProxima}
              className="btn-primary min-h-12 w-full gap-2 px-5 text-sm sm:w-auto"
            >
              {questao.id === totalQuestoes ? 'Ver resultado' : 'Próxima questão'}
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

export default function Simulado() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fase, setFase] = useState('config'); // config | loading | questoes
  const [materia, setMateria] = useState('');
  const [questoes, setQuestoes] = useState([]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostas, setRespostas] = useState([]);
  const [erro, setErro] = useState('');

  async function handleStart(mat, num) {
    setMateria(mat);
    setFase('loading');
    setErro('');

    try {
      const { data } = await api.post('/ai/simulado/gerar', {
        materia: mat,
        numQuestoes: num,
      });
      setQuestoes(data.questoes);
      setQuestaoAtual(0);
      setRespostas([]);
      setFase('questoes');
    } catch (err) {
      setErro(err.message || 'Erro ao gerar simulado. Verifique sua conexão.');
      setFase('config');
    }
  }

  async function handleResponder(resposta) {
    const novasRespostas = [...respostas, resposta];
    setRespostas(novasRespostas);

    if (questaoAtual + 1 < questoes.length) {
      setQuestaoAtual((q) => q + 1);
    } else {
      // Calculando acertos
      const acertos = questoes.filter((q, i) => novasRespostas[i] === q.gabarito).length;
      let persistError = '';

      // Salvar no Supabase
      if (user) {
        try {
          const { error: insertErr } = await supabase.from('simulados').insert({
            user_id: user.id,
            materia,
            total_questoes: questoes.length,
            acertos,
            respostas: novasRespostas,
            questoes,
            criado_em: new Date().toISOString(),
          });
          if (insertErr) {
            console.warn('[Supabase simulados insert warning]:', insertErr.message);
            persistError = insertErr.message;
          }
        } catch (e) {
          console.warn('[Supabase connection warning]:', e.message);
          persistError = e.message;
        }
      }

      navigate('/resultado', {
        state: {
          acertos,
          total: questoes.length,
          materia,
          questoes,
          respostas: novasRespostas,
          persistError,
        },
      });
    }
  }

  if (fase === 'loading') return <LoadingScreen materia={materia} />;

  if (fase === 'questoes' && questoes.length > 0) {
    return (
      <QuestaoScreen
        key={questaoAtual}
        questao={questoes[questaoAtual]}
        totalQuestoes={questoes.length}
        onResponder={handleResponder}
      />
    );
  }

  return (
    <>
      {erro && <div className="mx-auto mb-4 max-w-5xl"><FeedbackMessage tone="danger" title="Não foi possível gerar o simulado">{erro}</FeedbackMessage></div>}
      <ConfigScreen onStart={handleStart} />
    </>
  );
}
