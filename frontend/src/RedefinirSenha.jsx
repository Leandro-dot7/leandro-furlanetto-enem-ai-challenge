import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { supabase } from './lib/supabase';
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
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="app-surface app-card w-full max-w-sm rounded-2xl p-6 shadow-sm">
        <Lock size={28} className="text-indigo-600 mb-4" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-slate-900">Definir nova senha</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">Crie uma senha nova para acessar sua conta.</p>
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
          <button type="submit" disabled={loading || Boolean(status)} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            {loading ? 'Atualizando…' : 'Atualizar senha'}
          </button>
        </form>
        <Link to="/recuperar-senha" className="block text-center text-sm text-indigo-600 hover:underline mt-5">Solicitar outro link</Link>
      </div>
    </main>
  );
}
