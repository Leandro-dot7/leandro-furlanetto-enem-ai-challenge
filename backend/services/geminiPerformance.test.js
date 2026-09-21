import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AI_GENERATION_TIMEOUT_MS,
  createAiRequestSignal,
  getLowLatencyGenerationConfig,
  parseStructuredJson,
} from './geminiService.js';
import * as geminiService from './geminiService.js';

test('configura geração de IA com pensamento de baixa latência', () => {
  assert.deepEqual(getLowLatencyGenerationConfig(), {
    thinkingConfig: { thinkingLevel: 'low' },
  });
  assert.ok(AI_GENERATION_TIMEOUT_MS < 60_000);
});

test('propaga cancelamento do cliente para a geração de IA', () => {
  const parent = new AbortController();
  const signal = createAiRequestSignal(parent.signal);

  parent.abort();

  assert.equal(signal.aborted, true);
});

test('aceita JSON cercado por markdown e identifica retorno inválido', () => {
  assert.deepEqual(parseStructuredJson('```json\n{"questoes": []}\n```', 'simulado'), { questoes: [] });
  assert.throws(
    () => parseStructuredJson('resposta sem JSON', 'simulado'),
    /JSON inválido retornado pelo modelo/,
  );
});

test('prioriza Flash no Tutor e Flash-Lite no Simulado', () => {
  assert.deepEqual(geminiService.getCandidateModels('tutor'), ['gemini-3.6-flash', 'gemini-3.5-flash-lite']);
  assert.deepEqual(geminiService.getCandidateModels('simulado'), ['gemini-3.5-flash-lite', 'gemini-3.6-flash']);
});

test('aceita apenas simulado com cinco alternativas, gabarito e explicação', () => {
  const valid = {
    materia: 'Matemática',
    questoes: [{
      id: 1,
      enunciado: 'Quanto é 2 + 2?',
      alternativas: { A: '1', B: '2', C: '3', D: '4', E: '5' },
      gabarito: 'D',
      explicacao: 'Dois mais dois são quatro.',
    }],
  };
  assert.deepEqual(geminiService.validateSimuladoResponse(valid, 'Matemática', 1), valid);
  assert.deepEqual(
    geminiService.validateSimuladoResponse({ ...valid, materia: 'Matematica' }, 'Matemática', 1),
    valid,
  );
  for (const invalid of [
    { ...valid, questoes: [] },
    { ...valid, questoes: [{ ...valid.questoes[0], alternativas: { A: '1' } }] },
    { ...valid, questoes: [{ ...valid.questoes[0], gabarito: 'F' }] },
    { ...valid, questoes: [{ ...valid.questoes[0], explicacao: ' ' }] },
  ]) {
    assert.throws(() => geminiService.validateSimuladoResponse(invalid, 'Matemática', 1), /JSON inválido/);
  }
});
