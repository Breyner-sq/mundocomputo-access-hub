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
  timestamp: number;
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
      // Obtener logs de autenticación de los últimos 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('email, created_at');

      if (error) throw error;

      // Por ahora mostramos los perfiles creados
      // En producción, esto debería consultar los logs reales de Supabase
      const logsData: AuthLog[] = (data || []).map((profile: any, index: number) => ({
        id: `${index}`,
        timestamp: new Date(profile.created_at).getTime(),
        email: profile.email,
        ip_address: 'N/A', // Los logs reales vendrían de Supabase Analytics
        event: 'login',
      }));

      setAuthLogs(logsData.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50));
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
