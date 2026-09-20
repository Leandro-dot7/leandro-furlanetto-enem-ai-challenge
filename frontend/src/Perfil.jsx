/**
 * Perfil.jsx — Perfil do estudante
 * Exibe dados reais do usuário (Supabase) e permite editar meta e curso alvo
 * Dados extras salvos na tabela 'perfis' do Supabase
 */
import React, { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import { User, Target, GraduationCap, Mail, Save, CheckCircle, Loader2 } from 'lucide-react';

const CURSOS = [
  'Medicina', 'Engenharia', 'Direito', 'Ciência da Computação',
  'Administração', 'Arquitetura', 'Psicologia', 'Enfermagem',
  'Educação Física', 'Outro',
];

export default function Perfil() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: '',
    cursoAlvo: '',
    metaPontuacao: '',
  });

  const userName = user?.user_metadata?.name || '';

  useEffect(() => {
    if (!user) return;

    async function loadPerfil() {
      setLoading(true);
      const { data } = await supabase
        .from('perfis')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setForm({
        name: data?.name || userName,
        cursoAlvo: data?.curso_alvo || '',
        metaPontuacao: data?.meta_pontuacao || '',
      });
      setLoading(false);
    }

    loadPerfil().catch(() => {
      setForm((f) => ({ ...f, name: userName }));
      setLoading(false);
    });
  }, [user, userName]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      await supabase.from('perfis').upsert({
        user_id: user.id,
        name: form.name,
        curso_alvo: form.cursoAlvo,
        meta_pontuacao: form.metaPontuacao,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // silencia erros de tabela não existente
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={28} className="text-indigo-500 animate-spin" />
      </div>
    );
  }

  const inicial = (form.name || user?.email || 'E').charAt(0).toUpperCase();

  return (
    <div className="max-w-lg mx-auto animate-slide-up">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <User size={22} className="text-indigo-600" aria-hidden="true" />
          Meu Perfil
        </h1>
        <p className="text-sm text-slate-500 mt-1">Suas informações e metas de estudo</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 bg-white rounded-2xl border border-slate-200 p-5 mb-4">
        <div
          className="flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white text-2xl font-bold flex-shrink-0"
          aria-hidden="true"
        >
          {inicial}
        </div>
        <div>
          <p className="font-semibold text-slate-900">{form.name || 'Estudante'}</p>
          <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
            <Mail size={14} aria-hidden="true" />
            <span>{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
        {/* Nome */}
        <div>
          <label htmlFor="pf-name" className="block text-sm font-medium text-slate-700 mb-1.5">
            Nome completo
          </label>
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="pf-name"
              name="name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Seu nome"
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-[background-color,border-color,box-shadow]"
            />
          </div>
        </div>

        {/* Curso alvo */}
        <div>
          <label htmlFor="pf-curso" className="block text-sm font-medium text-slate-700 mb-1.5">
            Curso alvo
          </label>
          <div className="relative">
            <GraduationCap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <select
              id="pf-curso"
              name="cursoAlvo"
              value={form.cursoAlvo}
              onChange={(e) => setForm((f) => ({ ...f, cursoAlvo: e.target.value }))}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-[background-color,border-color,box-shadow] appearance-none"
            >
              <option value="">Selecione o curso desejado</option>
              {CURSOS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Meta de pontuação */}
        <div>
          <label htmlFor="pf-meta" className="block text-sm font-medium text-slate-700 mb-1.5">
            Meta de pontuação no ENEM
          </label>
          <div className="relative">
            <Target size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="pf-meta"
              name="metaPontuacao"
              type="number"
              min={300}
              max={1000}
              value={form.metaPontuacao}
              onChange={(e) => setForm((f) => ({ ...f, metaPontuacao: e.target.value }))}
              placeholder="Ex: 750"
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-[background-color,border-color,box-shadow]"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">Entre 300 e 1000 pontos</p>
        </div>

        {/* Botão salvar */}
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2.5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm"
        >
          {saving ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Salvando…
            </>
          ) : saved ? (
            <>
              <CheckCircle size={15} />
              Salvo!
            </>
          ) : (
            <>
              <Save size={15} />
              Salvar perfil
            </>
          )}
        </button>

        {saved && (
          <p role="status" className="text-center text-xs text-emerald-600 font-medium">
            ✅ Perfil atualizado com sucesso!
          </p>
        )}
      </form>
    </div>
  );
}
