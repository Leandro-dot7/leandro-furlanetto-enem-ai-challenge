/**
 * Redacao.jsx — Correção de redação por IA
 * Fluxo:
 *   1. Usuário escolhe tema, gera um com IA ou usa o tema da semana
 *   2. Digita/cola a redação
 *   3. IA retorna avaliação rigorosa pelas 5 competências do ENEM
 *   4. Resultado salvo no Supabase com atualização imediata
 */
import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import api from './lib/api';
import { FileText, Loader2, Send, RotateCcw, AlertCircle, Sparkles, RefreshCw, PenLine, CheckCircle } from 'lucide-react';

const TEMA_SEMANA = 'Desafios para a preservação do patrimônio histórico no Brasil';

const COMPETENCIAS_INFO = {
  C1: { titulo: 'Competência I', subtitulo: 'Domínio da norma culta', cor: 'blue' },
  C2: { titulo: 'Competência II', subtitulo: 'Compreensão e proposta temática', cor: 'violet' },
  C3: { titulo: 'Competência III', subtitulo: 'Seleção de argumentos', cor: 'cyan' },
  C4: { titulo: 'Competência IV', subtitulo: 'Mecanismos linguísticos', cor: 'emerald' },
  C5: { titulo: 'Competência V', subtitulo: 'Proposta de intervenção', cor: 'rose' },
};

