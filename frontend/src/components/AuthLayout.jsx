import React from 'react';
import { BookOpen, Target, FilePenLine, ArrowUpRight } from 'lucide-react';
import Brand from './Brand.jsx';

const resources = [
  { icon: BookOpen, title: '1.553 questões de provas oficiais', text: 'Acervo de 2015 a 2023 para estudar com questões reais do ENEM.' },
  { icon: Target, title: 'Simulados diagnósticos', text: 'Pratique por área e entenda o que merece sua atenção.', aqua: true },
  { icon: FilePenLine, title: 'Laboratório de redação', text: 'Feedback por competência para aprimorar cada novo texto.' },
];

export default function AuthLayout({ children, compact = false }) {
  return (
    <div className={`auth-page ${compact ? 'auth-page-compact' : ''}`}>
      <a className="skip-link" href="#auth-form">Ir para o formulário</a>
      <header className="auth-topbar"><Brand /><span className="auth-topnote">PREPARAÇÃO PARA O ENEM</span></header>
      <main className="auth-grid">
        <section className="auth-intro" aria-label="Conheça a Minerva">
          <p className="eyebrow"><span className="status-dot" /> Aprendizado com direção</p>
          <h1>Estude com direção.<br /><span>Chegue mais preparado.</span></h1>
          <p className="auth-description">Um espaço para praticar, entender seus erros e evoluir com consistência, no seu ritmo e com apoio inteligente.</p>
          <div className="auth-resources">
            {resources.map(({ icon: Icon, title, text, aqua }) => (
              <div className="auth-resource" key={title}>
                <span className={`feature-icon ${aqua ? 'aqua' : ''}`}><Icon size={21} aria-hidden="true" /></span>
                <div><h2>{title}</h2><p>{text}</p></div>
                <ArrowUpRight size={16} className="resource-arrow" aria-hidden="true" />
              </div>
            ))}
          </div>
        </section>
        <section id="auth-form" tabIndex={-1} className="auth-panel app-surface" aria-label="Acesso à conta">
          <p className="eyebrow">Acesso do estudante</p>
          {children}
        </section>
      </main>
      <footer className="auth-footer">Minerva ENEM <span>Conhecimento que se transforma em progresso.</span></footer>
    </div>
  );
}
