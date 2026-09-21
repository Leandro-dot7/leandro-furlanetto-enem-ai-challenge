import React from 'react';
import { Link } from 'react-router-dom';
import { supabase } from './lib/supabase';
import AuthLayout from './components/AuthLayout.jsx';
import FeedbackMessage from './components/ui/FeedbackMessage.jsx';

export default function RecuperarSenha() {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const [error, setError] = React.useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setStatus('');

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setLoading(false);

    if (resetError) {
      setError('Não foi possível solicitar a recuperação agora. Tente novamente.');
      return;
    }
    setStatus('Se houver uma conta para este e-mail, enviaremos as instruções de recuperação.');
  }

  return (
    <AuthLayout compact>
      <h2 className="auth-title">Vamos recuperar<br /><span>seu acesso.</span></h2>
      <p className="auth-form-description">Informe seu e-mail para receber um link de redefinição.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="recovery-email" className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
            <input id="recovery-email" name="email" type="email" spellCheck={false} autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemplo@dominio.com…" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          {error && <FeedbackMessage tone="danger">{error}</FeedbackMessage>}
          {status && <FeedbackMessage tone="success">{status}</FeedbackMessage>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Enviando…' : 'Enviar link de recuperação'}
          </button>
        </form>
      <Link to="/" className="auth-form-footer app-text-accent">Voltar para entrar</Link>
    </AuthLayout>
  );
}
