/**
 * Perfil.jsx — Perfil do estudante
 * Exibe dados reais do usuário (Supabase) e permite editar meta e curso alvo
 * Dados extras salvos na tabela 'perfis' do Supabase
 */
import React, { useEffect, useState } from 'react';
import { useAuth } from './context/AuthContext';
import { supabase } from './lib/supabase';
import { User, Target, GraduationCap, Mail, Save, CheckCircle, Loader2, ChevronDown } from 'lucide-react';
import FeedbackMessage from './components/ui/FeedbackMessage.jsx';
import PageHeader from './components/ui/PageHeader.jsx';

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
      <div className="app-text-muted flex items-center justify-center gap-3 py-24" role="status">
        <Loader2 size={24} className="app-text-accent animate-spin" aria-hidden="true" />
        Carregando seu perfil…
      </div>
    );
  }

  const inicial = (form.name || user?.email || 'E').charAt(0).toUpperCase();

  return (
    <div className="page-stack mx-auto max-w-6xl space-y-8 animate-slide-up">
      <PageHeader eyebrow="Sua jornada, seus objetivos" title="Meu Perfil" description="Suas informações e metas de estudo" />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.65fr)]">
      {/* Avatar */}
      <aside className="space-y-5" aria-label="Seu perfil de estudante">
      <div className="app-surface app-card overflow-hidden">
        <div className="app-surface-muted h-20 border-0" aria-hidden="true" />
        <div className="px-6 pb-7 sm:px-8">
        <div
          className="app-surface app-text-accent relative -mt-9 mb-5 flex h-20 w-20 items-center justify-center rounded-3xl text-3xl font-bold shadow-sm"
          aria-hidden="true"
        >
          {inicial}
        </div>
        <div className="min-w-0">
          <p className="eyebrow app-text-subtle mb-2">Estudante Minerva</p>
          <h2 className="break-words text-2xl font-bold tracking-tight">{form.name || 'Estudante'}</h2>
          <div className="app-text-muted mt-3 flex items-start gap-2 text-sm">
            <Mail size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span className="break-all">{user?.email}</span>
          </div>
        </div>
        </div>
      </div>
      <div className="app-surface-muted app-card p-6 sm:p-8">
        <span className="feature-icon aqua mb-5"><Target size={24} aria-hidden="true" /></span>
        <h2 className="text-xl font-bold tracking-tight">Dê direção aos seus estudos.</h2>
        <p className="app-text-muted mt-3 text-sm leading-6">Escolha o curso que você quer conquistar e uma pontuação como referência para sua preparação. Você pode ajustar suas metas quando precisar.</p>
      </div>
      </aside>

      {/* Formulário */}
      <form onSubmit={handleSave} className="app-surface app-card overflow-hidden" aria-label="Editar perfil e metas" aria-busy={saving}>
        <div className="space-y-8 p-6 sm:p-8">
        <fieldset className="min-w-0 space-y-5">
          <legend className="section-heading mb-2 text-xl font-bold tracking-tight">Informações pessoais</legend>
          <p className="app-text-muted text-sm leading-6">Como você quer ser chamado durante sua preparação?</p>
        {/* Nome */}
        <div>
          <label htmlFor="pf-name" className="mb-2 block text-sm font-semibold">
            Nome completo
          </label>
          <div className="relative">
            <User size={18} className="app-text-subtle pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              id="pf-name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Seu nome"
              className="app-surface-muted min-h-12 w-full rounded-xl py-3 pl-11 pr-4 text-sm transition-[border-color,box-shadow]"
            />
          </div>
        </div>
        </fieldset>

        <fieldset className="min-w-0 space-y-5 border-t border-[var(--app-border)] pt-6">
          <legend className="section-heading pr-3 text-xl font-bold tracking-tight">Seus objetivos no ENEM</legend>
          <p className="app-text-muted text-sm leading-6">Um objetivo claro para acompanhar cada etapa da sua evolução.</p>
        {/* Curso alvo */}
        <div>
          <label htmlFor="pf-curso" className="mb-2 block text-sm font-semibold">
            Curso alvo
          </label>
          <div className="relative">
            <GraduationCap size={18} className="app-text-subtle pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <select
              id="pf-curso"
              name="cursoAlvo"
              value={form.cursoAlvo}
              onChange={(e) => setForm((f) => ({ ...f, cursoAlvo: e.target.value }))}
              className="app-surface-muted min-h-12 w-full appearance-none rounded-xl py-3 pl-11 pr-10 text-sm transition-[border-color,box-shadow]"
            >
              <option value="">Selecione o curso desejado</option>
              {CURSOS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown size={16} className="app-text-subtle pointer-events-none absolute right-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
          </div>
        </div>

        {/* Meta de pontuação */}
        <div>
          <label htmlFor="pf-meta" className="mb-2 block text-sm font-semibold">
            Meta de pontuação no ENEM
          </label>
          <div className="relative">
            <Target size={18} className="app-text-subtle pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              id="pf-meta"
              name="metaPontuacao"
              type="number"
              inputMode="numeric"
              aria-describedby="pf-meta-hint"
              min={300}
              max={1000}
              value={form.metaPontuacao}
              onChange={(e) => setForm((f) => ({ ...f, metaPontuacao: e.target.value }))}
              placeholder="Ex: 750"
              className="app-surface-muted min-h-12 w-full rounded-xl py-3 pl-11 pr-4 text-sm transition-[border-color,box-shadow]"
            />
          </div>
          <p id="pf-meta-hint" className="app-text-subtle mt-2 text-xs">Entre 300 e 1000 pontos</p>
        </div>
        </fieldset>
        </div>

        {/* Botão salvar */}
        <div className="app-surface-muted space-y-4 border-x-0 border-b-0 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="app-text-muted max-w-xs text-sm leading-6">Salve para manter suas informações e metas atualizadas.</p>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary flex min-h-12 shrink-0 items-center justify-center gap-2 px-6 py-3 text-sm"
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              Salvando…
            </>
          ) : saved ? (
            <>
              <CheckCircle size={18} aria-hidden="true" />
              Salvo!
            </>
          ) : (
            <>
              <Save size={18} aria-hidden="true" />
              Salvar perfil
            </>
          )}
        </button>
        </div>

        {saved && <FeedbackMessage tone="success">Perfil atualizado com sucesso!</FeedbackMessage>}
        </div>
      </form>
      </div>
    </div>
  );
}
