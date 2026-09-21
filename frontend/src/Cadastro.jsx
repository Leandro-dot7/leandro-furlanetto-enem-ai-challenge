/**
 * Cadastro.jsx — Página de criação de conta
 * Design consistente com o Login (tela dividida)
 * Acessibilidade: labels, role="alert", autocomplete
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { User, Mail, Lock } from 'lucide-react';
import AuthLayout from './components/AuthLayout.jsx';
import FeedbackMessage from './components/ui/FeedbackMessage.jsx';

export default function Cadastro() {
  const navigate = useNavigate();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      navigate('/dashboard');
      return;
    }

    navigate('/', { state: { message: 'Conta criada! Verifique seu e-mail para ativar o acesso.' } });
  }

  return (
    <AuthLayout>
      <h2 className="auth-title">Comece seu<br /><span>próximo ciclo.</span></h2>
      <p className="auth-form-description">Crie sua conta e encontre seu ritmo de estudo.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                Nome completo
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-[background-color,border-color,box-shadow]"
                />
              </div>
            </div>

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
                <span className="text-slate-400 font-normal ml-1">(mínimo 6 caracteres)</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-[background-color,border-color,box-shadow]"
                />
              </div>
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
                  Cadastrando…
                </span>
              ) : (
                'Criar conta grátis'
              )}
            </button>

            <p className="text-xs app-text-subtle text-center">Seu progresso fica salvo na sua conta.</p>
          </form>
      <p className="auth-form-footer">Já tem conta? <Link to="/" className="app-text-accent font-semibold hover:underline">Entrar na Minerva</Link></p>
    </AuthLayout>
  );
}
