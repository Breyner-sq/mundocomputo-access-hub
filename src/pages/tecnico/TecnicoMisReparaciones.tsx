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
import { Clock, FileText, Package, Truck, Download, Plus, Trash2, Eye, CheckCircle2, Upload, Image as ImageIcon } from 'lucide-react';
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
  pagado: boolean;
  fotos_entrega?: string[];
  clientes?: {
    nombre: string;
    telefono: string;
    cedula: string;
    email: string;
  };
  profiles?: {
    nombre_completo: string;
  };
}

interface Repuesto {
  id?: string;
  descripcion: string;
  cantidad: number;
  costo: number;
  producto_id?: string | null;
  aceptado?: boolean;
}

const ESTADOS = [
  { value: 'recibido', label: 'Recibido' },
  { value: 'en_diagnostico', label: 'En Diagnóstico' },
  { value: 'cotizacion_hecha', label: 'Cotización Hecha' },
  { value: 'esperando_repuestos', label: 'Esperando Repuestos' },
  { value: 'en_reparacion', label: 'En Reparación' },
  { value: 'listo_para_entrega', label: 'Listo para Entrega' },
];

// Validación de transiciones de estado permitidas
const TRANSICIONES_PERMITIDAS: Record<string, string[]> = {
  recibido: ['en_diagnostico'],
  en_diagnostico: [], // No se puede cambiar manualmente, se cambia automáticamente al finalizar diagnóstico
  cotizacion_hecha: [], // Solo el cliente puede cambiar a cotizacion_aceptada/rechazada
  cotizacion_aceptada: ['esperando_repuestos'],
  cotizacion_rechazada: ['listo_para_entrega'],
  esperando_repuestos: ['en_reparacion'],
  en_reparacion: ['listo_para_entrega'],
  listo_para_entrega: ['entregado'],
};

