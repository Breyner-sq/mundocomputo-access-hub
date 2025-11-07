import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Search, Plus, FileText, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';
import { formatCOP } from '@/lib/formatCurrency';
import { format } from 'date-fns';

interface Reparacion {
  id: string;
  numero_orden: string;
  cliente_id: string;
  tecnico_id: string | null;
  marca: string;
  modelo: string;
  numero_serie: string | null;
  tipo_producto: string;
  descripcion_falla: string;
  estado_fisico: string | null;
  estado: string;
  fecha_ingreso: string;
  fecha_finalizacion: string | null;
  costo_total: number;
  clientes?: {
    nombre: string;
    cedula: string;
    email: string;
    telefono: string;
  };
  profiles?: {
    nombre_completo: string;
  };
}

interface Cliente {
  id: string;
  nombre: string;
  cedula: string;
  email: string;
}

interface Tecnico {
  id: string;
  nombre_completo: string;
}

export default function TecnicoReparaciones() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [reparaciones, setReparaciones] = useState<Reparacion[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFinalizarDialogOpen, setIsFinalizarDialogOpen] = useState(false);
  const [selectedReparacion, setSelectedReparacion] = useState<Reparacion | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    cliente_id: '',
    tecnico_id: '',
    marca: '',
    modelo: '',
    numero_serie: '',
    tipo_producto: '',
    descripcion_falla: '',
    estado_fisico: '',
  });

  const [finalizarData, setFinalizarData] = useState({
    nombre_quien_retira: '',
  });

  useEffect(() => {
    fetchReparaciones();
    fetchClientes();
    fetchTecnicos();
  }, []);

  const fetchReparaciones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reparaciones')
        .select(`
          *,
          clientes (nombre, cedula, email, telefono),
          profiles (nombre_completo)
        `)
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

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nombre, cedula, email')
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      setClientes(data || []);
    } catch (error: any) {
      console.error('Error fetching clientes:', error);
    }
  };

  const fetchTecnicos = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          nombre_completo,
          user_roles!inner (role)
        `)
        .eq('user_roles.role', 'tecnico')
        .eq('activo', true);

      if (error) throw error;
      setTecnicos(data || []);
    } catch (error: any) {
      console.error('Error fetching tecnicos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('reparaciones').insert([
        {
          ...formData,
          estado: 'recibido',
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Reparación registrada',
        description: 'La reparación se registró correctamente',
      });

      fetchReparaciones();
      handleCloseDialog();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Ocurrió un error al registrar la reparación',
      });
    }
  };

  const handleFinalizar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReparacion) return;

    try {
      const { error } = await supabase
        .from('reparaciones')
        .update({
          estado: 'entregado',
          fecha_finalizacion: new Date().toISOString(),
          fecha_entrega: new Date().toISOString(),
          nombre_quien_retira: finalizarData.nombre_quien_retira,
        })
        .eq('id', selectedReparacion.id);

      if (error) throw error;

      // Registrar cambio de estado
      await supabase.from('reparacion_estados').insert([
        {
          reparacion_id: selectedReparacion.id,
          estado_anterior: selectedReparacion.estado,
          estado_nuevo: 'entregado',
          usuario_id: user?.id,
          notas: `Entregado a: ${finalizarData.nombre_quien_retira}`,
        },
      ]);

      toast({
        title: 'Reparación finalizada',
        description: 'La reparación se finalizó y entregó correctamente',
      });

      fetchReparaciones();
      setIsFinalizarDialogOpen(false);
      setSelectedReparacion(null);
      setFinalizarData({ nombre_quien_retira: '' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo finalizar la reparación',
      });
    }
  };

  const generarComprobante = (reparacion: Reparacion) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text('Comprobante de Ingreso', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Orden: ${reparacion.numero_orden}`, 20, 40);
    doc.text(`Fecha: ${format(new Date(reparacion.fecha_ingreso), 'dd/MM/yyyy HH:mm')}`, 20, 48);

    // Cliente
    doc.setFontSize(14);
    doc.text('Datos del Cliente', 20, 65);
    doc.setFontSize(11);
    doc.text(`Nombre: ${reparacion.clientes?.nombre || 'N/A'}`, 20, 73);
    doc.text(`Cédula: ${reparacion.clientes?.cedula || 'N/A'}`, 20, 80);
    doc.text(`Email: ${reparacion.clientes?.email || 'N/A'}`, 20, 87);
    doc.text(`Teléfono: ${reparacion.clientes?.telefono || 'N/A'}`, 20, 94);

    // Dispositivo
    doc.setFontSize(14);
    doc.text('Datos del Dispositivo', 20, 110);
    doc.setFontSize(11);
    doc.text(`Tipo: ${reparacion.tipo_producto}`, 20, 118);
    doc.text(`Marca: ${reparacion.marca}`, 20, 125);
    doc.text(`Modelo: ${reparacion.modelo}`, 20, 132);
    if (reparacion.numero_serie) {
      doc.text(`Nº Serie: ${reparacion.numero_serie}`, 20, 139);
    }

    // Descripción
    doc.setFontSize(14);
    doc.text('Descripción de la Falla', 20, 155);
    doc.setFontSize(11);
    const splitFalla = doc.splitTextToSize(reparacion.descripcion_falla, 170);
    doc.text(splitFalla, 20, 163);

    // Estado físico
    if (reparacion.estado_fisico) {
      doc.setFontSize(14);
      doc.text('Estado Físico', 20, 190);
      doc.setFontSize(11);
      const splitEstado = doc.splitTextToSize(reparacion.estado_fisico, 170);
      doc.text(splitEstado, 20, 198);
    }

    // Footer
    doc.setFontSize(10);
    doc.text('Estado: Recibido', 20, 250);
    if (reparacion.profiles?.nombre_completo) {
      doc.text(`Técnico asignado: ${reparacion.profiles.nombre_completo}`, 20, 257);
    }

    doc.save(`Comprobante-${reparacion.numero_orden}.pdf`);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData({
      cliente_id: '',
      tecnico_id: '',
      marca: '',
      modelo: '',
      numero_serie: '',
      tipo_producto: '',
      descripcion_falla: '',
      estado_fisico: '',
    });
  };

  const filteredReparaciones = reparaciones.filter((rep) => {
    const matchesSearch =
      rep.numero_orden.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.clientes?.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.clientes?.cedula.includes(searchQuery);

    return matchesSearch;
  });

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
      case 'entregado':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      recibido: 'Recibido',
      en_diagnostico: 'En Diagnóstico',
      esperando_repuestos: 'Esperando Repuestos',
      en_reparacion: 'En Reparación',
      listo_para_entrega: 'Listo para Entrega',
      entregado: 'Entregado',
    };
    return labels[estado] || estado;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Reparaciones</h2>
            <p className="text-muted-foreground">Gestiona todas las reparaciones de la tienda</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Reparación
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reparaciones Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por orden, cliente o cédula..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

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
                      <TableHead>Fecha Ingreso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Técnico</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReparaciones.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No se encontraron reparaciones
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReparaciones.map((rep) => (
                        <TableRow key={rep.id}>
                          <TableCell className="font-medium">{rep.numero_orden}</TableCell>
                          <TableCell>{rep.clientes?.nombre || 'N/A'}</TableCell>
                          <TableCell>
                            {rep.marca} {rep.modelo}
                          </TableCell>
                          <TableCell>
                            {format(new Date(rep.fecha_ingreso), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getEstadoBadgeVariant(rep.estado)}>
                              {getEstadoLabel(rep.estado)}
                            </Badge>
                          </TableCell>
                          <TableCell>{rep.profiles?.nombre_completo || 'Sin asignar'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => generarComprobante(rep)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              {rep.estado === 'listo_para_entrega' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedReparacion(rep);
                                    setIsFinalizarDialogOpen(true);
                                  }}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Reparación</DialogTitle>
              <DialogDescription>
                Registra los datos de la reparación
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cliente_id">Cliente *</Label>
                    <Select
                      value={formData.cliente_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, cliente_id: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.nombre} - {cliente.cedula}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tecnico_id">Técnico Asignado</Label>
                    <Select
                      value={formData.tecnico_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, tecnico_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin asignar" />
                      </SelectTrigger>
                      <SelectContent>
                        {tecnicos.map((tecnico) => (
                          <SelectItem key={tecnico.id} value={tecnico.id}>
                            {tecnico.nombre_completo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo_producto">Tipo de Producto *</Label>
                    <Input
                      id="tipo_producto"
                      value={formData.tipo_producto}
                      onChange={(e) =>
                        setFormData({ ...formData, tipo_producto: e.target.value })
                      }
                      placeholder="Ej: Laptop, Celular, Tablet"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marca">Marca *</Label>
                    <Input
                      id="marca"
                      value={formData.marca}
                      onChange={(e) =>
                        setFormData({ ...formData, marca: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="modelo">Modelo *</Label>
                    <Input
                      id="modelo"
                      value={formData.modelo}
                      onChange={(e) =>
                        setFormData({ ...formData, modelo: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero_serie">Número de Serie</Label>
                    <Input
                      id="numero_serie"
                      value={formData.numero_serie}
                      onChange={(e) =>
                        setFormData({ ...formData, numero_serie: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion_falla">Descripción de la Falla *</Label>
                  <Textarea
                    id="descripcion_falla"
                    value={formData.descripcion_falla}
                    onChange={(e) =>
                      setFormData({ ...formData, descripcion_falla: e.target.value })
                    }
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado_fisico">Estado Físico al Ingreso</Label>
                  <Textarea
                    id="estado_fisico"
                    value={formData.estado_fisico}
                    onChange={(e) =>
                      setFormData({ ...formData, estado_fisico: e.target.value })
                    }
                    rows={3}
                    placeholder="Describe el estado físico del dispositivo"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit">Registrar Reparación</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isFinalizarDialogOpen} onOpenChange={setIsFinalizarDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Finalizar Reparación</DialogTitle>
              <DialogDescription>
                Ingresa los datos de entrega
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFinalizar}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre_quien_retira">Nombre de quien retira *</Label>
                  <Input
                    id="nombre_quien_retira"
                    value={finalizarData.nombre_quien_retira}
                    onChange={(e) =>
                      setFinalizarData({ ...finalizarData, nombre_quien_retira: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFinalizarDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Finalizar y Entregar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
