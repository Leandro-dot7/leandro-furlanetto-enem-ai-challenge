import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SERVICE_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = path.resolve(SERVICE_DIR, '../data/enem-rag');
const MAX_QUERY_LENGTH = 4_000;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_CORPUS_QUESTIONS = 5_000;
const DEFAULT_RESULT_LIMIT = 1;
const STOP_WORDS = new Set([
  'a', 'ao', 'aos', 'as', 'com', 'como', 'da', 'das', 'de', 'do', 'dos', 'e', 'em',
  'essa', 'esse', 'esta', 'este', 'eu', 'foi', 'isso', 'na', 'nas', 'no', 'nos',
  'o', 'os', 'para', 'por', 'que', 'qual', 'se', 'sem', 'sobre', 'uma', 'um', 'uma',
  'voce', 'você', 'me', 'minha', 'meu', 'pode', 'explique', 'ajude', 'quero',
]);

let corpusPromise;

function getDataDir() {
  const configured = process.env.ENEM_RAG_DATA_DIR?.trim();
  return configured ? path.resolve(process.cwd(), configured) : DEFAULT_DATA_DIR;
}

function tokenize(value) {
  return [...new Set(
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .match(/[a-z0-9]{3,}/g) || [],
  )].filter((token) => !STOP_WORDS.has(token));
}

function trimText(value, maxLength) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function normalizeQuestion(question, sourceFile) {
  if (!question || typeof question !== 'object') return null;
  const alternatives = Array.isArray(question.alternatives)
    ? question.alternatives
      .filter((alternative) => alternative && typeof alternative.text === 'string')
      .slice(0, 5)
      .map((alternative) => ({
        letter: trimText(alternative.letter, 2),
        text: trimText(alternative.text, 240),
        isCorrect: alternative.isCorrect === true,
      }))
    : [];

  const searchableText = [
    question.title,
    question.discipline,
    question.language,
    question.context,
    question.alternativesIntroduction,
    ...alternatives.map((alternative) => alternative.text),
  ].join(' ');

  return {
    title: trimText(question.title, 120),
    year: Number.isInteger(question.year) ? question.year : null,
    index: Number.isInteger(question.index) ? question.index : null,
    discipline: trimText(question.discipline, 80),
    language: trimText(question.language, 40),
    context: trimText(question.context, 600),
    alternativesIntroduction: trimText(question.alternativesIntroduction, 300),
    alternatives,
    correctAlternative: trimText(question.correctAlternative, 2),
    files: Array.isArray(question.files) ? question.files.filter((file) => typeof file === 'string').slice(0, 3) : [],
    sourceFile,
    searchTokens: new Set(tokenize(searchableText)),
  };
}

async function loadCorpus() {
  const dataDir = getDataDir();
  let files;
  try {
    files = await fs.readdir(dataDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }

  const corpus = [];
  for (const file of files.filter((entry) => entry.isFile() && entry.name.endsWith('.json')).sort()) {
    const filePath = path.join(dataDir, file.name);
    const stats = await fs.stat(filePath);
    if (stats.size > MAX_FILE_BYTES) continue;

    try {
      const payload = JSON.parse(await fs.readFile(filePath, 'utf8'));
      const questions = Array.isArray(payload) ? payload : payload.questions;
      if (!Array.isArray(questions)) continue;
      for (const question of questions) {
        const normalized = normalizeQuestion(question, file.name);
        if (normalized) corpus.push(normalized);
        if (corpus.length >= MAX_CORPUS_QUESTIONS) return corpus;
      }
    } catch (error) {
      console.warn(`[enemRag] Ignorando cache inválido ${file.name}:`, error.message);
    }
  }
  return corpus;
}

async function getCorpus() {
  if (!corpusPromise) corpusPromise = loadCorpus();
  return corpusPromise;
}

function scoreQuestion(question, queryTokens) {
  let score = 0;
  for (const token of queryTokens) {
    if (question.searchTokens.has(token)) score += token.length >= 6 ? 2 : 1;
  }
  return score;
}

function formatReference(question) {
  const source = `${question.title || `ENEM ${question.year || ''}`}`.trim();
  const alternatives = question.alternatives
    .map((alternative) => `${alternative.letter}) ${alternative.text}`)
    .join(' | ');
  return [
    `Fonte: ${source}${question.discipline ? ` — ${question.discipline}` : ''}${question.language ? ` — ${question.language}` : ''}`,
    question.context ? `Contexto: ${question.context}` : null,
    question.alternativesIntroduction ? `Comando: ${question.alternativesIntroduction}` : null,
    alternatives ? `Alternativas: ${trimText(alternatives, 550)}` : null,
    question.correctAlternative ? `Gabarito publicado: ${question.correctAlternative}` : null,
  ].filter(Boolean).join('\n');
}

/** Retorna referências curtas do corpus local, sem chamar a API durante a pergunta. */
export async function getTutorRagContext(query, { limit = DEFAULT_RESULT_LIMIT } = {}) {
  if (typeof query !== 'string' || !query.trim()) return null;
  const safeQuery = query.trim().slice(0, MAX_QUERY_LENGTH);
  const queryTokens = tokenize(safeQuery);
  if (queryTokens.length === 0) return null;

  try {
    const corpus = await getCorpus();
    const matches = corpus
      .map((question) => ({ question, score: scoreQuestion(question, queryTokens) }))
      .filter(({ score }) => score >= 2)
      .sort((left, right) => right.score - left.score || (left.question.index || 0) - (right.question.index || 0))
      .slice(0, Math.max(1, Math.min(Number(limit) || DEFAULT_RESULT_LIMIT, 3)));

    if (matches.length === 0) return null;
    return matches.map(({ question }) => formatReference(question)).join('\n\n---\n\n');
  } catch (error) {
    console.warn('[enemRag] Falha ao ler corpus local; seguindo sem RAG:', error.message);
    return null;
  }
}

export function resetTutorRagCache() {
  corpusPromise = undefined;
}
