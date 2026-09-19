import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUTPUT_DIR = path.resolve(SCRIPT_DIR, '../data/enem-rag');
const DEFAULT_API_BASE_URL = 'https://api.enem.dev/v1';
const REQUEST_INTERVAL_MS = 1_100;
const PAGE_SIZE = 10;
const REQUEST_TIMEOUT_MS = 20_000;

function parseYears() {
  const rawYears = process.argv.slice(2).join(',') || process.env.ENEM_RAG_YEARS || '2023';
  const years = [...new Set(rawYears.split(',').map((year) => year.trim()).filter((year) => /^\d{4}$/.test(year)))];
  if (years.length === 0 || years.length > 10) throw new Error('Informe de 1 a 10 anos no formato 2023 ou 2022,2023.');
  return years;
}

function getApiBaseUrl() {
  const raw = process.env.ENEM_API_BASE_URL || DEFAULT_API_BASE_URL;
  const url = new URL(raw);
  const localHost = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && localHost)) {
    throw new Error('ENEM_API_BASE_URL deve usar HTTPS; HTTP só é permitido para um host local.');
  }
  return url.href.replace(/\/$/, '');
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

let lastRequestAt = 0;
async function fetchJson(url) {
  const wait = REQUEST_INTERVAL_MS - (Date.now() - lastRequestAt);
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();

  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`API respondeu HTTP ${response.status} em ${url}`);
  const payload = await response.json();
  if (!payload || typeof payload !== 'object') throw new Error(`Resposta inválida da API em ${url}`);
  return payload;
}

async function ingestYear(year, apiBaseUrl, outputDir) {
  const questions = [];
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const url = new URL(`${apiBaseUrl}/exams/${year}/questions`);
    url.searchParams.set('limit', String(PAGE_SIZE));
    url.searchParams.set('offset', String(offset));
    const payload = await fetchJson(url.href);
    const page = Array.isArray(payload.questions) ? payload.questions : [];
    const metadata = payload.metadata || {};
    total = Number.isInteger(metadata.total) ? metadata.total : offset + page.length;
    questions.push(...page);
    if (page.length === 0 || page.length < PAGE_SIZE) break;
    offset += page.length;
  }

  const output = {
    source: 'api.enem.dev',
    sourceBaseUrl: apiBaseUrl,
    year: Number(year),
    fetchedAt: new Date().toISOString(),
    questions,
  };
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${year}.json`);
  const temporaryPath = `${outputPath}.tmp-${process.pid}`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  await fs.rename(temporaryPath, outputPath);
  console.log(`[enemRag] ${year}: ${questions.length} questões salvas em ${outputPath}`);
}

async function main() {
  const years = parseYears();
  const apiBaseUrl = getApiBaseUrl();
  const outputDir = process.env.ENEM_RAG_DATA_DIR
    ? path.resolve(process.cwd(), process.env.ENEM_RAG_DATA_DIR)
    : DEFAULT_OUTPUT_DIR;
  for (const year of years) await ingestYear(year, apiBaseUrl, outputDir);
}

main().catch((error) => {
  console.error(`[enemRag] Falha na ingestão: ${error.message}`);
  process.exitCode = 1;
});
