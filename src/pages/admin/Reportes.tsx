import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AuthLog {
  id: string;
  timestamp: string;
  email: string;
  ip_address: string;
  event: string;
}

export default function Reportes() {
  const [authLogs, setAuthLogs] = useState<AuthLog[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAuthLogs();
  }, []);

  const fetchAuthLogs = async () => {
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Error',
          description: 'No hay sesión activa',
          variant: 'destructive',
        });
        return;
      }

      // Llamar a la función de Supabase para obtener logs de autenticación
      const response = await fetch(
        `https://twaqppiracythbmwyjnn.supabase.co/rest/v1/rpc/get_auth_logs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3YXFwcGlyYWN5dGhibXd5am5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MjkzNTAsImV4cCI6MjA3NTEwNTM1MH0.-Cv4lYJDqENRrtdr2z6KmMUfPy8QPJTr6pZXGY0NxRE',
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      const logsData = await response.json();
      
      // Parsear los logs de autenticación
      const logsArray = Array.isArray(logsData) ? logsData : [];
      const parsedLogs: AuthLog[] = logsArray
        .filter((log: any) => log.event_message && (log.msg === 'Login' || log.event_message.includes('login')))
        .map((log: any, index: number) => {
          let email = 'N/A';
          let ipAddress = 'N/A';
          
          try {
            const message = JSON.parse(log.event_message);
            email = message.actor_username || message.user_id || 'N/A';
            ipAddress = message.remote_addr || 'N/A';
          } catch (e) {
            console.error('Error parsing log:', e);
          }

          return {
            id: log.id || `${index}`,
            timestamp: new Date((log.timestamp / 1000) || Date.now()).toISOString(),
            email,
            ip_address: ipAddress,
            event: 'login',
          };
        })
        .sort((a: AuthLog, b: AuthLog) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 100);

      setAuthLogs(parsedLogs);
    } catch (error) {
      console.error('Error fetching auth logs:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los logs de autenticación',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Reportes</h2>
            <p className="text-muted-foreground">Actividad de usuarios y logs del sistema</p>
          </div>
          <Button onClick={fetchAuthLogs} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Historial de Inicio de Sesión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Dirección IP</TableHead>
                  <TableHead>Evento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {authLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {loading ? 'Cargando...' : 'No hay registros de inicio de sesión'}
                    </TableCell>
                  </TableRow>
                ) : (
                  authLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.email}</TableCell>
                      <TableCell>
                        {format(new Date(log.timestamp), 'dd/MM/yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(log.timestamp), 'HH:mm:ss', { locale: es })}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{log.ip_address}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
                          {log.event}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> Los logs de autenticación mostrados son una representación básica.
              Para obtener logs completos con direcciones IP reales, debe consultar los logs de Supabase Analytics
              directamente desde el panel de Supabase.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