// Gauge visual para nota de competência (0–200)
function NotaGauge({ nota, cor }) {
  const pct = Math.min((nota / 200) * 100, 100);
  const corMap = {
    blue: 'bg-blue-500', violet: 'bg-violet-500', cyan: 'bg-cyan-500',
    emerald: 'bg-emerald-500', rose: 'bg-rose-500',
  };
  return (
    <div className="flex items-center gap-3">
      <span className="app-text-accent w-12 text-2xl font-extrabold tabular-nums">{nota}</span>
      <div className="app-surface-muted h-2 flex-1 overflow-hidden rounded-full">
        <div
          className={`h-full ${corMap[cor]} rounded-full transition-[width] duration-700`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={nota}
          aria-valuemin={0}
          aria-valuemax={200}
        />
      </div>
      <span className="app-text-subtle w-10 text-right text-xs">/200</span>
    </div>
  );
}

// Tela de correção
function ResultadoCorrecao({ resultado, onNova }) {
  const totalMax = 1000;
  const pctTotal = (resultado.notaTotal / totalMax) * 100;

  let badge = '';
  if (resultado.notaTotal >= 900) badge = 'Nível A · Excelente';
  else if (resultado.notaTotal >= 700) badge = 'Nível B · Muito bom';
  else if (resultado.notaTotal >= 500) badge = 'Nível C · Bom';
  else badge = 'Nível D · Precisa melhorar';

  return (
    <div className="page-stack space-y-6">
      <header>
        <p className="eyebrow mb-2">Seu texto, próximo passo</p>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Resultado da redação</h1>
        <p className="app-text-muted mt-2">Veja o que funcionou e onde concentrar sua próxima revisão.</p>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
      {/* Nota geral */}
      <div className="app-surface app-card p-6 lg:sticky lg:top-6">
        {resultado.persistError && (
          <div role="alert" className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            Redação corrigida, mas não foi possível salvar no histórico: {resultado.persistError}
          </div>
        )}
        <span className="feature-icon mb-5" aria-hidden="true"><FileText size={24} /></span>
        <h2 className="eyebrow">Nota total</h2>
        <div className="mb-5 mt-3">
          <p className="app-text-accent text-6xl font-extrabold tracking-tight tabular-nums">{resultado.notaTotal}</p>
          <p className="app-text-subtle mt-1 text-sm">de 1000 pontos</p>
          <p className="mt-4 text-sm font-semibold">{badge}</p>
        </div>
        <div className="app-surface-muted h-2 overflow-hidden rounded-full" role="progressbar" aria-label="Nota total da redação" aria-valuenow={resultado.notaTotal} aria-valuemin={0} aria-valuemax={1000}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-[width] duration-700"
            style={{ width: `${pctTotal}%` }}
          />
        </div>
        {resultado.comentarioGeral && (
          <p className="app-text-muted mt-6 border-t border-[var(--app-border)] pt-5 text-sm leading-7">
            {resultado.comentarioGeral}
          </p>
        )}
      </div>

      {/* Competências */}
      <div>
        <h3 className="section-heading mb-4 text-xl font-bold">
          Avaliação por competência <span className="app-text-subtle text-sm font-normal">(Grade INEP)</span>
        </h3>
        <div className="space-y-4">
          {Object.entries(COMPETENCIAS_INFO).map(([key, info]) => {
            const comp = resultado.competencias?.[key];
            if (!comp) return null;
            return (
              <div key={key} className="app-surface app-card p-5 sm:p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="app-surface-muted app-text-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold">{key}</span>
                  <div>
                    <p className="font-bold">{info.titulo}</p>
                    <p className="app-text-muted text-sm">{info.subtitulo}</p>
                  </div>
                </div>
                <NotaGauge nota={comp.nota} cor={info.cor} />
                {comp.feedback && (
                  <p className="app-text-muted mt-4 text-sm leading-7">
                    {comp.feedback}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
      </div>

      <button
        onClick={onNova}
        className="btn-secondary min-h-12 w-full gap-2 text-sm"
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
  const [eixoTematico, setEixoTematico] = useState('');
  const [contexto, setContexto] = useState('');
  const [temaCustom, setTemaCustom] = useState(false);
  const [gerandoTema, setGerandoTema] = useState(false);
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');

  const charCount = texto.trim().length;
  const palavras = texto.trim() ? texto.trim().split(/\s+/).length : 0;

  async function handleGerarTema() {
    setGerandoTema(true);
    setErro('');
    try {
      const { data } = await api.post('/ai/redacao/gerar-tema');
      setTema(data.tema);
      setEixoTematico(data.eixo || '');
      setContexto(data.contexto || '');
      setTemaCustom(false);
    } catch (err) {
      setErro(err.message || 'Erro ao gerar tema com IA. Tente novamente.');
    } finally {
      setGerandoTema(false);
    }
  }

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
        const { error: insertError } = await supabase.from('redacoes').insert({
          user_id: user.id,
          tema,
          texto,
          nota_total: data.notaTotal,
          competencias: data.competencias,
          criado_em: new Date().toISOString(),
        });
        if (insertError) {
          console.warn('[Supabase redacoes insert warning]:', insertError.message);
          setResultado((current) => ({ ...current, persistError: insertError.message }));
        }
      }
    } catch (err) {
      setErro(err.message || 'Erro ao enviar redação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (resultado) {
    return (
      <div className="mx-auto max-w-6xl">
        <ResultadoCorrecao resultado={resultado} onNova={() => { setResultado(null); setTexto(''); }} />
      </div>
    );
  }

  return (
    <div className="page-stack mx-auto max-w-6xl space-y-6">
      <header>
        <p className="eyebrow mb-2">Laboratório de escrita</p>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Correção de Redação</h1>
        <p className="app-text-muted mt-2 max-w-2xl text-sm leading-relaxed">
          Dê espaço às suas ideias. Escreva e receba uma avaliação pelas 5 competências do ENEM.
        </p>
      </header>

      <form onSubmit={handleEnviar} className="grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="space-y-4">
        {/* Tema */}
        <div className="app-surface app-card p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="feature-icon" aria-hidden="true"><FileText size={22} /></span>
              <div><p className="eyebrow mb-1">01 · Inspire-se</p><label htmlFor="redacao-tema" className="font-bold">Proposta temática</label></div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleGerarTema}
                disabled={gerandoTema}
                className="btn-secondary min-h-11 w-full gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {gerandoTema ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" aria-hidden="true" />
                    Gerando tema…
                  </>
                ) : (
                  <>
                    <Sparkles size={16} aria-hidden="true" />
                    Sugerir tema com IA
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setTemaCustom(!temaCustom)}
                className="app-text-accent min-h-11 w-full rounded-xl px-3 text-sm font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-violet-500"
              >
                {temaCustom ? 'Usar tema gerado' : 'Digitar outro tema'}
              </button>
            </div>
          </div>

          {temaCustom ? (
            <input
              type="text"
              id="redacao-tema"
              name="tema"
              autoComplete="off"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="Digite o tema da sua redação…"
              className="app-surface-muted w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          ) : (
            <div className="app-surface-muted space-y-3 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <p className="app-text-accent text-xs font-bold uppercase tracking-wider">
                  {eixoTematico ? `Eixo: ${eixoTematico}` : 'Tema de Redação'}
                </p>
              </div>
              <p className="text-lg font-bold leading-relaxed">{tema}</p>
              {contexto && (
                <p className="app-text-muted border-t border-[var(--app-border)] pt-3 text-sm leading-relaxed">
                  <strong>Contexto motivador:</strong> {contexto}
                </p>
              )}
            </div>
          )}
        </div>
        <aside className="app-surface-muted rounded-2xl p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold"><CheckCircle size={16} className="app-text-accent" aria-hidden="true" />Antes de enviar</h2>
          <p className="app-text-muted text-sm leading-7">Apresente sua tese, desenvolva os argumentos e conclua com uma proposta de intervenção. Revise os conectivos entre os parágrafos.</p>
        </aside>
        </div>

        <div className="min-w-0 space-y-4">
        {/* Texto */}
        <div className="app-surface app-card p-5 sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <span className="feature-icon aqua" aria-hidden="true"><PenLine size={22} /></span>
            <div><p className="eyebrow mb-1">02 · Desenvolva suas ideias</p><label htmlFor="redacao-texto" className="text-lg font-bold">Sua redação</label></div>
          </div>
          <textarea
            id="redacao-texto"
            name="texto"
            autoComplete="off"
            spellCheck="true"
            rows={16}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Cole ou digite sua redação aqui. Divida em introdução, desenvolvimento e conclusão (mínimo de 50 caracteres)…"
            className="app-surface-muted min-h-[26rem] w-full resize-y rounded-2xl px-4 py-5 text-base leading-8 placeholder:text-[var(--app-text-subtle)] focus:outline-none focus:ring-2 focus:ring-violet-500 sm:px-6"
          />
          <div className="app-text-subtle mt-3 flex flex-wrap justify-between gap-2 text-xs tabular-nums">
            <span>{palavras} palavras</span><span>{charCount} caracteres · mínimo de 50</span>
          </div>
          {charCount > 0 && charCount < 50 && (
            <p className="mt-3 rounded-xl bg-amber-50/80 p-3 text-xs text-amber-800">
              Mínimo de 50 caracteres para avaliação ({50 - charCount} restantes)
            </p>
          )}
        </div>

        {/* Erro */}
        {erro && (
          <div role="alert" aria-live="polite" className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p>{erro}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || charCount < 50}
          className="btn-primary min-h-12 w-full gap-2 px-4 py-3 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="shrink-0 animate-spin" aria-hidden="true" />
              <span>Avaliando com grade oficial do ENEM…</span>
            </>
          ) : (
            <>
              <Send size={16} aria-hidden="true" />
              <span>Enviar para correção</span>
            </>
          )}
        </button>
        </div>
      </form>
    </div>
  );
}
