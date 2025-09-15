import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { session, loading } = useAuth();

  // O console.log que já tínhamos
  console.log("ProtectedRoute - Recebendo sessão:", session, "Carregando:", loading);

  if (loading) {
    return <div>Carregando sessão...</div>;
  }

  // A lógica de verificação
  if (!session) {
    // ADICIONADO: Este é o log de alerta. Ele SÓ deve aparecer se a sessão for nula.
    console.error("PROTECTED ROUTE: Sessão é NULA ou INVÁLIDA! Redirecionando para /login...");
    return <Navigate to="/login" />;
  }

  // Se a sessão for válida, ele deve apenas renderizar os filhos
  return children;
};

export default ProtectedRoute;