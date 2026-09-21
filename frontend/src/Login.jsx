/**
 * Login.jsx — Página de autenticação
 * Design: tela dividida (esquerda: branding, direita: formulário)
 * Acessibilidade: labels associados, role="alert" em erros, focus visível
 */
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import AuthLayout from './components/AuthLayout.jsx';
import FeedbackMessage from './components/ui/FeedbackMessage.jsx';

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
    <AuthLayout>
      <h2 className="auth-title">Bem-vindo<br /><span>de volta.</span></h2>
      <p className="auth-form-description">Retome de onde parou. Seu próximo passo está aqui.</p>
      {location.state?.message && <div className="mb-5"><FeedbackMessage tone="success">{location.state.message}</FeedbackMessage></div>}
      <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-mail */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  id="email"
                  name="email"
                  type="email" spellCheck={false}
                  autoComplete="email"
                  inputMode="email"
                  placeholder="exemplo@email.com…"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-[background-color,border-color,box-shadow]"
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
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-[background-color,border-color,box-shadow]"
                />
              </div>
            </div>
            <div className="text-right -mt-2">
              <Link to="/recuperar-senha" className="text-xs app-text-accent font-semibold hover:underline">
                Esqueci minha senha
              </Link>
            </div>

            {/* Erro */}
            {error && <FeedbackMessage tone="danger">{error}</FeedbackMessage>}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Entrando…
                </span>
              ) : (
                <>Entrar no Minerva <ArrowRight size={18} aria-hidden="true" /></>
              )}
            </button>
          </form>
      <div className="auth-divider"><span>Primeira vez por aqui?</span></div><Link to="/cadastro" className="btn-secondary w-full">Criar conta grátis</Link>
    </AuthLayout>
  );
}
