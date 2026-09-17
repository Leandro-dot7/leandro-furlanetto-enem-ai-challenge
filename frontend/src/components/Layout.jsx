/**
 * Layout.jsx — Shell principal da aplicação (Sidebar + conteúdo)
 * Usado em todas as páginas protegidas.
 * Responsivo: sidebar colapsável em mobile.
 * Acessibilidade: landmarks ARIA, foco gerenciado.
 */
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  BarChart2,
  User,
  BrainCircuit,
  LogOut,
  Menu,
  X,
  GraduationCap,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Simulado', to: '/simulado', icon: BookOpen },
  { label: 'Tutor IA', to: '/tutor', icon: BrainCircuit },
  { label: 'Redação', to: '/redacao', icon: FileText },
  { label: 'Histórico', to: '/historico', icon: BarChart2 },
  { label: 'Perfil', to: '/perfil', icon: User },
];

function NavItem({ item, isActive, onClick }) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        to={item.to}
        onClick={onClick}
        aria-current={isActive ? 'page' : undefined}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400
          ${isActive
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
          }`}
      >
        <Icon size={18} aria-hidden="true" />
        <span>{item.label}</span>
      </Link>
    </li>
  );
}

export default function Layout({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Estudante';
  const userEmail = user?.email || '';

  const sidebar = (
    <aside
      className="flex flex-col h-full bg-slate-900 text-white"
      aria-label="Navegação principal"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-700/50">
        <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 rounded-lg">
          <GraduationCap size={18} className="text-white" aria-hidden="true" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight">Minerva</span>
        <span className="text-xs text-slate-400 font-medium mt-0.5">ENEM</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Menu de seções">
        <ul className="space-y-1" role="list">
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              item={item}
              isActive={location.pathname === item.to}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </ul>
      </nav>

      {/* Usuário + Logout */}
      <div className="px-3 py-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500 text-white text-xs font-bold flex-shrink-0"
            aria-hidden="true"
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-slate-400 truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          aria-label="Sair da conta"
        >
          <LogOut size={18} aria-hidden="true" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar Desktop */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:flex-shrink-0 shadow-xl">
        {sidebar}
      </div>

      {/* Overlay Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
      >
        {sidebar}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
          aria-label="Fechar menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Área principal */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header mobile */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-slate-600 hover:text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg p-1"
            aria-label="Abrir menu de navegação"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <GraduationCap size={18} className="text-indigo-600" aria-hidden="true" />
            <span className="font-bold text-slate-900">Minerva ENEM</span>
          </div>
        </header>

        {/* Conteúdo */}
        <main
          className="flex-1 overflow-y-auto p-4 lg:p-8 animate-fade-in"
          id="main-content"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
