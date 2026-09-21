import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AI_GENERATION_TIMEOUT_MS,
  createAiRequestSignal,
  getLowLatencyGenerationConfig,
  parseStructuredJson,
} from './geminiService.js';

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
