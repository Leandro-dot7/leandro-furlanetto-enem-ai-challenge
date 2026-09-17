/**
 * api.js — Cliente centralizado para o backend Minerva
 * Todas as chamadas ao Node.js/Express passam por aqui.
 * Chamadas ao Supabase (auth/dados) ficam em seus próprios hooks.
 */
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 60000, // 60s — IA pode demorar
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de erro para mensagens amigáveis
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg =
      error.response?.data?.error ||
      error.message ||
      'Erro desconhecido. Tente novamente.';
    return Promise.reject(new Error(msg));
  }
);

export default api;
