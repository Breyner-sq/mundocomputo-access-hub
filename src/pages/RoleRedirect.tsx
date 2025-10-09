import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function RoleRedirect() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      // Si no hay usuario autenticado, redirigir al login
      if (!user) {
        navigate('/auth', { replace: true });
        return;
      }

      // Si hay usuario pero no hay rol, redirigir al login
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
          navigate('/auth', { replace: true });
      }
    }
  }, [user, role, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}