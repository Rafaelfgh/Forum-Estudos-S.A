import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../backend/supabaseClient'    ;
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true); // Começa como true
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false); // Fica false APÓS a verificação
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (event === 'SIGNED_OUT') {
          navigate('/');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const value = {
    session,
    user: session?.user || null,
    loading, // O estado de loading é passado para os componentes
  };

  // O AuthProvider agora SEMPRE renderiza os filhos.
  // A responsabilidade de mostrar um 'loading' passa para os componentes que o consomem.
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}