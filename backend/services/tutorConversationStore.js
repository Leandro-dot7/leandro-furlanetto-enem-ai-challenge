import { randomUUID } from 'node:crypto';

const SESSION_TTL_MS = 60 * 60 * 1000;
const MAX_HISTORY_MESSAGES = 12;
const conversations = new Map();

function removeExpiredConversations(now = Date.now()) {
  for (const [id, conversation] of conversations) {
    if (conversation.expiresAt <= now) conversations.delete(id);
  }
}

export function getTutorConversation(userId, requestedId) {
  removeExpiredConversations();

  if (requestedId) {
    const existing = conversations.get(requestedId);
    if (existing) {
      if (existing.userId !== userId) return null;
      existing.expiresAt = Date.now() + SESSION_TTL_MS;
      return { id: requestedId, history: existing.history };
    }
  }

  const id = randomUUID();
  const conversation = { userId, history: [], expiresAt: Date.now() + SESSION_TTL_MS };
  conversations.set(id, conversation);
  return { id, history: conversation.history };
}

export function appendTutorTurn(conversation, userText, modelText) {
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
