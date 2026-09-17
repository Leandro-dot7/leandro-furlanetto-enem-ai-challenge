/**
 * Login.jsx — Página de autenticação
 * Design: tela dividida (esquerda: branding, direita: formulário)
 * Acessibilidade: labels associados, role="alert" em erros, focus visível
 */
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { GraduationCap, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (loginError) {
      setError('E-mail ou senha inválidos. Verifique e tente novamente.');
      return;
    }

    navigate('/dashboard');
  }

  return (
    <div className="min-h-screen flex">
      {/* Painel esquerdo — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-700 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-2xl backdrop-blur-sm">
              <GraduationCap size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Minerva</h1>
              <p className="text-indigo-200 text-sm">Plataforma ENEM</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-4 leading-tight">
            Sua preparação para o ENEM começa aqui.
          </h2>
          <p className="text-indigo-200 text-lg leading-relaxed mb-8">
            Simulados personalizados, tutor com IA e correção de redação — tudo em um só lugar.
          </p>

          <div className="space-y-3">
            {[
              '🤖 Tutor IA especializado no ENEM',
              '📝 Simulados gerados por inteligência artificial',
              '✍️ Correção de redação por competência',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-indigo-100">
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <GraduationCap size={24} className="text-indigo-600" />
            <span className="text-xl font-bold text-slate-900">Minerva ENEM</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">Entrar na conta</h2>
          <p className="text-slate-500 text-sm mb-8">
            Não tem conta?{' '}
            <Link to="/cadastro" className="text-indigo-600 font-medium hover:text-indigo-700 underline-offset-2 hover:underline">
              Cadastre-se grátis
            </Link>
          </p>

          {/* Mensagem de sucesso (vinda do cadastro) */}
          {location.state?.message && (
            <div role="status" className="flex items-start gap-2 p-3 mb-5 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm">
              <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
              <p>{location.state.message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* E-mail */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div role="alert" className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
