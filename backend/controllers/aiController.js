import * as gemini from '../services/geminiService.js';

// ─── POST /api/ai/tutor ───────────────────────────────────────────────────────
/**
 * Handler do chat com o Tutor ENEM.
 * Body esperado: { messages: [{role: 'user'|'model', parts: [{text: string}]}] }
 */
export async function tutorChat(req, res) {
  const { messages } = req.body;

  // Validação de entrada
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      error: 'Campo obrigatório ausente ou inválido: "messages" deve ser um array não vazio.',
    });
  }

  // Valida que cada mensagem tem role e parts
  for (const msg of messages) {
    if (!msg.role || !Array.isArray(msg.parts) || msg.parts.length === 0) {
      return res.status(400).json({
        error:
          'Cada mensagem deve ter "role" ("user" ou "model") e "parts" (array com ao menos um {text}).',
      });
    }
  }

  try {
    const resposta = await gemini.chatWithTutor(messages);
    return res.status(200).json({ resposta });
  } catch (err) {
    console.error('[tutorChat] Erro ao chamar Gemini:', err.message);
    return res.status(500).json({ error: 'Erro ao processar resposta do tutor. Tente novamente.' });
  }
}

// ─── POST /api/ai/simulado/gerar ─────────────────────────────────────────────
/**
 * Handler de geração de simulado ENEM.
 * Body esperado: { materia: string, numQuestoes: number }
 */
export async function gerarSimulado(req, res) {
  const { materia, numQuestoes } = req.body;

  // Validação de entrada
  if (!materia || typeof materia !== 'string' || materia.trim() === '') {
    return res.status(400).json({
      error: 'Campo obrigatório ausente ou inválido: "materia" deve ser uma string não vazia.',
    });
  }

  if (
    numQuestoes === undefined ||
    numQuestoes === null ||
    typeof numQuestoes !== 'number' ||
    !Number.isInteger(numQuestoes) ||
    numQuestoes < 1 ||
    numQuestoes > 20
  ) {
    return res.status(400).json({
      error: 'Campo obrigatório ausente ou inválido: "numQuestoes" deve ser um inteiro entre 1 e 20.',
    });
  }

  try {
    const simulado = await gemini.gerarSimulado(materia.trim(), numQuestoes);
    return res.status(200).json(simulado);
  } catch (err) {
    console.error('[gerarSimulado] Erro:', err.message);

    // Erro específico de JSON inválido retornado pela IA
    if (err.message.includes('JSON inválido')) {
      return res.status(502).json({ error: err.message });
    }

    return res.status(500).json({ error: 'Erro ao gerar simulado. Tente novamente.' });
  }
}

// ─── POST /api/ai/redacao/gerar-tema ─────────────────────────────────────────
/**
 * Handler de geração de tema dinâmico para redação ENEM.
 */
export async function gerarTemaRedacao(req, res) {
  try {
    const temaData = await gemini.gerarTemaRedacao();
    return res.status(200).json(temaData);
  } catch (err) {
    console.error('[gerarTemaRedacao] Erro:', err.message);
    return res.status(500).json({ error: 'Erro ao gerar tema de redação. Tente novamente.' });
  }
}

// ─── POST /api/ai/redacao/corrigir ───────────────────────────────────────────
/**
 * Handler de correção de redação ENEM.
 * Body esperado: { tema: string, texto: string }
 */
export async function corrigirRedacao(req, res) {
  const { tema, texto } = req.body;

  // Validação de entrada
  if (!tema || typeof tema !== 'string' || tema.trim() === '') {
    return res.status(400).json({
      error: 'Campo obrigatório ausente ou inválido: "tema" deve ser uma string não vazia.',
    });
  }

  if (!texto || typeof texto !== 'string' || texto.trim() === '') {
    return res.status(400).json({
      error: 'Campo obrigatório ausente ou inválido: "texto" deve ser uma string não vazia.',
    });
  }

  // Limite mínimo de tamanho para evitar redações em branco
  if (texto.trim().length < 50) {
    return res.status(400).json({
      error: 'O texto da redação é muito curto (mínimo 50 caracteres).',
    });
  }

  try {
    const correcao = await gemini.corrigirRedacao(tema.trim(), texto.trim());
    return res.status(200).json(correcao);
  } catch (err) {
    console.error('[corrigirRedacao] Erro:', err.message);

    // Erro específico de JSON inválido retornado pela IA
    if (err.message.includes('JSON inválido')) {
      return res.status(502).json({ error: err.message });
    }

    return res.status(500).json({ error: 'Erro ao corrigir redação. Tente novamente.' });
  }
}
