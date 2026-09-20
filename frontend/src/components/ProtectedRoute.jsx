import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p role="status" aria-live="polite" className="app-text-muted p-8">Carregando sessão…</p>;
  return user ? children : <Navigate to="/" replace />;
}
