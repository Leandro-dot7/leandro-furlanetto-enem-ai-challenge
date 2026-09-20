const MAX_HISTORY_MESSAGES = 12;

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url: url.replace(/\/$/, ''), key } : null;
}

function getAuthContext(authContext) {
  const userId = authContext?.id;
  const accessToken = authContext?.accessToken;
  if (!userId || !accessToken) {
    throw new Error('Contexto de autenticação do Tutor indisponível.');
  }
  return { userId, accessToken };
}

async function supabaseRequest(path, accessToken, { method = 'GET', body, prefer } = {}) {
  const config = getSupabaseConfig();
  if (!config) throw new Error('SUPABASE_URL ou SUPABASE_PUBLISHABLE_KEY não configurada.');

  const headers = {
    apikey: config.key,
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (prefer) headers.Prefer = prefer;

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(5_000),
  });
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const detail = typeof payload === 'object' ? payload?.message || payload?.hint : payload;
    throw new Error(`Supabase Tutor (${response.status}): ${detail || 'falha na operação.'}`);
  }
  return payload;
}

function conversationFromRow(row, history = []) {
  return { id: row.id, history };
}

async function loadConversationHistory(userId, conversationId, accessToken) {
  const rows = await supabaseRequest(
    `tutor_mensagens?conversation_id=eq.${encodeURIComponent(conversationId)}&user_id=eq.${encodeURIComponent(userId)}&select=papel,conteudo&order=criado_em.desc,id.desc&limit=${MAX_HISTORY_MESSAGES}`,
    accessToken,
  );
  return (rows || []).reverse().map((row) => ({
    role: row.papel,
    parts: [{ text: row.conteudo }],
  }));
}

export async function getTutorConversation(authContext, requestedId) {
  const { userId, accessToken } = getAuthContext(authContext);
  let rows;

  if (requestedId) {
    rows = await supabaseRequest(
      `tutor_conversas?id=eq.${encodeURIComponent(requestedId)}&user_id=eq.${encodeURIComponent(userId)}&select=id&limit=1`,
      accessToken,
    );
    if (!rows?.length) return null;
  } else {
    rows = await supabaseRequest(
      'tutor_conversas',
      accessToken,
      {
        method: 'POST',
        body: { user_id: userId },
        prefer: 'return=representation',
      },
    );
  }

  const conversation = conversationFromRow(rows[0]);
  conversation.history = await loadConversationHistory(userId, conversation.id, accessToken);
  return conversation;
}

export async function getLatestTutorConversation(authContext) {
  const { userId, accessToken } = getAuthContext(authContext);
  const rows = await supabaseRequest(
    `tutor_conversas?user_id=eq.${encodeURIComponent(userId)}&select=id&order=atualizado_em.desc,id.desc&limit=1`,
    accessToken,
  );
  if (!rows?.length) return null;

  const conversation = conversationFromRow(rows[0]);
  conversation.history = await loadConversationHistory(userId, conversation.id, accessToken);
  return conversation;
}

export async function appendTutorTurn(authContext, conversation, userText, modelText) {
  const { userId, accessToken } = getAuthContext(authContext);
  await supabaseRequest(
    'tutor_mensagens',
    accessToken,
    {
      method: 'POST',
      body: [
        { conversation_id: conversation.id, user_id: userId, papel: 'user', conteudo: userText },
        { conversation_id: conversation.id, user_id: userId, papel: 'model', conteudo: modelText },
      ],
      prefer: 'return=minimal',
    },
  );

  await supabaseRequest(
    `tutor_conversas?id=eq.${encodeURIComponent(conversation.id)}&user_id=eq.${encodeURIComponent(userId)}`,
    accessToken,
    {
      method: 'PATCH',
      body: { atualizado_em: new Date().toISOString() },
      prefer: 'return=minimal',
    },
  );

  conversation.history.push(
    { role: 'user', parts: [{ text: userText }] },
    { role: 'model', parts: [{ text: modelText }] },
  );
  if (conversation.history.length > MAX_HISTORY_MESSAGES) {
    conversation.history.splice(0, conversation.history.length - MAX_HISTORY_MESSAGES);
  }
}

export function validateTutorMessage(message) {
  if (typeof message !== 'string') return null;
  const text = message.trim();
  return text && text.length <= 4_000 ? text : null;
}
