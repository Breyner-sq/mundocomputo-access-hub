import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function RoleRedirect() {
  const { role, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      // Si no está autenticado, redirigir al login
      if (!isAuthenticated) {
        navigate('/auth', { replace: true });
        return;
      }

      // Si está autenticado pero no hay rol (por si acaso)
      if (!role) {
        navigate('/auth', { replace: true });
        return;
      }

      // Redirigir según el rol
      switch (role) {
        case 'administrador':
          navigate('/admin', { replace: true });
          break;
        case 'tecnico':
          navigate('/tecnico', { replace: true });
          break;
        case 'ventas':
          navigate('/ventas', { replace: true });
          break;
        case 'inventario':
          navigate('/inventario', { replace: true });
          break;
        default:
          navigate('/unauthorized', { replace: true });
      }
    }
  }, [role, loading, isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}