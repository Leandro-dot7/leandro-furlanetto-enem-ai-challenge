/**
 * Chat persistente com o Tutor ENEM.
 * A resposta do modelo Ã© renderizada por TutorMarkdown, sem HTML bruto.
 */
import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, BrainCircuit, Loader2, RotateCcw, Send, Trash2, User, X } from 'lucide-react';
import api from './lib/api';
import FeedbackMessage from './components/ui/FeedbackMessage';
import TutorMarkdown from './components/tutor/TutorMarkdown';
import { useAuth } from './context/AuthContext';

const WELCOME = {
  role: 'model',
  text: 'Olá! Sou o **Tutor ENEM** 🎓, seu assistente de estudos especializado. Estou aqui para tirar suas dúvidas sobre qualquer conteúdo das 4 áreas do ENEM — Linguagens, Ciências Humanas, Ciências da Natureza e Matemática.\n\nComo posso te ajudar hoje?',
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
    <div className={`flex min-w-0 gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${isUser ? 'bg-indigo-500' : 'bg-violet-600'}`}
        aria-hidden="true"
      >
        {isUser ? <User size={14} aria-hidden="true" /> : <BrainCircuit size={14} aria-hidden="true" />}
      </div>

      <div className={`flex min-w-0 max-w-[82%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <span className="mb-1 px-1 text-xs text-slate-400">
          {isUser ? 'Você' : 'Tutor ENEM'}
        </span>
        <div
          className={`min-w-0 rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser
            ? 'rounded-tr-sm bg-indigo-600 text-white'
            : 'app-surface rounded-tl-sm shadow-sm'
          }`}
        >
          {msg.loading ? (
            <span className="flex items-center gap-2 app-text-muted" role="status" aria-live="polite">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              <span>Pensandoâ€¦</span>
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
  const [restoring, setRestoring] = useState(true);
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
    if (!user?.id) return () => { active = false; };

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
      })
      .finally(() => {
        restoringRef.current = false;
        if (active) setRestoring(false);
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
    <div className="mx-auto flex h-[calc(100vh-8rem)] min-h-0 max-w-4xl flex-col lg:h-[calc(100vh-4rem)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <BrainCircuit size={22} className="text-violet-600" aria-hidden="true" />
            Tutor ENEM
          </h1>
          <p className="app-text-muted text-sm">IA especializada exclusivamente no ENEM</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={loading || clearLoading}
            className="app-surface inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium app-text-muted transition-[border-color,color,box-shadow] hover:border-indigo-300 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Iniciar nova conversa"
          >
            <RotateCcw size={12} aria-hidden="true" />
            Nova conversa
          </button>
          <button
            type="button"
            onClick={() => { setClearError(''); setClearDialogOpen(true); }}
            disabled={messages.length <= 1 || loading || clearLoading || restoring}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-[background-color,border-color,color,box-shadow] hover:border-red-300 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Limpar histórico do Tutor"
          >
            <Trash2 size={12} aria-hidden="true" />
            Limpar histórico
          </button>
        </div>
      </div>

      {feedback && <FeedbackMessage tone={feedback.tone}>{feedback.children}</FeedbackMessage>}

      <div
        className="app-surface min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl p-4 shadow-sm sm:p-6"
        role="log"
        aria-label="Conversa com o Tutor ENEM"
        aria-live="polite"
        aria-relevant="additions"
      >
        <div className="space-y-5">
          {messages.map((msg, index) => <MessageBubble key={`${msg.role}-${index}`} msg={msg} />)}
          <div ref={bottomRef} />
        </div>
      </div>

      {messages.length === 1 && (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Perguntas sugeridas">
          {SUGGESTIONS.map((suggestion) => (
            <button
              type="button"
              key={suggestion}
              onClick={() => sendMessage(suggestion)}
              className="app-surface rounded-xl px-3 py-1.5 text-xs app-text-muted transition-[border-color,color,box-shadow] hover:border-indigo-300 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2" aria-label="Enviar mensagem para o Tutor">
        <label htmlFor="chat-input" className="sr-only">Sua pergunta para o Tutor ENEM</label>
        <input
          id="chat-input"
          name="message"
          autoComplete="off"
          ref={inputRef}
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Pergunte sobre qualquer conteÃºdo do ENEMâ€¦"
          disabled={loading || restoring || clearLoading}
          className="app-surface min-w-0 flex-1 rounded-xl px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
        />
        {loading ? (
          <button
            type="button"
            onClick={cancelRequest}
            aria-label="Parar resposta do Tutor"
            className="flex h-12 flex-shrink-0 items-center justify-center gap-1.5 rounded-xl bg-slate-700 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            <X size={17} aria-hidden="true" />
            Parar
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() || restoring || clearLoading}
            aria-label="Enviar pergunta"
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            <Send size={18} aria-hidden="true" />
          </button>
        )}
      </form>

      {clearDialogOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
          <div
            className="app-surface w-full max-w-md rounded-2xl p-6 shadow-2xl"
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
                className="app-surface rounded-xl px-4 py-2 text-sm font-medium app-text-muted focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
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
