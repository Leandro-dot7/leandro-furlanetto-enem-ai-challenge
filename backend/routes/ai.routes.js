import { Router } from 'express';
import { tutorChat, gerarSimulado, corrigirRedacao, gerarTemaRedacao } from '../controllers/aiController.js';
import { aiRateLimit, requireSupabaseUser } from '../middleware/aiSecurity.js';

const router = Router();

// React route guards do not protect direct HTTP requests.
router.use(requireSupabaseUser, aiRateLimit);

/**
 * POST /api/ai/tutor
 * Chat com o Tutor ENEM.
 * Body: { message: string, conversationId?: string|null }
 */
router.post('/tutor', tutorChat);

/**
 * POST /api/ai/simulado/gerar
 * Gera questões de simulado estilo ENEM.
 * Body: { materia: string, numQuestoes: number }
 */
router.post('/simulado/gerar', gerarSimulado);

/**
 * POST /api/ai/redacao/gerar-tema
 * Gera uma proposta de tema inédita estilo ENEM.
 */
router.post('/redacao/gerar-tema', gerarTemaRedacao);

/**
 * POST /api/ai/redacao/corrigir
 * Corrige uma redação ENEM por competência.
 * Body: { tema: string, texto: string }
 */
router.post('/redacao/corrigir', corrigirRedacao);

export default router;
