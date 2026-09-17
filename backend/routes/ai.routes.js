import { Router } from 'express';
import { tutorChat, gerarSimulado, corrigirRedacao } from '../controllers/aiController.js';

const router = Router();

/**
 * POST /api/ai/tutor
 * Chat com o Tutor ENEM.
 * Body: { messages: [{role: 'user'|'model', parts: [{text: string}]}] }
 */
router.post('/tutor', tutorChat);

/**
 * POST /api/ai/simulado/gerar
 * Gera questões de simulado estilo ENEM.
 * Body: { materia: string, numQuestoes: number }
 */
router.post('/simulado/gerar', gerarSimulado);

/**
 * POST /api/ai/redacao/corrigir
 * Corrige uma redação ENEM por competência.
 * Body: { tema: string, texto: string }
 */
router.post('/redacao/corrigir', corrigirRedacao);

export default router;
