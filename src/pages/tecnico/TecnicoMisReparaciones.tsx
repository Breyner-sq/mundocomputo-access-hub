import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface Reparacion {
  id: string;
  numero_orden: string;
  cliente_id: string;
  marca: string;
  modelo: string;
  descripcion_falla: string;
  estado: string;
  fecha_ingreso: string;
  costo_total: number;
  clientes?: {
    nombre: string;
    telefono: string;
  };
}

const ESTADOS = [
  { value: 'recibido', label: 'Recibido' },
  { value: 'en_diagnostico', label: 'En Diagnóstico' },
  { value: 'esperando_repuestos', label: 'Esperando Repuestos' },
  { value: 'en_reparacion', label: 'En Reparación' },
  { value: 'listo_para_entrega', label: 'Listo para Entrega' },
];

export default function TecnicoMisReparaciones() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [reparaciones, setReparaciones] = useState<Reparacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedReparacion, setSelectedReparacion] = useState<Reparacion | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    if (user) {
      fetchMisReparaciones();
    }
  }, [user]);

  const fetchMisReparaciones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reparaciones')
        .select(`
          *,
          clientes (nombre, telefono)
        `)
        .eq('tecnico_id', user?.id)
        .neq('estado', 'entregado')
        .order('fecha_ingreso', { ascending: false });

      if (error) throw error;
      setReparaciones(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las reparaciones',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = (reparacion: Reparacion) => {
    setSelectedReparacion(reparacion);
    setNuevoEstado(reparacion.estado);
    setNotas('');
    setIsDialogOpen(true);
  };

  const handleSubmitCambioEstado = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReparacion) return;

    try {
      // Actualizar estado de la reparación
      const { error: updateError } = await supabase
        .from('reparaciones')
        .update({ estado: nuevoEstado })
        .eq('id', selectedReparacion.id);

      if (updateError) throw updateError;

      // Registrar cambio en historial
      const { error: historialError } = await supabase
        .from('reparacion_estados')
        .insert([
          {
            reparacion_id: selectedReparacion.id,
            estado_anterior: selectedReparacion.estado,
            estado_nuevo: nuevoEstado,
            notas: notas,
            usuario_id: user?.id,
          },
        ]);

      if (historialError) throw historialError;

      toast({
        title: 'Estado actualizado',
        description: 'El estado de la reparación se actualizó correctamente',
      });

      fetchMisReparaciones();
      setIsDialogOpen(false);
      setSelectedReparacion(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el estado',
      });
    }
  };

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'recibido':
        return 'secondary';
      case 'en_diagnostico':
        return 'default';
      case 'esperando_repuestos':
        return 'outline';
      case 'en_reparacion':
        return 'default';
      case 'listo_para_entrega':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getEstadoLabel = (estado: string) => {
    const estadoObj = ESTADOS.find((e) => e.value === estado);
    return estadoObj ? estadoObj.label : estado;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mis Reparaciones</h2>
          <p className="text-muted-foreground">
            Gestiona las reparaciones asignadas a ti
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reparaciones Asignadas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Cargando...</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Orden</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Dispositivo</TableHead>
                      <TableHead>Falla</TableHead>
                      <TableHead>Fecha Ingreso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reparaciones.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No tienes reparaciones asignadas
                        </TableCell>
                      </TableRow>
                    ) : (
                      reparaciones.map((rep) => (
                        <TableRow key={rep.id}>
                          <TableCell className="font-medium">{rep.numero_orden}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{rep.clientes?.nombre}</div>
                              <div className="text-sm text-muted-foreground">
                                {rep.clientes?.telefono}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {rep.marca} {rep.modelo}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {rep.descripcion_falla}
                          </TableCell>
                          <TableCell>
                            {format(new Date(rep.fecha_ingreso), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getEstadoBadgeVariant(rep.estado)}>
                              {getEstadoLabel(rep.estado)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCambiarEstado(rep)}
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cambiar Estado de Reparación</DialogTitle>
              <DialogDescription>
                Orden: {selectedReparacion?.numero_orden}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitCambioEstado}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="estado">Nuevo Estado *</Label>
                  <Select value={nuevoEstado} onValueChange={setNuevoEstado} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map((estado) => (
                        <SelectItem key={estado.value} value={estado.value}>
                          {estado.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notas">Notas / Actualización</Label>
                  <Textarea
                    id="notas"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    rows={4}
                    placeholder="Agrega detalles sobre el progreso de la reparación..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Actualizar Estado</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
