/**
 * api.js — Cliente centralizado para o backend Minerva
 * Todas as chamadas ao Node.js/Express passam por aqui.
 * Chamadas ao Supabase (auth/dados) ficam em seus próprios hooks.
 */
import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 60000, // 60s — IA pode demorar
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) config.headers.Authorization = `Bearer ${session.access_token}`;
  return config;
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
