import assert from 'node:assert/strict';
import test from 'node:test';
import { getSimuladoRagContext, getTutorRagContext } from './enemRagService.js';

test('simulado recupera apenas questões da área solicitada', async () => {
  for (const [area, discipline] of [
    ['Linguagens', 'linguagens'],
    ['Linguagens e Códigos', 'linguagens'],
    ['Ciências Humanas', 'ciencias-humanas'],
    ['Ciências da Natureza', 'ciencias-natureza'],
    ['Matemática', 'matematica'],
  ]) {
    const context = await getSimuladoRagContext(area);
    assert.ok(context, `Sem referência para ${area}`);
    const sources = context.match(/^Fonte: .+$/gm) || [];
    assert.ok(sources.length > 0);
    assert.ok(sources.every((source) => source.includes(`— ${discipline}`)), `${area}: ${sources.join(' | ')}`);
  }
});

test('tutor não usa questões desconexas para explicar mitose e meiose', async () => {
  const context = await getTutorRagContext('Qual a diferença entre mitose e meiose?');
  assert.ok(context);
  assert.match(context, /mitose|meiose/i);
  assert.doesNotMatch(context, /— ciencias-humanas/);
});

test('tutor não injeta referências de outra área em perguntas sugeridas', async () => {
  for (const [query, discipline] of [
    ['Como resolver equações do 2º grau?', 'matematica'],
    ['Explique função quadrática', 'matematica'],
    ['Explique o Modernismo brasileiro', 'linguagens'],
    ['O que é a competência V da redação ENEM?', 'linguagens'],
  ]) {
    const context = await getTutorRagContext(query);
    if (context) assert.match(context, new RegExp(`^Fonte: .+ — ${discipline}`, 'm'), query);
  }
});
