import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SERVICE_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = path.resolve(SERVICE_DIR, '../data/enem-rag');
const MAX_QUERY_LENGTH = 4_000;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_CORPUS_QUESTIONS = 5_000;
const DEFAULT_RESULT_LIMIT = 1;
const SIMULADO_RESULT_LIMIT = 2;
const STOP_WORDS = new Set([
  'a', 'ao', 'aos', 'as', 'com', 'como', 'da', 'das', 'de', 'do', 'dos', 'e', 'em',
  'essa', 'esse', 'esta', 'este', 'eu', 'foi', 'isso', 'na', 'nas', 'no', 'nos',
  'o', 'os', 'para', 'por', 'que', 'qual', 'se', 'sem', 'sobre', 'uma', 'um', 'uma',
  'voce', 'você', 'me', 'minha', 'meu', 'pode', 'explique', 'ajude', 'quero',
  'diferenca', 'resolver', 'questao', 'questoes', 'enem',
]);

const AREA_DISCIPLINES = new Map([
  ['linguagens', 'linguagens'],
  ['linguagens e codigos', 'linguagens'],
  ['ciencias humanas', 'ciencias-humanas'],
  ['ciencias da natureza', 'ciencias-natureza'],
  ['matematica', 'matematica'],
]);

const TUTOR_AREA_HINTS = [
  ['matematica', new Set(['equacao', 'equacoes', 'quadratica', 'quadratico', 'algebra', 'porcentagem', 'trigonometria'])],
  ['ciencias-natureza', new Set(['mitose', 'meiose', 'fotossintese', 'celula', 'celulas', 'atomo'])],
  ['linguagens', new Set(['modernismo', 'redacao', 'literatura', 'gramatica'])],
];

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

function scoreQuestion(question, queryTokens, minMatches) {
  let score = 0;
  let matches = 0;
  for (const token of queryTokens) {
    if (question.searchTokens.has(token)) {
      matches += 1;
      score += token.length >= 6 ? 2 : 1;
    }
  }
  return matches >= minMatches ? score : 0;
}

function inferTutorDiscipline(queryTokens) {
  const candidates = TUTOR_AREA_HINTS
    .filter(([, hints]) => queryTokens.some((token) => hints.has(token)))
    .map(([discipline]) => discipline);
  return candidates.length === 1 ? candidates[0] : undefined;
}

function formatReference(question, { compact = false } = {}) {
  const source = `${question.title || `ENEM ${question.year || ''}`}`.trim();
  const alternatives = question.alternatives
    .map((alternative) => `${alternative.letter}) ${alternative.text}`)
    .join(' | ');
  return [
    `Fonte: ${source}${question.discipline ? ` — ${question.discipline}` : ''}${question.language ? ` — ${question.language}` : ''}`,
    question.context ? `Contexto: ${trimText(question.context, compact ? 360 : 600)}` : null,
    question.alternativesIntroduction ? `Comando: ${trimText(question.alternativesIntroduction, compact ? 180 : 300)}` : null,
    alternatives ? `Alternativas: ${trimText(alternatives, compact ? 360 : 550)}` : null,
    question.correctAlternative ? `Gabarito publicado: ${question.correctAlternative}` : null,
  ].filter(Boolean).join('\n');
}

async function findReferences(query, { limit = DEFAULT_RESULT_LIMIT, compact = false, discipline, minMatches = 2 } = {}) {
  if (typeof query !== 'string' || !query.trim()) return [];
  const safeQuery = query.trim().slice(0, MAX_QUERY_LENGTH);
  const queryTokens = tokenize(safeQuery);
  if (queryTokens.length === 0) return [];

  const corpus = await getCorpus();
  return corpus
    .filter((question) => !discipline || question.discipline === discipline)
    .map((question) => ({ question, score: scoreQuestion(question, queryTokens, minMatches) }))
    .filter(({ score }) => score >= 2)
    .sort((left, right) => right.score - left.score || (left.question.year || 0) - (right.question.year || 0) || (left.question.index || 0) - (right.question.index || 0))
    .slice(0, Math.max(1, Math.min(Number(limit) || DEFAULT_RESULT_LIMIT, 3)))
    .map(({ question }) => formatReference(question, { compact }));
}

/** Retorna referências curtas do corpus local, sem chamar a API durante a pergunta. */
export async function getTutorRagContext(query, { limit = DEFAULT_RESULT_LIMIT } = {}) {
  try {
    const discipline = inferTutorDiscipline(tokenize(query));
    const references = await findReferences(query, { limit, discipline });
    return references.length > 0 ? references.join('\n\n---\n\n') : null;
  } catch (error) {
    console.warn('[enemRag] Falha ao ler corpus local; seguindo sem RAG:', error.message);
    return null;
  }
}

/** Recupera exemplos curtos por área antes da geração de um simulado. */
export async function getSimuladoRagContext(materia, { limit = SIMULADO_RESULT_LIMIT } = {}) {
  try {
    const normalizedArea = String(materia || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    const discipline = AREA_DISCIPLINES.get(normalizedArea);
    if (!discipline) return null;
    const references = await findReferences(materia, { limit, compact: true, discipline, minMatches: 1 });
    return references.length > 0 ? references.join('\n\n---\n\n') : null;
  } catch (error) {
    console.warn('[enemRag] Falha ao recuperar referências do simulado; seguindo sem RAG:', error.message);
    return null;
  }
}

export function resetTutorRagCache() {
  corpusPromise = undefined;
}
