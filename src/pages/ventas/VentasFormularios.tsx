import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Mail, Phone, Calendar, Eye, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface Formulario {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  mensaje: string;
  estado: string;
  created_at: string;
  atendido_por: string | null;
  notas_internas: string | null;
}

export default function VentasFormularios() {
  const { toast } = useToast();
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFormulario, setSelectedFormulario] = useState<Formulario | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notasInternas, setNotasInternas] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchFormularios();
  }, [search]);

  const fetchFormularios = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('formularios_contacto')
        .select('*')
        .order('created_at', { ascending: false });

      if (search.trim()) {
        query = query.or(`nombre.ilike.%${search}%,email.ilike.%${search}%,mensaje.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFormularios(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los formularios',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalles = (formulario: Formulario) => {
    setSelectedFormulario(formulario);
    setNotasInternas(formulario.notas_internas || '');
    setIsDialogOpen(true);
  };

  const handleMarcarAtendido = async () => {
    if (!selectedFormulario) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('formularios_contacto')
        .update({
          estado: 'atendido',
          atendido_por: user?.id,
          notas_internas: notasInternas,
        })
        .eq('id', selectedFormulario.id);

      if (error) throw error;

      toast({
        title: 'Formulario actualizado',
        description: 'El formulario ha sido marcado como atendido',
      });

      fetchFormularios();
      setIsDialogOpen(false);
      setSelectedFormulario(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el formulario',
      });
    }
  };

  const getEstadoBadge = (estado: string) => {
    if (estado === 'nuevo') {
      return <Badge variant="default">Nuevo</Badge>;
    } else if (estado === 'atendido') {
      return <Badge variant="secondary">Atendido</Badge>;
    }
    return <Badge variant="outline">{estado}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Formularios de Contacto</h2>
          <p className="text-muted-foreground">Gestiona las solicitudes de contacto de clientes</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Buscar Formularios</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Buscar por nombre, email o mensaje..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Formularios</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-4">Cargando formularios...</p>
            ) : formularios.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">No hay formularios</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formularios.map((formulario) => (
                      <TableRow key={formulario.id}>
                        <TableCell>
                          {format(new Date(formulario.created_at), 'dd/MM/yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="font-medium">{formulario.nombre}</TableCell>
                        <TableCell>{formulario.email}</TableCell>
                        <TableCell>{formulario.telefono || '-'}</TableCell>
                        <TableCell>{getEstadoBadge(formulario.estado)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerDetalles(formulario)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog para ver detalles */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles del Formulario</DialogTitle>
              <DialogDescription>
                Revisa la información del formulario y marca como atendido
              </DialogDescription>
            </DialogHeader>

            {selectedFormulario && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                    <p className="font-medium">{selectedFormulario.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Estado</p>
                    {getEstadoBadge(selectedFormulario.estado)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </p>
                    <p>{selectedFormulario.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Teléfono
                    </p>
                    <p>{selectedFormulario.telefono || 'No proporcionado'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha de Envío
                    </p>
                    <p>{format(new Date(selectedFormulario.created_at), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Mensaje</p>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedFormulario.mensaje}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Notas Internas</p>
                  <Textarea
                    placeholder="Agrega notas sobre el seguimiento de este formulario..."
                    value={notasInternas}
                    onChange={(e) => setNotasInternas(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cerrar
              </Button>
              {selectedFormulario?.estado === 'nuevo' && (
                <Button onClick={handleMarcarAtendido}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar como Atendido
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
