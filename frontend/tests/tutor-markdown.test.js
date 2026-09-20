import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const tutor = fs.readFileSync(new URL('../src/TutorAI.jsx', import.meta.url), 'utf8');
const renderer = fs.readFileSync(new URL('../src/components/tutor/TutorMarkdown.jsx', import.meta.url), 'utf8');

test('Tutor usa renderer dedicado para GFM, matematica e HTML seguro', () => {
  assert.match(tutor, /TutorMarkdown/);
  assert.doesNotMatch(tutor, /function renderMarkdownBlocks/);
  assert.doesNotMatch(tutor, /function renderInlineMarkdown/);
  assert.match(renderer, /ReactMarkdown/);
  assert.match(renderer, /remarkGfm/);
  assert.match(renderer, /remarkMath/);
  assert.match(renderer, /rehypeKatex/);
  assert.match(renderer, /rehypeSanitize/);
  assert.match(renderer, /skipHtml/);
});

test('renderer expoe tabela responsiva e evita HTML bruto', () => {
  assert.match(renderer, /table-wrapper|overflow-x-auto/);
  assert.match(renderer, /components/);
  assert.match(renderer, /a:/);
});

test('Tutor exibe estados de carregamento e placeholder com codificação UTF-8 correta', () => {
  assert.match(tutor, /<span>Pensando…<\/span>/);
  assert.match(tutor, /Pergunte sobre qualquer conteúdo do ENEM…/);
  assert.doesNotMatch(tutor, /Pensandoâ€¦|conteÃºdo|ENEMâ€¦/);
});
