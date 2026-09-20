/**
 * TutorAI.jsx — Chat com o Tutor ENEM (powered by Gemini)
 * - Mantém histórico de mensagens no formato { role, parts } do Gemini
 * - Envia para o backend que aplica o System Prompt e retorna resposta
 * - Renderiza markdown simples (negrito, listas) da resposta da IA
 * - Acessibilidade: aria-live para novas mensagens, scroll automático
 */
import React, { useState, useRef, useEffect } from 'react';
import api from './lib/api';
import { useAuth } from './context/AuthContext';
import { Send, BrainCircuit, User, Loader2, AlertCircle, RotateCcw, X } from 'lucide-react';

function safeLink(url) {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

// Renderiza a formatação Markdown mais usada pelo Tutor sem inserir HTML bruto.
function renderInlineMarkdown(text) {
  const tokenPattern = /(!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|\*\*[^*]+?\*\*|__[^_]+?__|`[^`]+`|\*[^*\n]+?\*|_[^_\n]+?_)/g;
  const parts = text.split(tokenPattern);

  return parts.map((part, i) => {
    if (!part) return null;
    const imageMatch = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) return <span key={i}>[Imagem: {imageMatch[1] || 'conteúdo visual'}]</span>;

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const href = safeLink(linkMatch[2].trim());
      return href ? (
        <a key={i} href={href} target="_blank" rel="noreferrer" className="text-indigo-700 underline underline-offset-2 hover:text-indigo-900">
          {linkMatch[1]}
        </a>
      ) : <span key={i}>{linkMatch[1]}</span>;
    }

    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <span key={i}>{part}</span>;
  });
}

function isMarkdownBlockStart(line) {
  return /^\s*(```|#{1,6}\s+|[-*+]\s+|\d+[.)]\s+|>\s?|---+\s*$)/.test(line);
}

function renderMarkdownBlocks(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const codeStart = line.match(/^\s*```\s*([\w+-]*)\s*$/);
    if (codeStart) {
      const codeLines = [];
      index += 1;
      while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(
        <pre key={`code-${index}`}>
          <code className={codeStart[1] ? `language-${codeStart[1]}` : undefined}>
            {codeLines.join('\n')}
          </code>
        </pre>,
      );
      continue;
    }

    const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      const Heading = `h${heading[1].length}`;
      blocks.push(<Heading key={`heading-${index}`}>{renderInlineMarkdown(heading[2])}</Heading>);
      index += 1;
      continue;
    }

    if (/^\s*([-*+])\s+/.test(line)) {
      const items = [];
      while (index < lines.length) {
        const item = lines[index].match(/^\s*[-*+]\s+(.+)$/);
        if (!item) break;
        items.push(<li key={`item-${index}`}>{renderInlineMarkdown(item[1])}</li>);
        index += 1;
      }
      blocks.push(<ul key={`ul-${index}`}>{items}</ul>);
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (index < lines.length) {
        const item = lines[index].match(/^\s*\d+[.)]\s+(.+)$/);
        if (!item) break;
        items.push(<li key={`ordered-item-${index}`}>{renderInlineMarkdown(item[1])}</li>);
        index += 1;
      }
      blocks.push(<ol key={`ol-${index}`}>{items}</ol>);
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quoteLines = [];
      while (index < lines.length) {
        const quote = lines[index].match(/^\s*>\s?(.*)$/);
        if (!quote) break;
        quoteLines.push(quote[1]);
        index += 1;
      }
      blocks.push(<blockquote key={`quote-${index}`}>{renderInlineMarkdown(quoteLines.join('\n'))}</blockquote>);
      continue;
    }

    if (/^\s*---+\s*$/.test(line)) {
      blocks.push(<hr key={`rule-${index}`} />);
      index += 1;
      continue;
    }

    const paragraphLines = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isMarkdownBlockStart(lines[index])) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    blocks.push(<p key={`paragraph-${index}`}>{renderInlineMarkdown(paragraphLines.join('\n'))}</p>);
  }

  return blocks;
}

function MessageText({ text, isUser = false }) {
  if (isUser) return <span className="whitespace-pre-wrap text-white">{text}</span>;
  return <div className="prose-ai">{renderMarkdownBlocks(text)}</div>;
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
              <span>Pensando…</span>
            </span>
          ) : msg.error ? (
            <span className="flex items-center gap-2 text-red-500">
              <AlertCircle size={14} />
              <span>{msg.error}</span>
            </span>
          ) : (
            <MessageText text={msg.text} isUser={isUser} />
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
  const { user } = useAuth();
  const [messages, setMessages] = useState([WELCOME]);
  const [conversationId, setConversationId] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const abortControllerRef = useRef(null);
  const restoringRef = useRef(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

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
        // O Tutor continua utilizável mesmo se a recuperação do histórico falhar.
        console.warn('[TutorAI] Não foi possível recuperar o histórico:', error.message);
      })
      .finally(() => {
        restoringRef.current = false;
        if (active) setRestoring(false);
      });

    return () => { active = false; };
  }, [user?.id]);

  // Scroll automático para a última mensagem
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text) {
    if (!text.trim() || loading || restoringRef.current) return;

    const userMsg = { role: 'user', text: text.trim() };
    const placeholderMsg = { role: 'model', loading: true };

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

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleSuggestion(text) {
    sendMessage(text);
  }

  function handleReset() {
    setMessages([WELCOME]);
    setConversationId(null);
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
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 transition-[border-color,color,box-shadow] focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
            className="text-xs bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-700 text-slate-600 rounded-xl px-3 py-1.5 transition-[border-color,color,box-shadow] focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
          placeholder="Pergunte sobre qualquer conteúdo do ENEM…"
          disabled={loading || restoring}
          className="flex-1 px-4 py-3 border border-slate-200 rounded-xl text-sm placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-50 disabled:cursor-not-allowed transition-[background-color,border-color,box-shadow]"
        />
        {loading ? (
          <button
            type="button"
            onClick={cancelRequest}
            aria-label="Parar resposta do Tutor"
            className="flex items-center justify-center gap-1.5 px-4 h-12 bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 flex-shrink-0"
          >
            <X size={17} aria-hidden="true" />
            Parar
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() || restoring}
            aria-label="Enviar pergunta"
            className="flex items-center justify-center w-12 h-12 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex-shrink-0"
          >
            <Send size={18} />
          </button>
        )}
      </form>
    </div>
  );
}
