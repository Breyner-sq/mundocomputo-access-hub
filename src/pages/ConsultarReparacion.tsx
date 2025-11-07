import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Download, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCOP } from '@/lib/formatCurrency';
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

interface Reparacion {
  id: string;
  numero_orden: string;
  marca: string;
  modelo: string;
  tipo_producto: string;
  descripcion_falla: string;
  estado: string;
  estado_cotizacion: string;
  fecha_ingreso: string;
  costo_total: number;
  pagado: boolean;
  clientes?: {
    nombre: string;
    cedula: string;
    telefono: string;
    email: string;
  };
}

interface Repuesto {
  descripcion: string;
  cantidad: number;
  costo: number;
}

const ESTADOS_LABELS: Record<string, string> = {
  recibido: 'Recibido',
  en_diagnostico: 'En Diagnóstico',
  cotizacion_hecha: 'Cotización Lista',
  cotizacion_aceptada: 'Cotización Aceptada',
  cotizacion_rechazada: 'Cotización Rechazada',
  esperando_repuestos: 'Esperando Repuestos',
  en_reparacion: 'En Reparación',
  listo_para_entrega: 'Listo para Entrega',
  entregado: 'Entregado',
};

export default function ConsultarReparacion() {
  const { toast } = useToast();
  const [numeroOrden, setNumeroOrden] = useState('');
  const [reparacion, setReparacion] = useState<Reparacion | null>(null);
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [notaEstadoActual, setNotaEstadoActual] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [accionCotizacion, setAccionCotizacion] = useState<'aceptar' | 'rechazar' | null>(null);
  const [metodoPago, setMetodoPago] = useState('');
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [datosTarjeta, setDatosTarjeta] = useState({
    numero: '',
    nombre: '',
    vencimiento: '',
    cvv: '',
  });

  const buscarReparacion = async () => {
    if (!numeroOrden.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Ingresa un número de orden',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: reparacionData, error: reparacionError } = await supabase
        .from('reparaciones')
        .select(
          `
          id,
          numero_orden,
          marca,
          modelo,
          tipo_producto,
          descripcion_falla,
          estado,
          estado_cotizacion,
          fecha_ingreso,
          costo_total,
          pagado,
          clientes (
            nombre,
            cedula,
            telefono,
            email
          )
        `
        )
        .eq('numero_orden', numeroOrden.trim())
        .single();

      if (reparacionError || !reparacionData) {
        toast({
          variant: 'destructive',
          title: 'No encontrado',
          description: 'No se encontró una reparación con ese número de orden',
        });
        setReparacion(null);
        setRepuestos([]);
        return;
      }

      setReparacion(reparacionData as Reparacion);

      // Cargar repuestos si existen (cuando hay cotización)
      if (reparacionData.estado !== 'recibido' && reparacionData.estado !== 'en_diagnostico') {
        const { data: repuestosData } = await supabase
          .from('reparacion_repuestos')
          .select('descripcion, cantidad, costo')
          .eq('reparacion_id', reparacionData.id);

        setRepuestos(repuestosData || []);
      } else {
        setRepuestos([]);
      }

      // Cargar la nota del estado actual
      const { data: estadoData } = await supabase
        .from('reparacion_estados')
        .select('notas')
        .eq('reparacion_id', reparacionData.id)
        .eq('estado_nuevo', reparacionData.estado)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (estadoData?.notas) {
        setNotaEstadoActual(estadoData.notas);
      } else {
        setNotaEstadoActual('');
      }

      toast({
        title: 'Reparación encontrada',
        description: `Estado: ${ESTADOS_LABELS[reparacionData.estado] || reparacionData.estado}`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo consultar la reparación',
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmarAccionCotizacion = (accion: 'aceptar' | 'rechazar') => {
    setAccionCotizacion(accion);
    setIsConfirmDialogOpen(true);
  };

  const handleAccionCotizacion = async () => {
    if (!reparacion || !accionCotizacion) return;

    try {
      const nuevoEstadoCotizacion = accionCotizacion === 'aceptar' ? 'aceptada' : 'rechazada';
      const nuevoEstado = accionCotizacion === 'aceptar' ? 'cotizacion_aceptada' : 'cotizacion_rechazada';

      // Si rechazó la cotización, agregar cargo de 70mil por revisión
      const updateData: any = {
        estado_cotizacion: nuevoEstadoCotizacion,
        estado: nuevoEstado,
      };

      if (accionCotizacion === 'rechazar') {
        updateData.costo_total = 70000; // Cargo por revisión
      }

      const { error } = await supabase
        .from('reparaciones')
        .update(updateData)
        .eq('id', reparacion.id);

      if (error) throw error;

      toast({
        title: accionCotizacion === 'aceptar' ? 'Cotización aceptada' : 'Cotización rechazada',
        description:
          accionCotizacion === 'aceptar'
            ? 'Procederemos con la reparación'
            : 'Se notificará al técnico sobre tu decisión',
      });

      // Actualizar el estado local
      setReparacion({
        ...reparacion,
        estado_cotizacion: nuevoEstadoCotizacion,
        estado: nuevoEstado,
        costo_total: accionCotizacion === 'rechazar' ? 70000 : reparacion.costo_total,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo procesar tu respuesta',
      });
    } finally {
      setIsConfirmDialogOpen(false);
      setAccionCotizacion(null);
    }
  };

  const descargarCotizacion = () => {
    if (!reparacion) return;

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

    const tableData = repuestos.map((r) => [
      r.descripcion,
      r.cantidad.toString(),
      formatCOP(r.costo),
      formatCOP(r.cantidad * r.costo),
    ]);

    autoTable(doc, {
      startY: 120,
      head: [['Descripción', 'Cantidad', 'Precio Unit.', 'Subtotal']],
      body: tableData,
      foot: [['', '', 'Total:', formatCOP(reparacion.costo_total)]],
    });

    doc.save(`Cotizacion-${reparacion.numero_orden}.pdf`);
  };

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'recibido':
        return 'secondary';
      case 'en_diagnostico':
        return 'default';
      case 'cotizacion_hecha':
        return 'outline';
      case 'esperando_repuestos':
      case 'cotizacion_aceptada':
        return 'default';
      case 'cotizacion_rechazada':
        return 'destructive';
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

  const mostrarBotonesCotizacion =
    reparacion &&
    reparacion.estado === 'cotizacion_hecha' &&
    reparacion.estado_cotizacion === 'pendiente' &&
    repuestos.length > 0;

  const mostrarBotonPago =
    reparacion &&
    reparacion.estado === 'listo_para_entrega' &&
    reparacion.pagado !== true;

  const iniciarPago = () => {
    if (!metodoPago) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Selecciona un método de pago',
      });
      return;
    }
    setShowPaymentDialog(true);
  };

  const procesarPago = async () => {
    if (!reparacion) return;

    // Validaciones según método de pago
    if (metodoPago === 'tarjeta') {
      if (!datosTarjeta.numero || !datosTarjeta.nombre || !datosTarjeta.vencimiento || !datosTarjeta.cvv) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Completa todos los datos de la tarjeta',
        });
        return;
      }
    }

    setProcesandoPago(true);
    try {
      const { data, error } = await supabase.functions.invoke('procesar-pago', {
        body: {
          reparacion_id: reparacion.id,
          monto: reparacion.costo_total,
          metodo_pago: metodoPago,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Pago exitoso',
          description: `Transacción ${data.pago.numero_transaccion} procesada correctamente`,
        });
        
        setReparacion({ ...reparacion, pagado: true });
        setShowPaymentDialog(false);
        setMetodoPago('');
        setDatosTarjeta({ numero: '', nombre: '', vencimiento: '', cvv: '' });
      } else {
        toast({
          variant: 'destructive',
          title: 'Pago rechazado',
          description: data.mensaje || 'Intente nuevamente',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo procesar el pago',
      });
    } finally {
      setProcesandoPago(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Consultar Estado de Reparación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="numeroOrden">Número de Orden</Label>
              <div className="flex gap-2">
                <Input
                  id="numeroOrden"
                  placeholder="Ej: ORD-12345678"
                  value={numeroOrden}
                  onChange={(e) => setNumeroOrden(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && buscarReparacion()}
                />
                <Button onClick={buscarReparacion} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>

            {reparacion && (
              <div className="space-y-6 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Estado Actual</h3>
                    <Badge variant={getEstadoBadgeVariant(reparacion.estado)} className="mt-2">
                      {ESTADOS_LABELS[reparacion.estado] || reparacion.estado}
                    </Badge>
                    {notaEstadoActual && (
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-1">Nota del estado:</p>
                        <p className="text-sm text-muted-foreground">{notaEstadoActual}</p>
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>Orden: {reparacion.numero_orden}</div>
                    <div>Ingreso: {format(new Date(reparacion.fecha_ingreso), 'dd/MM/yyyy')}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Cliente</h4>
                    <p className="text-sm">{reparacion.clientes?.nombre}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Dispositivo</h4>
                    <p className="text-sm">
                      {reparacion.marca} {reparacion.modelo}
                    </p>
                    <p className="text-xs text-muted-foreground">{reparacion.tipo_producto}</p>
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Falla Reportada</h4>
                    <p className="text-sm">{reparacion.descripcion_falla}</p>
                  </div>
                </div>

                {repuestos.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Cotización</h4>
                      <Button variant="outline" size="sm" onClick={descargarCotizacion}>
                        <Download className="h-4 w-4 mr-2" />
                        Descargar PDF
                      </Button>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-2">Descripción</th>
                            <th className="text-center p-2">Cant.</th>
                            <th className="text-right p-2">Precio</th>
                            <th className="text-right p-2">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {repuestos.map((repuesto, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-2">{repuesto.descripcion}</td>
                              <td className="text-center p-2">{repuesto.cantidad}</td>
                              <td className="text-right p-2">{formatCOP(repuesto.costo)}</td>
                              <td className="text-right p-2">
                                {formatCOP(repuesto.cantidad * repuesto.costo)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t bg-muted font-semibold">
                          <tr>
                            <td colSpan={3} className="text-right p-2">
                              Total:
                            </td>
                            <td className="text-right p-2">{formatCOP(reparacion.costo_total)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {mostrarBotonesCotizacion && (
                      <div className="flex gap-3 pt-4">
                        <Button
                          onClick={() => confirmarAccionCotizacion('aceptar')}
                          className="flex-1"
                          variant="default"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aceptar Cotización
                        </Button>
                        <Button
                          onClick={() => confirmarAccionCotizacion('rechazar')}
                          className="flex-1"
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rechazar Cotización
                        </Button>
                      </div>
                    )}

                    {reparacion.estado_cotizacion === 'aceptada' && (
                      <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                          ✓ Cotización aceptada - Estamos trabajando en tu reparación
                        </p>
                      </div>
                    )}

                    {reparacion.estado_cotizacion === 'rechazada' && (
                      <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                          ✗ Cotización rechazada - Nos pondremos en contacto contigo
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {mostrarBotonPago && (
                  <div className="space-y-4 pt-6 border-t">
                    <h3 className="text-lg font-semibold">Pagar Reparación</h3>
                    <p className="text-sm text-muted-foreground">
                      Tu reparación está lista. Por favor realiza el pago para poder retirarla.
                    </p>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-lg font-semibold mb-2">Total a pagar:</p>
                      <p className="text-2xl font-bold text-primary">{formatCOP(reparacion.costo_total)}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="metodoPago">Método de Pago</Label>
                      <Select value={metodoPago} onValueChange={setMetodoPago}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un método" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tarjeta">Tarjeta de Crédito/Débito</SelectItem>
                          <SelectItem value="efectivo">Efectivo</SelectItem>
                          <SelectItem value="transferencia">Transferencia Bancaria</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={iniciarPago}
                      disabled={!metodoPago}
                      className="w-full"
                      size="lg"
                    >
                      Continuar al Pago
                    </Button>
                  </div>
                )}

                {reparacion.pagado && reparacion.estado === 'listo_para_entrega' && (
                  <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg mt-6">
                    <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                      ✓ Pago realizado - Tu reparación está lista para retirar
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diálogo de Confirmación de Cotización */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {accionCotizacion === 'aceptar' ? 'Aceptar Cotización' : 'Rechazar Cotización'}
            </DialogTitle>
            <DialogDescription>
              {accionCotizacion === 'aceptar'
                ? '¿Estás seguro de aceptar esta cotización? Procederemos con la reparación.'
                : '¿Estás seguro de rechazar esta cotización? Se aplicará un cargo de $70,000 por la revisión.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAccionCotizacion}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Pago */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Procesar Pago</DialogTitle>
            <DialogDescription>
              {metodoPago === 'tarjeta' && 'Ingresa los datos de tu tarjeta'}
              {metodoPago === 'efectivo' && 'Confirma el pago en efectivo'}
              {metodoPago === 'transferencia' && 'Confirma la transferencia'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {metodoPago === 'tarjeta' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="numeroTarjeta">Número de Tarjeta</Label>
                  <Input
                    id="numeroTarjeta"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    value={datosTarjeta.numero}
                    onChange={(e) => setDatosTarjeta({ ...datosTarjeta, numero: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="nombreTarjeta">Nombre en la Tarjeta</Label>
                  <Input
                    id="nombreTarjeta"
                    placeholder="JUAN PEREZ"
                    value={datosTarjeta.nombre}
                    onChange={(e) => setDatosTarjeta({ ...datosTarjeta, nombre: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="vencimiento">Vencimiento</Label>
                    <Input
                      id="vencimiento"
                      placeholder="MM/AA"
                      maxLength={5}
                      value={datosTarjeta.vencimiento}
                      onChange={(e) => setDatosTarjeta({ ...datosTarjeta, vencimiento: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      maxLength={4}
                      type="password"
                      value={datosTarjeta.cvv}
                      onChange={(e) => setDatosTarjeta({ ...datosTarjeta, cvv: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {metodoPago === 'efectivo' && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  Al confirmar, el pago en efectivo será registrado. Asegúrate de tener el monto exacto al retirar la reparación.
                </p>
                <p className="text-lg font-bold mt-2">Total: {formatCOP(reparacion?.costo_total || 0)}</p>
              </div>
            )}

            {metodoPago === 'transferencia' && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">Datos para transferencia:</p>
                <p className="text-xs">Banco: Banco Ejemplo</p>
                <p className="text-xs">Cuenta: 1234-5678-9012</p>
                <p className="text-xs">Titular: TechRepair</p>
                <p className="text-lg font-bold mt-3">Total: {formatCOP(reparacion?.costo_total || 0)}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Al confirmar, se registrará el pago. Por favor realiza la transferencia.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)} disabled={procesandoPago}>
              Cancelar
            </Button>
            <Button onClick={procesarPago} disabled={procesandoPago}>
              {procesandoPago ? 'Procesando...' : 'Confirmar Pago'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
