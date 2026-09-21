import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import AuthLayout from './components/AuthLayout.jsx';
import FeedbackMessage from './components/ui/FeedbackMessage.jsx';

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [status, setStatus] = React.useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (password.length < 6) return setError('A senha deve ter ao menos 6 caracteres.');
    if (password !== confirmPassword) return setError('As senhas não coincidem.');

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) return setError('O link é inválido ou expirou. Solicite uma nova recuperação.');

    setStatus('Senha atualizada. Você será direcionado para sua conta.');
    setTimeout(() => navigate('/dashboard'), 1200);
  }

  return (
    <AuthLayout compact>
      <h2 className="auth-title">Um novo acesso.<br /><span>A mesma jornada.</span></h2>
      <p className="auth-form-description">Crie uma senha com pelo menos 6 caracteres.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-1.5">Nova senha</label>
            <input id="new-password" name="new-password" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar nova senha</label>
            <input id="confirm-password" name="confirm-password" type="password" autoComplete="new-password" minLength={6} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          {error && <FeedbackMessage tone="danger">{error}</FeedbackMessage>}
          {status && <FeedbackMessage tone="success">{status}</FeedbackMessage>}
          <button type="submit" disabled={loading || Boolean(status)} className="btn-primary w-full">
            {loading ? 'Atualizando…' : 'Atualizar senha'}
          </button>
        </form>
      <Link to="/recuperar-senha" className="auth-form-footer app-text-accent">Solicitar outro link</Link>
    </AuthLayout>
  );
}
