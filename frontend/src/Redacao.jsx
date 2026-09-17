/**
 * Redacao.jsx — Correção de redação por IA
 * Fluxo:
 *   1. Usuário escolhe tema ou usa o tema da semana
 *   2. Digita/cola a redação
 *   3. IA retorna avaliação por cada uma das 5 competências do ENEM
 *   4. Resultado salvo no Supabase
 */
import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import api from './lib/api';
import { FileText, Loader2, Send, RotateCcw, AlertCircle } from 'lucide-react';

const TEMA_SEMANA = 'Desafios para a preservação do patrimônio histórico no Brasil';

const COMPETENCIAS_INFO = {
  C1: { titulo: 'Competência I', subtitulo: 'Domínio da norma culta', cor: 'blue' },
  C2: { titulo: 'Competência II', subtitulo: 'Compreensão e proposta temática', cor: 'violet' },
  C3: { titulo: 'Competência III', subtitulo: 'Seleção de argumentos', cor: 'amber' },
  C4: { titulo: 'Competência IV', subtitulo: 'Mecanismos linguísticos', cor: 'emerald' },
  C5: { titulo: 'Competência V', subtitulo: 'Proposta de intervenção', cor: 'rose' },
};

// Gauge visual para nota de competência (0–200)
function NotaGauge({ nota, cor }) {
  const pct = Math.min((nota / 200) * 100, 100);
  const corMap = {
    blue: 'bg-blue-500', violet: 'bg-violet-500', amber: 'bg-amber-500',
    emerald: 'bg-emerald-500', rose: 'bg-rose-500',
  };
  const textMap = {
    blue: 'text-blue-700', violet: 'text-violet-700', amber: 'text-amber-700',
    emerald: 'text-emerald-700', rose: 'text-rose-700',
  };
  return (
    <div className="flex items-center gap-2">
      <span className={`text-lg font-bold ${textMap[cor]} w-10`}>{nota}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${corMap[cor]} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={nota}
          aria-valuemin={0}
          aria-valuemax={200}
        />
      </div>
      <span className="text-xs text-slate-400 w-10 text-right">/200</span>
    </div>
  );
}

// Tela de correção
function ResultadoCorrecao({ resultado, onNova }) {
  const totalMax = 1000;
  const pctTotal = (resultado.notaTotal / totalMax) * 100;

  let badge = '';
  if (resultado.notaTotal >= 900) badge = '🏆 Nível A — Excelente';
  else if (resultado.notaTotal >= 700) badge = '✨ Nível B — Muito bom';
  else if (resultado.notaTotal >= 500) badge = '📚 Nível C — Bom';
  else badge = '💪 Nível D — Precisa melhorar';

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Nota geral */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Resultado da Redação</h2>
            <p className="text-slate-500 text-sm">{badge}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-indigo-600">{resultado.notaTotal}</p>
            <p className="text-xs text-slate-400">de 1000 pontos</p>
          </div>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={resultado.notaTotal} aria-valuemin={0} aria-valuemax={1000}>
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
            style={{ width: `${pctTotal}%` }}
          />
        </div>
        {resultado.comentarioGeral && (
          <p className="mt-4 text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-4">
            {resultado.comentarioGeral}
          </p>
        )}
      </div>

      {/* Competências */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Avaliação por competência
        </h3>
        <div className="space-y-3">
          {Object.entries(COMPETENCIAS_INFO).map(([key, info]) => {
            const comp = resultado.competencias?.[key];
            if (!comp) return null;
            return (
              <div key={key} className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{info.titulo}</p>
                    <p className="text-xs text-slate-500">{info.subtitulo}</p>
                  </div>
                </div>
                <NotaGauge nota={comp.nota} cor={info.cor} />
                {comp.feedback && (
                  <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                    {comp.feedback}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={onNova}
        className="flex items-center justify-center gap-2 w-full border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 font-medium py-3 rounded-xl transition-all text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        <RotateCcw size={15} aria-hidden="true" />
        Corrigir nova redação
      </button>
    </div>
  );
}

export default function Redacao() {
  const { user } = useAuth();
  const [tema, setTema] = useState(TEMA_SEMANA);
  const [temaCustom, setTemaCustom] = useState(false);
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');

  const charCount = texto.trim().length;
  const palavras = texto.trim() ? texto.trim().split(/\s+/).length : 0;

  async function handleEnviar(e) {
    e.preventDefault();
    if (!texto.trim() || texto.trim().length < 50) return;

    setLoading(true);
    setErro('');

    try {
      const { data } = await api.post('/ai/redacao/corrigir', { tema, texto });
      setResultado(data);

      // Salvar no Supabase
      if (user) {
        await supabase.from('redacoes').insert({
          user_id: user.id,
          tema,
          texto,
          nota_total: data.notaTotal,
          competencias: data.competencias,
          criado_em: new Date().toISOString(),
        }).then(() => {}).catch(() => {});
      }
    } catch (err) {
      setErro(err.message || 'Erro ao enviar redação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (resultado) {
    return (
      <div className="max-w-2xl mx-auto">
        <ResultadoCorrecao resultado={resultado} onNova={() => { setResultado(null); setTexto(''); }} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileText size={22} className="text-amber-500" aria-hidden="true" />
          Correção de Redação
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Escreva sua redação e receba avaliação pelas 5 competências do ENEM
        </p>
      </div>

      <form onSubmit={handleEnviar} className="space-y-4">
        {/* Tema */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-slate-700">Tema</label>
            <button
              type="button"
              onClick={() => setTemaCustom(!temaCustom)}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium focus:outline-none focus:underline"
            >
              {temaCustom ? 'Usar tema da semana' : 'Usar outro tema'}
            </button>
          </div>
          {temaCustom ? (
            <input
              type="text"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Digite o tema da sua redação..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
            />
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-sm font-medium text-amber-800">📌 Tema da semana</p>
              <p className="text-sm text-amber-700 mt-0.5">{TEMA_SEMANA}</p>
            </div>
          )}
        </div>

        {/* Texto */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="redacao-texto" className="text-sm font-semibold text-slate-700">
              Sua redação
            </label>
            <span className="text-xs text-slate-400">
              {palavras} palavras • {charCount} caracteres
            </span>
          </div>
          <textarea
            id="redacao-texto"
            rows={16}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Cole ou digite sua redação aqui. Mínimo: 50 caracteres para avaliação..."
            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 leading-relaxed placeholder-slate-400 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all resize-none"
          />
          {charCount > 0 && charCount < 50 && (
            <p className="text-xs text-amber-600 mt-1.5">
              Mínimo de 50 caracteres para avaliação ({50 - charCount} restantes)
            </p>
          )}
        </div>

        {/* Erro */}
        {erro && (
          <div role="alert" className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p>{erro}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || charCount < 50}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Analisando redação...</span>
            </>
          ) : (
            <>
              <Send size={16} />
              <span>Enviar para correção</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}