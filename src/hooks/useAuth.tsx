import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

type AppRole = 'administrador' | 'tecnico' | 'ventas' | 'inventario';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch role when user logs in
        if (session?.user) {
          setLoading(true); // Mantener loading mientras se obtiene el rol
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      // Verificar si el usuario está activo
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('activo')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      if (!profile?.activo) {
        await supabase.auth.signOut();
        toast({
          title: 'Acceso denegado',
          description: 'Tu cuenta ha sido desactivada. Contacta al administrador.',
          variant: 'destructive',
        });
        setRole(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setRole(data.role as AppRole);
    } catch (error) {
      console.error('Error fetching role:', error);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: 'Inicio de sesión exitoso',
        description: 'Bienvenido a MundoComputo',
      });
    } catch (error: any) {
      toast({
        title: 'Error al iniciar sesión',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Intentar cerrar sesión, pero no fallar si no hay sesión activa
      const { error } = await supabase.auth.signOut();
      
      // Limpiar estado local independientemente de si hay error o no
      setRole(null);
      setUser(null);
      setSession(null);
      navigate('/auth');
      
      // Solo mostrar error si no es por sesión faltante
      if (error && !error.message.includes('session missing')) {
        throw error;
      }
      
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión exitosamente',
      });
    } catch (error: any) {
      // Aún así limpiar el estado y redirigir
      setRole(null);
      setUser(null);
      setSession(null);
      navigate('/auth');
      
      toast({
        title: 'Error al cerrar sesión',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
