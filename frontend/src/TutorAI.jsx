/**
 * TutorAI.jsx — Chat com o Tutor ENEM (powered by Gemini)
 * - Mantém histórico de mensagens no formato { role, parts } do Gemini
 * - Envia para o backend que aplica o System Prompt e retorna resposta
 * - Renderiza markdown simples (negrito, listas) da resposta da IA
 * - Acessibilidade: aria-live para novas mensagens, scroll automático
 */
import React, { useState, useRef, useEffect } from 'react';
import api from './lib/api';
import { Send, BrainCircuit, User, Loader2, AlertCircle, RotateCcw } from 'lucide-react';

// Renderiza texto com negrito (**texto**) e quebras de linha
function MessageText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span className="prose-ai whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

// Bolha de mensagem
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold
          ${isUser ? 'bg-indigo-500' : 'bg-violet-600'}`}
        aria-hidden="true"
      >
        {isUser ? <User size={14} /> : <BrainCircuit size={14} />}
      </div>

      {/* Conteúdo */}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <span className="text-xs text-slate-400 mb-1 px-1">
          {isUser ? 'Você' : 'Tutor ENEM'}
        </span>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
            ${isUser
              ? 'bg-indigo-600 text-white rounded-tr-sm'
              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
            }`}
        >
          {msg.loading ? (
            <span className="flex items-center gap-2 text-slate-400">
              <Loader2 size={14} className="animate-spin" />
              <span>Pensando...</span>
            </span>
          ) : msg.error ? (
            <span className="flex items-center gap-2 text-red-500">
              <AlertCircle size={14} />
              <span>{msg.error}</span>
            </span>
          ) : (
            <MessageText text={msg.text} />
          )}
        </div>
      </div>
    </div>
  );
}

const WELCOME = {
  role: 'model',
  text: 'Olá! Sou o **Tutor ENEM** 🎓, seu assistente de estudos especializado. Estou aqui para tirar suas dúvidas sobre qualquer conteúdo das 4 áreas do ENEM — Linguagens, Ciências Humanas, Ciências da Natureza e Matemática.\n\nComo posso te ajudar hoje?',
};

// Sugestões de perguntas para facilitar o início
const SUGGESTIONS = [
  'Qual a diferença entre mitose e meiose?',
  'Como resolver equações do 2° grau?',
  'Explique o Modernismo brasileiro',
  'O que é competência V da redação ENEM?',
];

export default function TutorIA() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll automático para a última mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text) {
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', text: text.trim() };
    const placeholderMsg = { role: 'model', loading: true };

    setMessages((prev) => [...prev, userMsg, placeholderMsg]);
    setInput('');
    setLoading(true);

    try {
      // Monta histórico no formato Gemini (exclui o placeholder)
      const history = [...messages, userMsg]
        .filter((m) => !m.loading && !m.error)
        .map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        }));

      const { data } = await api.post('/ai/tutor', { messages: history });

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'model', text: data.resposta };
        return updated;
      });
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'model',
          error: err.message || 'Erro ao conectar com o Tutor. Tente novamente.',
        };
        return updated;
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleSuggestion(text) {
    sendMessage(text);
  }

  function handleReset() {
    setMessages([WELCOME]);
    setInput('');
    inputRef.current?.focus();
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BrainCircuit size={22} className="text-violet-600" aria-hidden="true" />
            Tutor ENEM
          </h1>
          <p className="text-sm text-slate-500">IA especializada exclusivamente no ENEM</p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
          aria-label="Reiniciar conversa"
        >
          <RotateCcw size={12} aria-hidden="true" />
          <span>Nova conversa</span>
        </button>
      </div>

      {/* Área de mensagens */}
      <div
        className="flex-1 overflow-y-auto bg-white border border-slate-200 rounded-2xl p-4 space-y-4"
        role="log"
        aria-label="Conversa com o Tutor ENEM"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Sugestões (só aparece se for a mensagem inicial) */}
      {messages.length === 1 && (
        <div className="flex gap-2 flex-wrap mt-3" role="group" aria-label="Perguntas sugeridas">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSuggestion(s)}
              className="text-xs bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-700 text-slate-600 rounded-xl px-3 py-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 mt-3"
        aria-label="Enviar mensagem para o Tutor"
      >
        <label htmlFor="chat-input" className="sr-only">
          Sua pergunta para o Tutor ENEM
        </label>
        <input
          id="chat-input"
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte sobre qualquer conteúdo do ENEM..."
          disabled={loading}
          className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-50 disabled:cursor-not-allowed transition-all"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label="Enviar pergunta"
          className="flex items-center justify-center w-12 h-12 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex-shrink-0"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}