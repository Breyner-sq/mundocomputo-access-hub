import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';

interface AuthLog {
  id: string;
  event_message: string;
  level: string;
  msg: string;
  path: string | null;
  status: string | null;
  timestamp: number;
}

export default function AuthLogs() {
  const [logs, setLogs] = useState<AuthLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuthLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchAuthLogs();
  }, []);

  const fetchAuthLogs = async () => {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: 'Error',
          description: 'No hay sesión activa',
          variant: 'destructive',
        });
        return;
      }

      // Call edge function to get auth logs
      const { data, error } = await supabase.functions.invoke('get-auth-logs', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error fetching auth logs:', error);
        toast({
          title: 'Información',
          description: 'No se pudieron cargar los logs de autentificación',
          variant: 'default',
        });
        setLogs([]);
        setFilteredLogs([]);
        return;
      }

      // Parse event_message to extract useful information
      const parsedLogs = (data || []).map((log: any) => {
        try {
          const eventData = typeof log.event_message === 'string' 
            ? JSON.parse(log.event_message) 
            : log.event_message;
            
          return {
            id: log.id,
            timestamp: log.timestamp,
            level: log.level || eventData.level || 'info',
            msg: log.msg || eventData.msg || eventData.message || '',
            path: log.path || eventData.path || null,
            status: log.status || eventData.status?.toString() || null,
            email: eventData.actor_username || eventData.auth_event?.actor_username || '',
            remote_addr: eventData.remote_addr || '',
            method: eventData.method || '',
            event_message: log.event_message,
          };
        } catch (e) {
          return {
            id: log.id,
            timestamp: log.timestamp,
            level: log.level || 'info',
            msg: log.msg || '',
            path: log.path || null,
            status: log.status || null,
            email: '',
            remote_addr: '',
            method: '',
            event_message: log.event_message,
          };
        }
      });

      setLogs(parsedLogs);
      setFilteredLogs(parsedLogs);
      
      if (parsedLogs.length > 0) {
        toast({
          title: 'Logs cargados',
          description: `Se cargaron ${parsedLogs.length} registros`,
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Error al procesar los logs',
        variant: 'destructive',
      });
      setLogs([]);
      setFilteredLogs([]);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredLogs(logs);
    } else {
      const filtered = logs.filter((log: any) =>
        log.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.remote_addr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.msg?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLogs(filtered);
    }
  }, [searchQuery, logs]);

  const formatTimestamp = (timestamp: number) => {
    try {
      // Convert microseconds to milliseconds
      const date = new Date(timestamp / 1000);
      return format(date, 'dd/MM/yyyy HH:mm:ss');
    } catch {
      return '-';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Registros de Autentificación</h2>
            <p className="text-muted-foreground">Monitorea los eventos de autentificación del sistema</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <FileText className="inline mr-2 h-5 w-5" />
              Logs de Autentificación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Buscar por correo, IP o mensaje..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Correo</TableHead>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>Dirección IP</TableHead>
                    <TableHead>Mensaje</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        {searchQuery ? 'No se encontraron logs' : 'No hay logs de autentificación'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {log.email || '-'}
                        </TableCell>
                        <TableCell>
                          {formatTimestamp(log.timestamp)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.remote_addr || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                          {log.msg || '-'}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            log.status === '200' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                            log.status === '400' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
                            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}>
                            {log.status || log.level || '-'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
