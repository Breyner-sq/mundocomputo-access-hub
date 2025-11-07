import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { Clock, FileText, Package, Truck, Download, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCOP } from '@/lib/formatCurrency';

interface Reparacion {
  id: string;
  numero_orden: string;
  cliente_id: string;
  marca: string;
  modelo: string;
  tipo_producto: string;
  numero_serie: string | null;
  descripcion_falla: string;
  estado_fisico: string | null;
  estado: string;
  estado_cotizacion?: string;
  fecha_ingreso: string;
  fecha_entrega: string | null;
  nombre_quien_retira: string | null;
  costo_total: number;
  clientes?: {
    nombre: string;
    telefono: string;
    cedula: string;
    email: string;
  };
}

interface Repuesto {
  id?: string;
  descripcion: string;
  cantidad: number;
  costo: number;
  producto_id?: string | null;
}

const ESTADOS = [
  { value: 'recibido', label: 'Recibido' },
  { value: 'en_diagnostico', label: 'En Diagnóstico' },
  { value: 'esperando_repuestos', label: 'Esperando Repuestos' },
  { value: 'cotizacion_aceptada', label: 'Cotización Aceptada' },
  { value: 'cotizacion_rechazada', label: 'Cotización Rechazada' },
  { value: 'en_reparacion', label: 'En Reparación' },
  { value: 'listo_para_entrega', label: 'Listo para Entrega' },
];

// Validación de transiciones de estado permitidas
const TRANSICIONES_PERMITIDAS: Record<string, string[]> = {
  recibido: ['en_diagnostico'],
  en_diagnostico: ['esperando_repuestos'],
  esperando_repuestos: ['cotizacion_aceptada', 'cotizacion_rechazada'],
  cotizacion_aceptada: ['en_reparacion'],
  cotizacion_rechazada: ['en_diagnostico'], // Permite reiniciar el proceso
  en_reparacion: ['listo_para_entrega'],
  listo_para_entrega: ['entregado'],
};

