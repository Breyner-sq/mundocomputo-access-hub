import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutos en milisegundos

export function useIdleTimer() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    warningShownRef.current = false;

    timeoutRef.current = setTimeout(async () => {
      if (user && !warningShownRef.current) {
        warningShownRef.current = true;
        
        toast({
          title: 'Sesión cerrada por inactividad',
          description: 'Tu sesión se ha cerrado después de 10 minutos de inactividad',
          variant: 'destructive',
        });

        await signOut();
      }
    }, IDLE_TIMEOUT);
  };

  useEffect(() => {
    if (!user) return;

    // Eventos que indican actividad del usuario
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Resetear el timer en cada evento
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    // Iniciar el timer
    resetTimer();

    // Limpiar al desmontar
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [user]);

  return null;
}
