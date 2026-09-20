import assert from 'node:assert/strict';
import test from 'node:test';
import {
  appendTutorTurn,
  getLatestTutorConversation,
  getTutorConversation,
  validateTutorMessage,
} from './tutorConversationStore.js';

const authContext = { id: 'user-1', accessToken: 'access-token' };
const conversationId = 'conversation-1';

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => payload === null ? '' : JSON.stringify(payload),
  };
}

function setupEnvironment() {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_PUBLISHABLE_KEY = 'publishable-key';
}

test('persiste e restaura uma conversa usando o usuário autenticado', async () => {
  setupEnvironment();
  const requests = [];
  const previousFetch = global.fetch;
  global.fetch = async (url, options = {}) => {
    requests.push({ url, options });
    if (options.method === 'POST' && url.endsWith('/tutor_conversas')) {
      return jsonResponse([{ id: conversationId }]);
    }
    if (options.method === 'POST' && url.endsWith('/tutor_mensagens')) {
      return jsonResponse(null);
    }
    if (options.method === 'PATCH' && url.includes('/tutor_conversas?')) {
      return jsonResponse(null);
    }
    if (url.includes('/tutor_mensagens?')) {
      return jsonResponse([
        { papel: 'model', conteudo: 'Resposta persistida.' },
        { papel: 'user', conteudo: 'Pergunta persistida.' },
      ]);
    }
    throw new Error(`Requisição inesperada: ${url}`);
  };

  try {
    const conversation = await getTutorConversation(authContext);
    assert.equal(conversation.id, conversationId);
    assert.deepEqual(conversation.history, [
      { role: 'user', parts: [{ text: 'Pergunta persistida.' }] },
      { role: 'model', parts: [{ text: 'Resposta persistida.' }] },
    ]);

    await appendTutorTurn(authContext, conversation, 'Nova pergunta.', 'Nova resposta.');
    const messageInsert = requests.find(({ url, options }) => options.method === 'POST' && url.endsWith('/tutor_mensagens'));
    assert.deepEqual(JSON.parse(messageInsert.options.body), [
      { conversation_id: conversationId, user_id: 'user-1', papel: 'user', conteudo: 'Nova pergunta.' },
      { conversation_id: conversationId, user_id: 'user-1', papel: 'model', conteudo: 'Nova resposta.' },
    ]);
    assert.equal(conversation.history.length, 4);
  } finally {
    global.fetch = previousFetch;
  }
});

test('recupera a conversa mais recente do usuário', async () => {
  setupEnvironment();
  const previousFetch = global.fetch;
  global.fetch = async (url) => {
    if (url.includes('tutor_conversas?user_id=')) return jsonResponse([{ id: conversationId }]);
    if (url.includes('/tutor_mensagens?')) return jsonResponse([]);
    throw new Error(`Requisição inesperada: ${url}`);
  };

  try {
    const conversation = await getLatestTutorConversation(authContext);
    assert.equal(conversation.id, conversationId);
    assert.deepEqual(conversation.history, []);
  } finally {
    global.fetch = previousFetch;
  }
});

test('mantém a validação de tamanho das mensagens do Tutor', () => {
  assert.equal(validateTutorMessage('  dúvida válida  '), 'dúvida válida');
  assert.equal(validateTutorMessage('x'.repeat(4_001)), null);
  assert.equal(validateTutorMessage('   '), null);
});
