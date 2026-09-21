/**
 * Chat persistente com o Tutor ENEM.
 * A resposta do modelo é renderizada por TutorMarkdown, sem HTML bruto.
 */
import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowUpRight, BrainCircuit, Loader2, RotateCcw, Send, Trash2, User, X } from 'lucide-react';
import api from './lib/api';
import FeedbackMessage from './components/ui/FeedbackMessage';
import TutorMarkdown from './components/tutor/TutorMarkdown';
import { useAuth } from './context/AuthContext';

const WELCOME = {
  role: 'model',
  text: 'Olá! Sou o **Tutor ENEM**, seu assistente de estudos. Vamos explorar Linguagens, Ciências Humanas, Ciências da Natureza e Matemática juntos.\n\nQual dúvida você quer resolver hoje?',
};

const SUGGESTIONS = [
  'Qual a diferença entre mitose e meiose?',
  'Como resolver equações do 2º grau?',
  'Explique o Modernismo brasileiro',
  'O que é a competência V da redação ENEM?',
];

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';

  return (
    <div className={`flex min-w-0 gap-2 sm:gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${isUser ? 'app-surface-muted app-text-muted' : 'bg-violet-600 text-white'}`}
        aria-hidden="true"
      >
        {isUser ? <User size={14} aria-hidden="true" /> : <BrainCircuit size={14} aria-hidden="true" />}
      </div>

      <div className={`flex min-w-0 max-w-[calc(100%-2.75rem)] flex-col sm:max-w-[88%] ${isUser ? 'items-end' : 'items-start'}`}>
        <span className="app-text-subtle mb-2 px-1 text-xs font-semibold">
          {isUser ? 'Você' : 'Tutor ENEM'}
        </span>
        <div
          className={`min-w-0 max-w-full rounded-2xl px-4 py-4 text-sm leading-relaxed sm:px-5 ${isUser
            ? 'rounded-tr-sm bg-violet-700 text-white'
            : 'app-surface rounded-tl-sm'
          }`}
        >
          {msg.loading ? (
            <span className="flex items-center gap-2 app-text-muted" role="status" aria-live="polite">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              <span>Pensando…</span>
            </span>
          ) : msg.error ? (
            <span className="flex items-center gap-2 text-red-600" role="alert">
              <AlertCircle size={14} aria-hidden="true" />
              <span>{msg.error}</span>
            </span>
          ) : isUser ? (
            <span className="whitespace-pre-wrap text-white">{msg.text}</span>
          ) : (
            <TutorMarkdown>{msg.text}</TutorMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TutorIA() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([WELCOME]);
  const [conversationId, setConversationId] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [restoredUserId, setRestoredUserId] = useState(null);
  const restoring = Boolean(user?.id && restoredUserId !== user.id);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);
  const [clearError, setClearError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const abortControllerRef = useRef(null);
  const restoringRef = useRef(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const dialogCancelRef = useRef(null);

  useEffect(() => {
    let active = true;
    if (!user?.id) {
      restoringRef.current = false;
      return () => { active = false; };
    }

    restoringRef.current = true;
    api.get('/ai/tutor/latest')
      .then(({ data }) => {
        if (!active || !data.conversationId || !data.mensagens?.length) return;
        setConversationId(data.conversationId);
        setMessages([
          WELCOME,
          ...data.mensagens.map((message) => ({ role: message.role, text: message.text })),
        ]);
      })
      .catch((error) => {
        console.warn('[TutorAI] Não foi possível recuperar o histórico:', error.message);
        if (active) setFeedback({
          tone: 'warning',
          children: 'Não foi possível recuperar sua conversa anterior. Verifique sua conexão e recarregue a página antes de continuar.',
        });
      })
      .finally(() => {
        if (active) {
          restoringRef.current = false;
          setRestoredUserId(user.id);
        }
      });

    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!clearDialogOpen) return undefined;

    dialogCancelRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !clearLoading) setClearDialogOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [clearDialogOpen, clearLoading]);

  async function sendMessage(text) {
    if (!text.trim() || loading || restoringRef.current || clearLoading) return;

    const userMsg = { role: 'user', text: text.trim() };
    const placeholderMsg = { role: 'model', loading: true };
    setFeedback(null);
    setMessages((prev) => [...prev, userMsg, placeholderMsg]);
    setInput('');
    setLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const { data } = await api.post('/ai/tutor', {
        message: userMsg.text,
        conversationId,
      }, { signal: controller.signal });
      setConversationId(data.conversationId);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'model', text: data.resposta };
        return updated;
      });
    } catch (err) {
      if (err.message === 'canceled' || /cancel/i.test(err.message || '')) {
        setMessages((prev) => prev.filter((msg, index) => !(index === prev.length - 1 && msg.loading)));
        return;
      }
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'model',
          error: err.message || 'Erro ao conectar com o Tutor. Tente novamente.',
        };
        return updated;
      });
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function cancelRequest() {
    abortControllerRef.current?.abort();
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage(input);
  }

  function handleReset() {
    setMessages([WELCOME]);
    setConversationId(null);
    setInput('');
    setFeedback(null);
    inputRef.current?.focus();
  }

  async function clearHistory() {
    if (clearLoading || loading) return;

    setClearLoading(true);
    setClearError('');
    try {
      await api.delete('/ai/tutor/history');
      setMessages([WELCOME]);
      setConversationId(null);
      setInput('');
      setClearDialogOpen(false);
      setFeedback({ tone: 'success', children: 'Histórico do Tutor limpo com sucesso.' });
      inputRef.current?.focus();
    } catch (error) {
      setClearError(error.message || 'Não foi possível limpar o histórico. Tente novamente.');
    } finally {
      setClearLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[36rem] max-w-6xl flex-col gap-5 lg:h-[calc(100dvh-4rem)] lg:min-h-[38rem]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Aprender em conversa</p>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">Tutor ENEM</h1>
          <p className="app-text-muted mt-2 text-sm">Uma dúvida de cada vez. Um passo a mais no seu aprendizado.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={loading || clearLoading || restoring}
            className="btn-secondary min-h-11 gap-2 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Iniciar nova conversa"
          >
            <RotateCcw size={16} aria-hidden="true" />
            Nova conversa
          </button>
          <button
            type="button"
            onClick={() => { setClearError(''); setClearDialogOpen(true); }}
            disabled={messages.length <= 1 || loading || clearLoading || restoring}
            className="btn-secondary min-h-11 gap-2 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Limpar histórico do Tutor"
          >
            <Trash2 size={16} aria-hidden="true" />
            Limpar histórico
          </button>
        </div>
      </div>

      {feedback && <FeedbackMessage tone={feedback.tone}>{feedback.children}</FeedbackMessage>}

      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_15rem]">
      <div className="app-surface app-card flex min-h-0 min-w-0 flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-[var(--app-border)] px-4 py-4 sm:px-6">
        <span className="feature-icon" aria-hidden="true"><BrainCircuit size={22} /></span>
        <div>
          <h2 className="text-sm font-bold">Seu espaço de estudo</h2>
          <p className="app-text-subtle text-xs">Conteúdos e estratégias para o ENEM</p>
        </div>
      </div>
      <div
        className="app-surface-muted min-h-[18rem] flex-1 overflow-y-auto overscroll-contain p-3 sm:p-6 lg:min-h-0"
        role="log"
        aria-label="Conversa com o Tutor ENEM"
        aria-live="polite"
        aria-relevant="additions"
      >
        <div className="space-y-7">
          {messages.map((msg, index) => <MessageBubble key={`${msg.role}-${index}`} msg={msg} />)}
          <div ref={bottomRef} />
        </div>
      </div>

      {restoring && (
        <div className="mx-3 mt-3 flex items-start gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-4 py-3 text-sm sm:mx-4" role="status" aria-live="polite">
          <Loader2 size={17} className="mt-0.5 shrink-0 animate-spin" aria-hidden="true" />
          <span>Recuperando sua conversa anterior. Você pode escrever sua pergunta; o envio será liberado em seguida.</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2 p-3 sm:p-4" aria-label="Enviar mensagem para o Tutor">
        <label htmlFor="chat-input" className="sr-only">Sua pergunta para o Tutor ENEM</label>
        <input
          id="chat-input"
          name="message"
          autoComplete="off"
          ref={inputRef}
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Pergunte sobre qualquer conteúdo do ENEM…"
          disabled={loading || clearLoading}
          className="app-surface-muted min-w-0 flex-1 rounded-xl px-4 py-3 text-sm placeholder:text-[var(--app-text-subtle)] focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-70"
        />
        {loading ? (
          <button
            type="button"
            onClick={cancelRequest}
            aria-label="Parar resposta do Tutor"
            className="btn-secondary h-12 flex-shrink-0 gap-2 px-4 text-sm"
          >
            <X size={17} aria-hidden="true" />
            Parar
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() || restoring || clearLoading}
            aria-label="Enviar pergunta"
            className="btn-primary h-12 w-12 flex-shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={18} aria-hidden="true" />
          </button>
        )}
      </form>
      </div>

      <aside className="flex flex-col gap-4 lg:overflow-y-auto" aria-label="Orientações de estudo">
        <div className="app-surface app-card p-5">
          <p className="eyebrow mb-3">Explore uma ideia</p>
          <h2 className="section-heading mb-2 text-lg font-bold">Entenda o caminho</h2>
          <p className="app-text-muted text-sm leading-relaxed">Peça exemplos, compare conceitos ou traga a etapa de um exercício que ficou confusa.</p>
        </div>
        {messages.length === 1 && (
          <div className="space-y-2" role="group" aria-label="Perguntas sugeridas">
            <p className="app-text-subtle px-1 text-xs font-semibold">Para começar</p>
            {SUGGESTIONS.map((suggestion) => (
              <button
                type="button"
                key={suggestion}
                onClick={() => sendMessage(suggestion)}
                disabled={restoring || loading || clearLoading}
                className="app-surface flex w-full items-start gap-3 rounded-2xl p-4 text-left text-sm leading-relaxed transition-colors hover:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex-1">{suggestion}</span>
                <ArrowUpRight size={16} className="app-text-accent mt-1 shrink-0" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
        <p className="app-text-subtle px-1 text-xs leading-relaxed">A IA pode cometer erros. Confira informações importantes no seu material de estudo.</p>
      </aside>
      </div>

      {clearDialogOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
          <div
            className="app-surface w-full max-w-md rounded-3xl p-6 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-history-title"
            aria-describedby="clear-history-description"
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-xl bg-red-100 p-2 text-red-700" aria-hidden="true">
                <Trash2 size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 id="clear-history-title" className="text-lg font-bold">Limpar histórico?</h2>
                <p id="clear-history-description" className="mt-1 text-sm app-text-muted">
                  Todas as mensagens persistidas do Tutor serão excluídas permanentemente.
                </p>
              </div>
            </div>
            {clearError && <FeedbackMessage tone="danger">{clearError}</FeedbackMessage>}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                ref={dialogCancelRef}
                onClick={() => setClearDialogOpen(false)}
                disabled={clearLoading}
                className="btn-secondary min-h-11 px-4 text-sm disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={clearHistory}
                disabled={clearLoading}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {clearLoading ? 'Limpando…' : 'Sim, limpar histórico'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
