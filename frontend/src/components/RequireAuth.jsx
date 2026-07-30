import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <p className="text-slate-500 p-4">Carregando...</p>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
