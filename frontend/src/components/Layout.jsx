import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, BookOpen, FileText, BarChart2, User, BrainCircuit, LogOut, Menu, X, Sparkles, ChevronRight } from 'lucide-react';
import Brand from './Brand.jsx';
import FeedbackMessage from './ui/FeedbackMessage.jsx';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Simulado', to: '/simulado', icon: BookOpen },
  { label: 'Tutor IA', to: '/tutor', icon: BrainCircuit },
  { label: 'Redação', to: '/redacao', icon: FileText },
  { label: 'Histórico', to: '/historico', icon: BarChart2 },
  { label: 'Perfil', to: '/perfil', icon: User },
];

export default function Layout({ children }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const dialogRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (mobileOpen && !dialog.open) dialog.showModal();
    if (!mobileOpen && dialog.open) dialog.close();
  }, [mobileOpen]);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => { if (desktop.matches) setMobileOpen(false); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  function closeMenu() { setMobileOpen(false); }

  async function handleLogout() {
    setLogoutError('');
    setSigningOut(true);
    try {
      await signOut();
      navigate('/');
    } catch {
      setLogoutError('Não foi possível sair. Tente novamente.');
    } finally {
      setSigningOut(false);
    }
  }

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Estudante';
  const userEmail = user?.email || '';
  const pageName = navItems.find(item => item.to === location.pathname)?.label || 'Resultado';

  function sidebar(mobile = false) {
    return (
      <aside className="sidebar" aria-label="Navegação principal">
        <div className="sidebar-brand"><Link to="/dashboard" onClick={closeMenu} aria-label="Minerva, início"><Brand compact /></Link></div>
        {mobile && <button type="button" onClick={closeMenu} className="icon-button absolute right-1 top-1" aria-label="Fechar menu"><X size={20} aria-hidden="true" /></button>}
        <nav className="flex-1 overflow-y-auto px-3" aria-label="Menu de seções">
          <p className="sidebar-label">SEU ESPAÇO DE ESTUDO</p>
          <ul className="space-y-2">
            {navItems.map(({ icon: Icon, ...item }) => (
              <li key={item.to}>
                <Link to={item.to} onClick={closeMenu} className="nav-item" aria-current={location.pathname === item.to ? 'page' : undefined}>
                  <Icon size={19} aria-hidden="true" /><span>{item.label}</span>
                  {location.pathname === item.to && <ChevronRight size={15} className="ml-auto" aria-hidden="true" />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="nav-hint"><Sparkles size={18} className="mb-2" aria-hidden="true" /><strong>Um passo de cada vez.</strong><p>Pratique, revise e encontre seu ritmo.</p></div>
        <div className="sidebar-user">
          <Link to="/perfil" onClick={closeMenu} className="flex items-center gap-3 px-1 py-2 mb-3 rounded-xl">
            <span className="feature-icon !w-10 !h-10 text-sm font-bold" aria-hidden="true">{userName.charAt(0).toUpperCase()}</span>
            <span className="min-w-0"><span className="block text-sm font-semibold truncate">{userName}</span><span className="block text-xs app-text-subtle truncate">{userEmail}</span></span>
          </Link>
          {logoutError && <FeedbackMessage tone="danger">{logoutError}</FeedbackMessage>}
          <button type="button" onClick={handleLogout} disabled={signingOut} className="nav-item w-full" aria-label="Sair da conta">
            <LogOut size={18} aria-hidden="true" /><span>{signingOut ? 'Saindo…' : 'Sair da conta'}</span>
          </button>
        </div>
      </aside>
    );
  }

  return (
    <>
      <a className="skip-link" href="#main-content">Ir para o conteúdo principal</a>
      <div className="app-shell">
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0">{sidebar()}</div>
        <dialog ref={dialogRef} className="mobile-drawer" aria-label="Menu de navegação"
          onCancel={closeMenu} onClose={() => { setMobileOpen(false); menuRef.current?.focus(); }}
          onClick={event => { if (event.target === event.currentTarget) closeMenu(); }}>
          {sidebar(true)}
        </dialog>
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <header className="app-topbar">
            <button ref={menuRef} type="button" onClick={() => setMobileOpen(true)} className="icon-button lg:hidden shrink-0"
              aria-label="Abrir menu de navegação" aria-expanded={mobileOpen} aria-haspopup="dialog"><Menu size={22} aria-hidden="true" /></button>
            <div className="lg:hidden"><Brand compact /></div>
            <div className="hidden lg:flex items-center gap-3 text-xs app-text-muted"><span>Seu espaço</span><ChevronRight size={13} aria-hidden="true" /><span className="font-semibold">{pageName}</span></div>
          </header>
          <main className="app-main animate-fade-in" id="main-content" tabIndex={-1}>{children}</main>
        </div>
      </div>
    </>
  );
}
