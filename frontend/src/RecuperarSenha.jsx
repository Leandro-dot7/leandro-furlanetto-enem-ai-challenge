import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { supabase } from './lib/supabase';

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
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <Mail size={28} className="text-indigo-600 mb-4" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-slate-900">Recuperar senha</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">Informe seu e-mail para receber um link seguro de redefinição.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="recovery-email" className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
            <input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          {error && <p role="alert" className="flex gap-2 text-sm text-red-700"><AlertCircle size={16} aria-hidden="true" />{error}</p>}
          {status && <p role="status" className="flex gap-2 text-sm text-emerald-700"><CheckCircle size={16} aria-hidden="true" />{status}</p>}
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            {loading ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
        </form>
        <Link to="/" className="block text-center text-sm text-indigo-600 hover:underline mt-5">Voltar para entrar</Link>
      </div>
    </main>
  );
}
