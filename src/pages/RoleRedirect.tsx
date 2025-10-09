import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function RoleRedirect() {
  const { role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && role) {
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
  }, [role, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
}