export default function TecnicoMisReparaciones() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [reparaciones, setReparaciones] = useState<Reparacion[]>([]);
  const [reparacionesEntregadas, setReparacionesEntregadas] = useState<Reparacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEntregadas, setLoadingEntregadas] = useState(true);
  const [ordenMisReparaciones, setOrdenMisReparaciones] = useState('fecha_ingreso');
  const [ordenEntregadas, setOrdenEntregadas] = useState('fecha_entrega');
  const [searchAsignadas, setSearchAsignadas] = useState('');
  const [searchEntregadas, setSearchEntregadas] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDiagnosticoDialogOpen, setIsDiagnosticoDialogOpen] = useState(false);
  const [isEntregarDialogOpen, setIsEntregarDialogOpen] = useState(false);
  const [isDetallesDialogOpen, setIsDetallesDialogOpen] = useState(false);
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
  const [fotosEntrega, setFotosEntrega] = useState<File[]>([]);

  useEffect(() => {
    if (user) {
      fetchMisReparaciones();
      fetchReparacionesEntregadas();
    }
  }, [user, ordenMisReparaciones, searchAsignadas, ordenEntregadas, searchEntregadas]);

  const fetchMisReparaciones = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('reparaciones')
        .select(`
          *,
          clientes (nombre, telefono, cedula, email),
          profiles (nombre_completo)
        `)
        .eq('tecnico_id', user?.id)
        .neq('estado', 'entregado');

      // Aplicar búsqueda
      if (searchAsignadas.trim()) {
        query = query.or(`numero_orden.ilike.%${searchAsignadas}%,marca.ilike.%${searchAsignadas}%,modelo.ilike.%${searchAsignadas}%`);
      }

      // Ordenar según la selección
      if (ordenMisReparaciones === 'estado') {
        query = query.order('estado').order('fecha_ingreso', { ascending: false });
      } else {
        query = query.order('fecha_ingreso', { ascending: false });
      }

      const { data, error } = await query;

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

  const fetchReparacionesEntregadas = async () => {
    try {
      setLoadingEntregadas(true);
      
      let query = supabase
        .from('reparaciones')
        .select(`
          *,
          clientes (nombre, telefono, cedula, email),
          profiles (nombre_completo)
        `)
        .eq('tecnico_id', user?.id)
        .eq('estado', 'entregado');

      // Aplicar búsqueda
      if (searchEntregadas.trim()) {
        query = query.or(`numero_orden.ilike.%${searchEntregadas}%,marca.ilike.%${searchEntregadas}%,modelo.ilike.%${searchEntregadas}%`);
      }

      // Ordenar según la selección
      if (ordenEntregadas === 'costo_total') {
        query = query.order('costo_total', { ascending: false });
      } else {
        query = query.order('fecha_entrega', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setReparacionesEntregadas(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las reparaciones entregadas',
      });
    } finally {
      setLoadingEntregadas(false);
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
          estado: 'cotizacion_hecha',
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
          estado_nuevo: 'cotizacion_hecha',
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

  const handleFotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 4) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Solo puedes subir hasta 4 fotos',
      });
      return;
    }
    setFotosEntrega(files);
  };

  const handleEntregar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReparacion || !nombreQuienRetira.trim()) return;

    // Verificar que el pago se haya realizado
    const { data: reparacionActual, error: fetchError } = await supabase
      .from('reparaciones')
      .select('pagado')
      .eq('id', selectedReparacion.id)
      .single();

    if (fetchError || !reparacionActual?.pagado) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se puede entregar una reparación sin confirmar el pago',
      });
      return;
    }

    // Verificar si el método de pago fue efectivo y solicitar confirmación
    const { data: pagoData } = await supabase
      .from('pagos_reparaciones')
      .select('metodo_pago')
      .eq('reparacion_id', selectedReparacion.id)
      .eq('estado', 'aprobado')
      .single();

    if (pagoData?.metodo_pago === 'efectivo') {
      const confirmar = window.confirm(
        'El cliente pagó por EFECTIVO. ¿Confirmas que has recibido el dinero en efectivo antes de entregar la reparación?'
      );
      if (!confirmar) {
        toast({
          variant: 'destructive',
          title: 'Entrega cancelada',
          description: 'Debes confirmar que recibiste el pago en efectivo antes de entregar',
        });
        return;
      }
    }

    try {
      // Subir fotos de entrega si existen
      const fotosUrls: string[] = [];
      if (fotosEntrega.length > 0) {
        for (const foto of fotosEntrega) {
          const fileExt = foto.name.split('.').pop();
          const fileName = `${selectedReparacion.id}_entrega_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError, data } = await supabase.storage
            .from('reparaciones-fotos')
            .upload(filePath, foto);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('reparaciones-fotos')
            .getPublicUrl(filePath);

          fotosUrls.push(publicUrl);
        }
      }

      const { error } = await supabase
        .from('reparaciones')
        .update({
          estado: 'entregado',
          fecha_entrega: new Date().toISOString(),
          nombre_quien_retira: nombreQuienRetira,
          fotos_entrega: fotosUrls,
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

      // Generar factura con fotos
      await generarFacturaEntrega(selectedReparacion, nombreQuienRetira, fotosUrls);

      toast({
        title: 'Reparación entregada',
        description: 'El comprobante de entrega está listo',
      });

      fetchMisReparaciones();
      fetchReparacionesEntregadas();
      setIsEntregarDialogOpen(false);
      setSelectedReparacion(null);
      setNombreQuienRetira('');
      setFotosEntrega([]);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo registrar la entrega',
      });
    }
  };

  const generarFacturaEntrega = async (reparacion: Reparacion, quienRetira: string, fotosUrls: string[]) => {
    const doc = new jsPDF();
    let yPos = 20;

    doc.setFontSize(20);
    doc.text('Comprobante de Entrega', 105, yPos, { align: 'center' });
    yPos += 20;

    doc.setFontSize(12);
    doc.text(`Orden: ${reparacion.numero_orden}`, 20, yPos);
    yPos += 8;
    doc.text(`Fecha de Entrega: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, yPos);
    yPos += 15;

    doc.setFontSize(14);
    doc.text('Datos del Cliente', 20, yPos);
    yPos += 8;
    doc.setFontSize(11);
    doc.text(`Nombre: ${reparacion.clientes?.nombre || 'N/A'}`, 20, yPos);
    yPos += 7;
    doc.text(`Cédula: ${reparacion.clientes?.cedula || 'N/A'}`, 20, yPos);
    yPos += 15;

    doc.setFontSize(14);
    doc.text('Datos del Dispositivo', 20, yPos);
    yPos += 8;
    doc.setFontSize(11);
    doc.text(`Tipo: ${reparacion.tipo_producto}`, 20, yPos);
    yPos += 7;
    doc.text(`Marca y Modelo: ${reparacion.marca} ${reparacion.modelo}`, 20, yPos);
    yPos += 15;

    doc.setFontSize(14);
    doc.text('Datos de Entrega', 20, yPos);
    yPos += 8;
    doc.setFontSize(11);
    doc.text(`Persona que retira: ${quienRetira}`, 20, yPos);
    yPos += 7;
    doc.text(`Costo Total: ${formatCOP(reparacion.costo_total)}`, 20, yPos);
    yPos += 15;

    // Agregar fotos si existen
    if (fotosUrls.length > 0) {
      doc.setFontSize(14);
      doc.text('Fotos de Entrega', 20, yPos);
      yPos += 8;

      for (let i = 0; i < fotosUrls.length; i++) {
        try {
          const response = await fetch(fotosUrls[i]);
          const blob = await response.blob();
          const reader = new FileReader();
          
          await new Promise((resolve) => {
            reader.onloadend = () => {
              const base64data = reader.result as string;
              
              if (yPos > 240) {
                doc.addPage();
                yPos = 20;
              }
              
              doc.addImage(base64data, 'JPEG', 20, yPos, 80, 60);
              yPos += 70;
              resolve(null);
            };
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.error('Error al cargar foto:', error);
        }
      }
    }

    doc.save(`Comprobante-Entrega-${reparacion.numero_orden}.pdf`);
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

      // Filtrar solo los repuestos aceptados
      const repuestosAceptados = repuestosData.filter(r => r.aceptado);
      const totalRepuestosAceptados = repuestosAceptados.reduce(
        (sum, r) => sum + r.cantidad * r.costo, 
        0
      );

      generarCotizacion(reparacion, repuestosAceptados, totalRepuestosAceptados);
      
      toast({
        title: 'Cotización generada',
        description: `Se incluyeron ${repuestosAceptados.length} de ${repuestosData.length} repuestos (solo los aceptados por el cliente)`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo descargar la cotización',
      });
    }
  };

  const handleVerDetalles = async (reparacion: Reparacion) => {
    try {
      // Obtener información completa incluyendo repuestos
      const { data: repuestosData } = await supabase
        .from('reparacion_repuestos')
        .select('*')
        .eq('reparacion_id', reparacion.id);

      setSelectedReparacion({
        ...reparacion,
      });
      setRepuestos(repuestosData || []);
      setIsDetallesDialogOpen(true);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los detalles',
      });
    }
  };

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'recibido':
        return 'secondary';
      case 'en_diagnostico':
        return 'default';
      case 'cotizacion_hecha':
        return 'outline';
      case 'cotizacion_aceptada':
        return 'default';
      case 'cotizacion_rechazada':
        return 'destructive';
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

        {/* Tabla de Reparaciones Asignadas */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Reparaciones Asignadas</CardTitle>
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Buscar por orden, cliente o cédula..."
                  value={searchAsignadas}
                  onChange={(e) => setSearchAsignadas(e.target.value)}
                  className="w-80"
                />
                <div className="flex items-center gap-2">
                  <Label htmlFor="ordenMisReparaciones" className="text-sm">Ordenar:</Label>
                  <Select value={ordenMisReparaciones} onValueChange={setOrdenMisReparaciones}>
                    <SelectTrigger id="ordenMisReparaciones" className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fecha_ingreso">Fecha Ingreso</SelectItem>
                      <SelectItem value="estado">Estado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
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
                            <div className="flex flex-col gap-1">
                              <Badge variant={getEstadoBadgeVariant(rep.estado)}>
                                {getEstadoLabel(rep.estado)}
                              </Badge>
                              {rep.estado === 'listo_para_entrega' && (
                                <span className={`text-xs ${rep.pagado ? 'text-green-600' : 'text-orange-600'}`}>
                                  {rep.pagado ? '✓ Pagado' : '⏳ Pendiente pago'}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleVerDetalles(rep)}
                                title="Ver detalles completos"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
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
                              {(rep.estado === 'cotizacion_hecha' ||
                                rep.estado === 'cotizacion_aceptada' ||
                                rep.estado === 'esperando_repuestos' ||
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
                                  {rep.pagado ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setSelectedReparacion(rep);
                                        setNombreQuienRetira('');
                                        setFotosEntrega([]);
                                        setIsEntregarDialogOpen(true);
                                      }}
                                      title="Entregar"
                                    >
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      disabled
                                      title="Esperando pago del cliente"
                                    >
                                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  )}
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

        {/* Tabla de Reparaciones Entregadas */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Reparaciones Entregadas</CardTitle>
              <div className="flex items-center gap-4">
                <Input
                  placeholder="Buscar por orden, cliente o cédula..."
                  value={searchEntregadas}
                  onChange={(e) => setSearchEntregadas(e.target.value)}
                  className="w-80"
                />
                <div className="flex items-center gap-2">
                  <Label htmlFor="ordenEntregadas" className="text-sm">Ordenar:</Label>
                  <Select value={ordenEntregadas} onValueChange={setOrdenEntregadas}>
                    <SelectTrigger id="ordenEntregadas" className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fecha_entrega">Fecha Entrega</SelectItem>
                      <SelectItem value="costo_total">Total</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingEntregadas ? (
              <div className="text-center py-8">Cargando...</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Orden</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Dispositivo</TableHead>
                      <TableHead>Fecha Entrega</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Quien Retiró</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reparacionesEntregadas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No hay reparaciones entregadas
                        </TableCell>
                      </TableRow>
                    ) : (
                      reparacionesEntregadas.map((rep) => (
                        <TableRow key={rep.id}>
                          <TableCell className="font-medium">{rep.numero_orden}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{rep.clientes?.nombre}</div>
                              <div className="text-sm text-muted-foreground">
                                {rep.clientes?.cedula}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {rep.marca} {rep.modelo}
                          </TableCell>
                          <TableCell>
                            {rep.fecha_entrega && format(new Date(rep.fecha_entrega), 'dd/MM/yyyy HH:mm')}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCOP(rep.costo_total)}
                          </TableCell>
                          <TableCell>
                            {rep.nombre_quien_retira || 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async () => {
                                // Obtener repuestos para el comprobante
                                const { data: repuestosData } = await supabase
                                  .from('reparacion_repuestos')
                                  .select('*')
                                  .eq('reparacion_id', rep.id);

                                const doc = new jsPDF();
                                doc.setFontSize(20);
                                doc.text('Comprobante de Entrega', 105, 20, { align: 'center' });
                                doc.setFontSize(12);
                                doc.text(`Orden: ${rep.numero_orden}`, 20, 40);
                                doc.text(`Fecha Entrega: ${rep.fecha_entrega ? format(new Date(rep.fecha_entrega), 'dd/MM/yyyy HH:mm') : 'N/A'}`, 20, 48);
                                doc.setFontSize(14);
                                doc.text('Cliente', 20, 65);
                                doc.setFontSize(11);
                                doc.text(`Nombre: ${rep.clientes?.nombre || 'N/A'}`, 20, 73);
                                doc.text(`Cédula: ${rep.clientes?.cedula || 'N/A'}`, 20, 80);
                                doc.setFontSize(14);
                                doc.text('Dispositivo', 20, 97);
                                doc.setFontSize(11);
                                doc.text(`${rep.tipo_producto} - ${rep.marca} ${rep.modelo}`, 20, 105);
                                
                                if (repuestosData && repuestosData.length > 0) {
                                  doc.setFontSize(14);
                                  doc.text('Repuestos', 20, 122);
                                  const tableData = repuestosData.map((r: any) => [
                                    r.descripcion,
                                    r.cantidad.toString(),
                                    formatCOP(r.costo),
                                    formatCOP(r.cantidad * r.costo),
                                  ]);
                                  autoTable(doc, {
                                    startY: 129,
                                    head: [['Descripción', 'Cant.', 'Precio', 'Subtotal']],
                                    body: tableData,
                                  });
                                  const finalY = (doc as any).lastAutoTable.finalY || 129;
                                  doc.setFontSize(14);
                                  doc.text(`Total: ${formatCOP(rep.costo_total)}`, 20, finalY + 15);
                                  doc.text(`Entregado a: ${rep.nombre_quien_retira || 'N/A'}`, 20, finalY + 25);
                                } else {
                                  doc.setFontSize(11);
                                  doc.text(`Total: ${formatCOP(rep.costo_total)}`, 20, 122);
                                  doc.text(`Entregado a: ${rep.nombre_quien_retira || 'N/A'}`, 20, 132);
                                }
                                
                                doc.save(`Comprobante-${rep.numero_orden}.pdf`);
                              }}
                              title="Descargar comprobante"
                            >
                              <Download className="h-4 w-4" />
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

        {/* Dialog para Ver Detalles Completos */}
        <Dialog open={isDetallesDialogOpen} onOpenChange={setIsDetallesDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles Completos de la Reparación</DialogTitle>
              <DialogDescription>
                Orden: {selectedReparacion?.numero_orden}
              </DialogDescription>
            </DialogHeader>
            {selectedReparacion && (
              <div className="space-y-6">
                {/* Información del Cliente */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Cliente</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Nombre:</span>
                      <p className="font-medium">{selectedReparacion.clientes?.nombre}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cédula:</span>
                      <p className="font-medium">{selectedReparacion.clientes?.cedula}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Teléfono:</span>
                      <p className="font-medium">{selectedReparacion.clientes?.telefono}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium">{selectedReparacion.clientes?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Información del Dispositivo */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Dispositivo</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tipo:</span>
                      <p className="font-medium">{selectedReparacion.tipo_producto}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Marca y Modelo:</span>
                      <p className="font-medium">{selectedReparacion.marca} {selectedReparacion.modelo}</p>
                    </div>
                    {selectedReparacion.numero_serie && (
                      <div>
                        <span className="text-muted-foreground">Nº Serie:</span>
                        <p className="font-medium">{selectedReparacion.numero_serie}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Estado:</span>
                      <Badge variant={getEstadoBadgeVariant(selectedReparacion.estado)}>
                        {getEstadoLabel(selectedReparacion.estado)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Descripción de la Falla */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Descripción de la Falla</h3>
                  <p className="text-sm">{selectedReparacion.descripcion_falla}</p>
                </div>

                {/* Estado Físico */}
                {selectedReparacion.estado_fisico && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Estado Físico</h3>
                    <p className="text-sm">{selectedReparacion.estado_fisico}</p>
                  </div>
                )}

                {/* Repuestos */}
                {repuestos.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Repuestos</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Costo Unit.</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {repuestos.map((rep, index) => (
                          <TableRow key={index} className={!rep.aceptado ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                            <TableCell>{rep.descripcion}</TableCell>
                            <TableCell>{rep.cantidad}</TableCell>
                            <TableCell>{formatCOP(rep.costo)}</TableCell>
                            <TableCell>{formatCOP(rep.cantidad * rep.costo)}</TableCell>
                            <TableCell>
                              {rep.aceptado ? (
                                <Badge variant="default" className="bg-green-600">Aceptado</Badge>
                              ) : (
                                <Badge variant="destructive">No aceptado</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Total (solo aceptados): <span className="font-semibold">{formatCOP(repuestos.filter(r => r.aceptado).reduce((sum, r) => sum + r.cantidad * r.costo, 0))}</span>
                    </div>
                  </div>
                )}

                {/* Costo Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Costo Total:</h3>
                    <p className="text-2xl font-bold">{formatCOP(selectedReparacion.costo_total)}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsDetallesDialogOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para Cambiar Estado */}
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

        {/* Dialog para Finalizar Diagnóstico */}
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

        {/* Dialog para Entregar */}
        <Dialog open={isEntregarDialogOpen} onOpenChange={setIsEntregarDialogOpen}>
          <DialogContent className="max-w-2xl">
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
                <div className="space-y-2">
                  <Label htmlFor="fotos_entrega">Fotos de Entrega (Máximo 4)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="fotos_entrega"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFotosChange}
                      className="cursor-pointer"
                    />
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  </div>
                  {fotosEntrega.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {fotosEntrega.length} {fotosEntrega.length === 1 ? 'foto seleccionada' : 'fotos seleccionadas'}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEntregarDialogOpen(false);
                    setFotosEntrega([]);
                  }}
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
