import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import aiRoutes from '../routes/ai.routes.js';

// Carrega variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Aceita requests do frontend (Vite dev ou produção via CORS_ORIGIN)
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json());

// ─── MongoDB (opcional) ───────────────────────────────────────────────────────
// Apenas conecta se MONGODB_URI estiver definido no .env
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB conectado'))
    .catch((err) => console.warn('⚠️  Falha ao conectar ao MongoDB:', err.message));
} else {
  console.log('ℹ️  MONGODB_URI não definido — pulando conexão com MongoDB.');
}

// ─── Rotas ────────────────────────────────────────────────────────────────────
// Health checks
app.get('/', (_req, res) => {
  res.json({ message: 'API Minerva funcionando 🚀' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas de IA
app.use('/api/ai', aiRoutes);

// ─── 404 catch-all ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

// ─── Error handler global ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Erro global]', err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor Minerva rodando em http://localhost:${PORT}`);
});