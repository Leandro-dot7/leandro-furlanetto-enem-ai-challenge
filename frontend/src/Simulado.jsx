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
import { BookOpen, Loader2, ChevronRight, CheckCircle, XCircle, Sparkles } from 'lucide-react';

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
    <div className="max-w-lg mx-auto animate-slide-up">
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-11 h-11 bg-indigo-100 rounded-xl">
            <Sparkles size={22} className="text-indigo-600" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Novo Simulado</h1>
            <p className="text-sm text-slate-500">Questões geradas por IA no estilo ENEM</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Área do conhecimento */}
          <div>
            <label htmlFor="materia" className="block text-sm font-medium text-slate-700 mb-2">
              Área do conhecimento
            </label>
            <select
              id="materia"
              name="materia"
              value={materia}
              onChange={(e) => setMateria(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-[background-color,border-color,box-shadow]"
            >
              {MATERIAS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Número de questões */}
          <div>
            <p className="block text-sm font-medium text-slate-700 mb-2" id="num-label">
              Quantidade de questões
            </p>
            <div className="flex gap-3" role="group" aria-labelledby="num-label">
              {NUM_OPCOES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNumQuestoes(n)}
                  aria-pressed={numQuestoes === n}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-[background-color,border-color,box-shadow] focus:outline-none focus:ring-2 focus:ring-indigo-500
                    ${numQuestoes === n
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-300'
                    }`}
                >
                  {n} questões
                </button>
              ))}
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-700">
            💡 A IA vai criar questões inéditas no estilo ENEM, com gabarito e explicação detalhada de cada resposta.
          </div>

          <button
            onClick={() => onStart(materia, numQuestoes)}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <Sparkles size={16} aria-hidden="true" />
            Gerar Simulado com IA
          </button>
        </div>
      </div>
    </div>
  );
}

// Tela de loading
function LoadingScreen({ materia }) {
  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mx-auto mb-4">
          <Loader2 size={28} className="text-indigo-600 animate-spin" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Gerando seu simulado…</h2>
        <p className="text-sm text-slate-500">
          A IA está criando questões de <strong>{materia}</strong> no estilo ENEM.
          <br />Isso pode levar alguns segundos.
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
    <div className="max-w-2xl mx-auto animate-slide-up">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-medium text-slate-500">
            Questão {questao.id} de {totalQuestoes}
          </span>
          <span className="text-xs bg-indigo-100 text-indigo-700 font-medium px-3 py-1 rounded-full">
            ENEM
          </span>
        </div>

        {/* Enunciado */}
        <div className="mb-6">
          <p className="text-slate-800 leading-relaxed text-sm lg:text-base">{questao.enunciado}</p>
        </div>

        {/* Alternativas */}
        <div className="space-y-2.5 mb-6" role="radiogroup" aria-label="Alternativas">
          {alternativas.map(([letra_op, texto]) => {
            let classes = 'flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-[background-color,border-color,box-shadow] text-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2';

            if (respondida) {
              if (letra_op === gabarito) {
                classes += ' bg-emerald-50 border-emerald-400 text-emerald-800';
              } else if (letra_op === selecionada && letra_op !== gabarito) {
                classes += ' bg-red-50 border-red-400 text-red-800';
              } else {
                classes += ' bg-slate-50 border-slate-200 text-slate-500';
              }
            } else if (selecionada === letra_op) {
              classes += ' bg-indigo-50 border-indigo-500 text-indigo-900';
            } else {
              classes += ' bg-slate-50 border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50';
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
                <span className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold border
                  ${respondida && letra_op === gabarito ? 'bg-emerald-500 border-emerald-500 text-white' :
                    respondida && letra_op === selecionada ? 'bg-red-500 border-red-500 text-white' :
                    selecionada === letra_op ? 'bg-indigo-600 border-indigo-600 text-white' :
                    'bg-white border-slate-300 text-slate-600'
                  }`}
                  aria-hidden="true"
                >
                  {letra_op}
                </span>
                <span className="flex-1">{texto}</span>
                {respondida && letra_op === gabarito && <CheckCircle size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />}
                {respondida && letra_op === selecionada && letra_op !== gabarito && <XCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />}
              </label>
            );
          })}
        </div>

        {/* Explicação (após responder) */}
        {respondida && (
          <div className={`p-4 rounded-xl mb-5 text-sm leading-relaxed border
            ${letra === gabarito
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <strong>{letra === gabarito ? '✅ Correto! ' : `❌ A resposta era ${gabarito}. `}</strong>
            {questao.explicacao}
          </div>
        )}

        {/* Botões */}
        <div className="flex justify-end gap-3">
          {!respondida ? (
            <button
              onClick={handleResponder}
              disabled={!selecionada}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium px-5 py-2.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm"
            >
              Confirmar resposta
            </button>
          ) : (
            <button
              onClick={handleProxima}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm"
            >
              {questao.id === totalQuestoes ? 'Ver resultado' : 'Próxima questão'}
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          )}
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
      {erro && (
        <div role="alert" className="max-w-lg mx-auto mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <XCircle size={16} className="flex-shrink-0 mt-0.5" />
          <p>{erro}</p>
        </div>
      )}
      <ConfigScreen onStart={handleStart} />
    </>
  );
}