export default function TecnicoMisReparaciones() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [reparaciones, setReparaciones] = useState<Reparacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDiagnosticoDialogOpen, setIsDiagnosticoDialogOpen] = useState(false);
  const [isEntregarDialogOpen, setIsEntregarDialogOpen] = useState(false);
  const [selectedReparacion, setSelectedReparacion] = useState<Reparacion | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [notas, setNotas] = useState('');
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [nuevoRepuesto, setNuevoRepuesto] = useState<Repuesto>({
    descripcion: '',
    cantidad: 1,
    costo: 0,
  });
  const [nombreQuienRetira, setNombreQuienRetira] = useState('');

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
          clientes (nombre, telefono, cedula, email)
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

    // Validar transición de estado
    const transicionesPermitidas = TRANSICIONES_PERMITIDAS[selectedReparacion.estado] || [];
    if (!transicionesPermitidas.includes(nuevoEstado) && nuevoEstado !== selectedReparacion.estado) {
      toast({
        variant: 'destructive',
        title: 'Transición no permitida',
        description: `No puedes cambiar de "${selectedReparacion.estado}" a "${nuevoEstado}". Debes seguir el orden de estados.`,
      });
      return;
    }

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

  const handleAgregarRepuesto = () => {
    if (!nuevoRepuesto.descripcion || nuevoRepuesto.cantidad <= 0 || nuevoRepuesto.costo <= 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Completa todos los campos del repuesto',
      });
      return;
    }

    setRepuestos([...repuestos, nuevoRepuesto]);
    setNuevoRepuesto({ descripcion: '', cantidad: 1, costo: 0 });
  };

  const handleEliminarRepuesto = (index: number) => {
    setRepuestos(repuestos.filter((_, i) => i !== index));
  };

  const handleFinalizarDiagnostico = async () => {
    if (!selectedReparacion) return;
    if (repuestos.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes agregar al menos un repuesto',
      });
      return;
    }

    try {
      const costoTotal = repuestos.reduce((sum, r) => sum + r.cantidad * r.costo, 0);

      // Actualizar estado y costo total
      const { error: updateError } = await supabase
        .from('reparaciones')
        .update({
          estado: 'esperando_repuestos',
          costo_total: costoTotal,
        })
        .eq('id', selectedReparacion.id);

      if (updateError) throw updateError;

      // Insertar repuestos
      const repuestosData = repuestos.map((r) => ({
        reparacion_id: selectedReparacion.id,
        descripcion: r.descripcion,
        cantidad: r.cantidad,
        costo: r.costo,
      }));

      const { error: repuestosError } = await supabase
        .from('reparacion_repuestos')
        .insert(repuestosData);

      if (repuestosError) throw repuestosError;

      // Registrar cambio de estado
      await supabase.from('reparacion_estados').insert([
        {
          reparacion_id: selectedReparacion.id,
          estado_anterior: 'en_diagnostico',
          estado_nuevo: 'esperando_repuestos',
          notas: 'Diagnóstico finalizado y cotización generada',
          usuario_id: user?.id,
        },
      ]);

      toast({
        title: 'Diagnóstico finalizado',
        description: 'Repuestos registrados y cotización lista',
      });

      // Generar PDF de cotización
      generarCotizacion(selectedReparacion, repuestos, costoTotal);

      fetchMisReparaciones();
      setIsDiagnosticoDialogOpen(false);
      setSelectedReparacion(null);
      setRepuestos([]);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo finalizar el diagnóstico',
      });
    }
  };

  const handleEntregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReparacion || !nombreQuienRetira.trim()) return;

    try {
      const { error } = await supabase
        .from('reparaciones')
        .update({
          estado: 'entregado',
          fecha_entrega: new Date().toISOString(),
          nombre_quien_retira: nombreQuienRetira,
        })
        .eq('id', selectedReparacion.id);

      if (error) throw error;

      // Registrar cambio de estado
      await supabase.from('reparacion_estados').insert([
        {
          reparacion_id: selectedReparacion.id,
          estado_anterior: 'listo_para_entrega',
          estado_nuevo: 'entregado',
          notas: `Entregado a: ${nombreQuienRetira}`,
          usuario_id: user?.id,
        },
      ]);

      toast({
        title: 'Reparación entregada',
        description: 'El comprobante de entrega está listo',
      });

      fetchMisReparaciones();
      setIsEntregarDialogOpen(false);
      setSelectedReparacion(null);
      setNombreQuienRetira('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo registrar la entrega',
      });
    }
  };

  const generarComprobanteIngreso = async (reparacion: Reparacion) => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Comprobante de Ingreso', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Orden: ${reparacion.numero_orden}`, 20, 40);
    doc.text(`Fecha: ${format(new Date(reparacion.fecha_ingreso), 'dd/MM/yyyy HH:mm')}`, 20, 48);

    doc.setFontSize(14);
    doc.text('Datos del Cliente', 20, 65);
    doc.setFontSize(11);
    doc.text(`Nombre: ${reparacion.clientes?.nombre || 'N/A'}`, 20, 73);
    doc.text(`Cédula: ${reparacion.clientes?.cedula || 'N/A'}`, 20, 80);
    doc.text(`Email: ${reparacion.clientes?.email || 'N/A'}`, 20, 87);
    doc.text(`Teléfono: ${reparacion.clientes?.telefono || 'N/A'}`, 20, 94);

    doc.setFontSize(14);
    doc.text('Datos del Dispositivo', 20, 110);
    doc.setFontSize(11);
    doc.text(`Tipo: ${reparacion.tipo_producto}`, 20, 118);
    doc.text(`Marca: ${reparacion.marca}`, 20, 125);
    doc.text(`Modelo: ${reparacion.modelo}`, 20, 132);
    if (reparacion.numero_serie) {
      doc.text(`Nº Serie: ${reparacion.numero_serie}`, 20, 139);
    }

    doc.setFontSize(14);
    doc.text('Descripción de la Falla', 20, 155);
    doc.setFontSize(11);
    const splitFalla = doc.splitTextToSize(reparacion.descripcion_falla, 170);
    doc.text(splitFalla, 20, 163);

    if (reparacion.estado_fisico) {
      doc.setFontSize(14);
      doc.text('Estado Físico', 20, 190);
      doc.setFontSize(11);
      const splitEstado = doc.splitTextToSize(reparacion.estado_fisico, 170);
      doc.text(splitEstado, 20, 198);
    }

    doc.save(`Comprobante-Ingreso-${reparacion.numero_orden}.pdf`);
  };

  const generarCotizacion = async (
    reparacion: Reparacion,
    repuestosLista: Repuesto[],
    costoTotal: number
  ) => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Cotización de Reparación', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Orden: ${reparacion.numero_orden}`, 20, 40);
    doc.text(`Fecha: ${format(new Date(), 'dd/MM/yyyy')}`, 20, 48);

    doc.setFontSize(14);
    doc.text('Cliente', 20, 65);
    doc.setFontSize(11);
    doc.text(`${reparacion.clientes?.nombre || 'N/A'}`, 20, 73);

    doc.setFontSize(14);
    doc.text('Dispositivo', 20, 88);
    doc.setFontSize(11);
    doc.text(`${reparacion.marca} ${reparacion.modelo}`, 20, 96);

    doc.setFontSize(14);
    doc.text('Repuestos Necesarios', 20, 113);

    const tableData = repuestosLista.map((r) => [
      r.descripcion,
      r.cantidad.toString(),
      formatCOP(r.costo),
      formatCOP(r.cantidad * r.costo),
    ]);

    autoTable(doc, {
      startY: 120,
      head: [['Descripción', 'Cantidad', 'Precio Unit.', 'Subtotal']],
      body: tableData,
      theme: 'grid',
    });

    const finalY = (doc as any).lastAutoTable.finalY || 120;
    doc.setFontSize(14);
    doc.text(`Total: ${formatCOP(costoTotal)}`, 20, finalY + 15);

    doc.save(`Cotizacion-${reparacion.numero_orden}.pdf`);
  };

  const descargarCotizacion = async (reparacion: Reparacion) => {
    try {
      const { data: repuestosData, error } = await supabase
        .from('reparacion_repuestos')
        .select('*')
        .eq('reparacion_id', reparacion.id);

      if (error) throw error;

      if (!repuestosData || repuestosData.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No hay cotización disponible',
        });
        return;
      }

      generarCotizacion(reparacion, repuestosData, reparacion.costo_total);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo descargar la cotización',
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
      case 'cotizacion_aceptada':
        return 'default';
      case 'cotizacion_rechazada':
        return 'destructive';
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
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCambiarEstado(rep)}
                                title="Cambiar estado"
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => generarComprobanteIngreso(rep)}
                                title="Descargar comprobante"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {rep.estado === 'en_diagnostico' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedReparacion(rep);
                                    setRepuestos([]);
                                    setIsDiagnosticoDialogOpen(true);
                                  }}
                                  title="Finalizar diagnóstico"
                                >
                                  <Package className="h-4 w-4" />
                                </Button>
                              )}
                              {(rep.estado === 'esperando_repuestos' ||
                                rep.estado === 'en_reparacion') && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => descargarCotizacion(rep)}
                                  title="Descargar cotización"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              )}
                              {rep.estado === 'listo_para_entrega' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => descargarCotizacion(rep)}
                                    title="Descargar cotización"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedReparacion(rep);
                                      setNombreQuienRetira('');
                                      setIsEntregarDialogOpen(true);
                                    }}
                                    title="Entregar"
                                  >
                                    <Truck className="h-4 w-4" />
                                  </Button>
                                </>
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
                      {ESTADOS.filter((estado) => {
                        // Mostrar el estado actual y los estados permitidos para la transición
                        const estadosPermitidos = TRANSICIONES_PERMITIDAS[selectedReparacion?.estado || ''] || [];
                        return estado.value === selectedReparacion?.estado || estadosPermitidos.includes(estado.value);
                      }).map((estado) => (
                        <SelectItem key={estado.value} value={estado.value}>
                          {estado.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedReparacion && (
                    <p className="text-xs text-muted-foreground">
                      Estado actual: {getEstadoLabel(selectedReparacion.estado)}
                    </p>
                  )}
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

        <Dialog open={isDiagnosticoDialogOpen} onOpenChange={setIsDiagnosticoDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Finalizar Diagnóstico</DialogTitle>
              <DialogDescription>
                Orden: {selectedReparacion?.numero_orden} - Agrega los repuestos necesarios
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="descripcion">Descripción del Repuesto</Label>
                  <Input
                    id="descripcion"
                    value={nuevoRepuesto.descripcion}
                    onChange={(e) =>
                      setNuevoRepuesto({ ...nuevoRepuesto, descripcion: e.target.value })
                    }
                    placeholder="Ej: Pantalla LCD"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cantidad">Cantidad</Label>
                  <Input
                    id="cantidad"
                    type="number"
                    min="1"
                    value={nuevoRepuesto.cantidad}
                    onChange={(e) =>
                      setNuevoRepuesto({ ...nuevoRepuesto, cantidad: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costo">Costo</Label>
                  <Input
                    id="costo"
                    type="number"
                    min="0"
                    step="0.01"
                    value={nuevoRepuesto.costo}
                    onChange={(e) =>
                      setNuevoRepuesto({ ...nuevoRepuesto, costo: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
              <Button type="button" variant="outline" onClick={handleAgregarRepuesto} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Repuesto
              </Button>

              {repuestos.length > 0 && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Costo Unit.</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead className="text-right">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {repuestos.map((rep, index) => (
                        <TableRow key={index}>
                          <TableCell>{rep.descripcion}</TableCell>
                          <TableCell>{rep.cantidad}</TableCell>
                          <TableCell>{formatCOP(rep.costo)}</TableCell>
                          <TableCell>{formatCOP(rep.cantidad * rep.costo)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEliminarRepuesto(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-bold">
                          Total:
                        </TableCell>
                        <TableCell className="font-bold">
                          {formatCOP(repuestos.reduce((sum, r) => sum + r.cantidad * r.costo, 0))}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDiagnosticoDialogOpen(false);
                  setRepuestos([]);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleFinalizarDiagnostico}>
                Finalizar Diagnóstico y Generar Cotización
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEntregarDialogOpen} onOpenChange={setIsEntregarDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Entregar Reparación</DialogTitle>
              <DialogDescription>
                Orden: {selectedReparacion?.numero_orden}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEntregar}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Fecha y Hora de Entrega</Label>
                  <Input value={format(new Date(), 'dd/MM/yyyy HH:mm')} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nombre_quien_retira">Persona que Retira *</Label>
                  <Input
                    id="nombre_quien_retira"
                    value={nombreQuienRetira}
                    onChange={(e) => setNombreQuienRetira(e.target.value)}
                    placeholder="Nombre completo"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEntregarDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Registrar Entrega</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
