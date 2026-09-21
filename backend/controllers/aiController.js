import * as gemini from '../services/geminiService.js';
import { getSimuladoRagContext, getTutorRagContext } from '../services/enemRagService.js';
import {
  appendTutorTurn,
  clearTutorHistory,
  getTutorConversation,
  getLatestTutorConversation,
  validateTutorMessage,
} from '../services/tutorConversationStore.js';

function isTutorStorageError(error) {
  return /tutor_(conversas|mensagens)|PGRST205|42P01/i.test(error?.message || '');
}

function isAiTimeoutError(error) {
  return error?.name === 'TimeoutError' || /timeout|timed out/i.test(error?.message || '');
}

function isInvalidAiJsonError(error) {
  return error?.code === 'INVALID_AI_JSON';
}

/** GET /api/ai/tutor/latest — recupera a última conversa persistida do usuário. */
export async function getLatestTutor(req, res) {
  try {
    const conversation = await getLatestTutorConversation(req.authUser);
    return res.status(200).json({
      conversationId: conversation?.id || null,
      mensagens: conversation?.history.map((message) => ({
        role: message.role,
        text: message.parts[0].text,
      })) || [],
    });
  } catch (err) {
    console.error('[getLatestTutor] Erro:', err.message);
    return res.status(503).json({
      error: isTutorStorageError(err)
        ? 'Persistência do Tutor não configurada. Execute o supabase_schema.sql no projeto Supabase.'
        : 'Não foi possível recuperar o histórico do tutor.',
    });
  }
}

/** POST /api/ai/tutor — a conversa é mantida no servidor e persistida por usuário. */
export async function clearTutorHistoryController(req, res) {
  try {
    await clearTutorHistory(req.authUser);
    return res.status(204).send();
  } catch (err) {
    console.error('[clearTutorHistory] Erro:', err.message);
    return res.status(isTutorStorageError(err) ? 503 : 500).json({
      error: isTutorStorageError(err)
        ? 'Persistência do Tutor não configurada. Execute o supabase_schema.sql no projeto Supabase.'
        : 'Não foi possível limpar o histórico do tutor.',
    });
  }
}

export async function tutorChat(req, res) {
  const { message, conversationId } = req.body;
  const safeMessage = validateTutorMessage(message);

  if (!safeMessage) {
    return res.status(400).json({ error: 'Mensagem inválida: envie um texto de até 4.000 caracteres.' });
  }
  // A primeira mensagem envia null; isso significa iniciar uma nova conversa.
  if (conversationId !== undefined && conversationId !== null && (typeof conversationId !== 'string' || conversationId.length > 64)) {
    return res.status(400).json({ error: 'Identificador de conversa inválido.' });
  }

  // A client-side AbortController closes the HTTP request. Propagate that
  // disconnect to the Gemini call so the backend stops waiting and cannot
  // persist a response that the student cancelled.
  const abortController = new AbortController();
  const abortOnDisconnect = () => abortController.abort();
  req.once('aborted', abortOnDisconnect);
  res.once('close', abortOnDisconnect);

  try {
    const conversation = await getTutorConversation(req.authUser, conversationId);
    if (!conversation) return res.status(404).json({ error: 'Conversa não encontrada.' });

    const ragContext = await getTutorRagContext(safeMessage);
    const resposta = await gemini.chatWithTutor([
      ...conversation.history,
      { role: 'user', parts: [{ text: safeMessage }] },
    ], { signal: abortController.signal, retrievalContext: ragContext });

    if (abortController.signal.aborted) return;
    await appendTutorTurn(req.authUser, conversation, safeMessage, resposta);
    return res.status(200).json({ resposta, conversationId: conversation.id });
  } catch (err) {
    if (abortController.signal.aborted || err?.name === 'AbortError' || err?.code === 'ABORT_ERR') {
      // The browser has already stopped waiting. Do not emit a 500, retry a
      // fallback model or mutate the conversation after cancellation.
      return;
    }
    if (isAiTimeoutError(err)) {
      return res.status(504).json({ error: 'A resposta demorou mais que o limite. Tente novamente em alguns segundos.' });
    }
    console.error('[tutorChat] Erro ao chamar Gemini:', err.message);
    return res.status(isTutorStorageError(err) ? 503 : 500).json({
      error: isTutorStorageError(err)
        ? 'Persistência do Tutor não configurada. Execute o supabase_schema.sql no projeto Supabase.'
        : 'Erro ao processar resposta do tutor. Tente novamente.',
    });
  } finally {
    req.removeListener('aborted', abortOnDisconnect);
    res.removeListener('close', abortOnDisconnect);
  }
}

/** POST /api/ai/simulado/gerar */
export async function gerarSimulado(req, res) {
  const { materia, numQuestoes } = req.body;

  if (!materia || typeof materia !== 'string' || materia.trim() === '') {
    return res.status(400).json({ error: 'Campo obrigatório inválido: "materia" deve ser uma string não vazia.' });
  }
  if (!Number.isInteger(numQuestoes) || numQuestoes < 1 || numQuestoes > 20) {
    return res.status(400).json({ error: 'Campo obrigatório inválido: "numQuestoes" deve ser um inteiro entre 1 e 20.' });
  }

  try {
    const materiaSegura = materia.trim();
    const retrievalContext = await getSimuladoRagContext(materiaSegura);
    const simulado = await gemini.gerarSimulado(materiaSegura, numQuestoes, { retrievalContext });
    return res.status(200).json(simulado);
  } catch (err) {
    console.error('[gerarSimulado] Erro:', err.message);
    return res.status(isAiTimeoutError(err) ? 504 : isInvalidAiJsonError(err) ? 502 : 500).json({
      error: isAiTimeoutError(err)
        ? 'A geração demorou mais que o limite. Tente gerar menos questões ou novamente em alguns segundos.'
        : isInvalidAiJsonError(err) ? err.message : 'Erro ao gerar simulado. Tente novamente.',
    });
  }
}

/** POST /api/ai/redacao/gerar-tema */
export async function gerarTemaRedacao(_req, res) {
  try {
    const temaData = await gemini.gerarTemaRedacao();
    return res.status(200).json(temaData);
  } catch (err) {
    console.error('[gerarTemaRedacao] Erro:', err.message);
    return res.status(isAiTimeoutError(err) ? 504 : 500).json({
      error: isAiTimeoutError(err)
        ? 'A geração demorou mais que o limite. Tente novamente em alguns segundos.'
        : 'Erro ao gerar tema de redação. Tente novamente.',
    });
  }
}

/** POST /api/ai/redacao/corrigir */
export async function corrigirRedacao(req, res) {
  const { tema, texto } = req.body;

  if (!tema || typeof tema !== 'string' || tema.trim() === '') {
    return res.status(400).json({ error: 'Campo obrigatório inválido: "tema" deve ser uma string não vazia.' });
  }
  if (!texto || typeof texto !== 'string' || texto.trim().length < 50) {
    return res.status(400).json({ error: 'O texto da redação deve ter ao menos 50 caracteres.' });
  }

  try {
    const correcao = await gemini.corrigirRedacao(tema.trim(), texto.trim());
    return res.status(200).json(correcao);
  } catch (err) {
    console.error('[corrigirRedacao] Erro:', err.message);
    return res.status(isAiTimeoutError(err) ? 504 : isInvalidAiJsonError(err) ? 502 : 500).json({
      error: isAiTimeoutError(err)
        ? 'A correção demorou mais que o limite. Tente novamente em alguns segundos.'
        : isInvalidAiJsonError(err) ? err.message : 'Erro ao corrigir redação. Tente novamente.',
    });
  }
}
