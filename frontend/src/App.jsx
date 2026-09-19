import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import './App.css';

import Login from './Login.jsx';
import Cadastro from './Cadastro.jsx';
import Dashboard from './Dashboard.jsx';
import Simulado from './Simulado.jsx';
import Resultado from './Resultado.jsx';
import Historico from './Historico.jsx';
import TutorIA from './TutorAI.jsx';
import Redacao from './Redacao.jsx';
import Perfil from './Perfil.jsx';
import RecuperarSenha from './RecuperarSenha.jsx';
import RedefinirSenha from './RedefinirSenha.jsx';

/** Wrapper: envolve páginas protegidas com Layout + ProtectedRoute */
function PrivatePage({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Páginas públicas */}
          <Route path="/" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />

          {/* Páginas protegidas — envolvidas no Layout */}
          <Route path="/dashboard" element={<PrivatePage><Dashboard /></PrivatePage>} />
          <Route path="/simulado" element={<PrivatePage><Simulado /></PrivatePage>} />
          <Route path="/resultado" element={<PrivatePage><Resultado /></PrivatePage>} />
          <Route path="/historico" element={<PrivatePage><Historico /></PrivatePage>} />
          <Route path="/tutor" element={<PrivatePage><TutorIA /></PrivatePage>} />
          <Route path="/redacao" element={<PrivatePage><Redacao /></PrivatePage>} />
          <Route path="/perfil" element={<PrivatePage><Perfil /></PrivatePage>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
