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
import autoTable from 'jspdf-autotable';
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
  estado_cotizacion?: string;
  fecha_ingreso: string;
  fecha_finalizacion: string | null;
  fecha_entrega: string | null;
  nombre_quien_retira: string | null;
  costo_total: number;
  pagado: boolean;
  fotos?: string[];
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
  const [reparacionesEntregadas, setReparacionesEntregadas] = useState<Reparacion[]>([]);
  const [ordenActivas, setOrdenActivas] = useState('fecha_ingreso');
  const [ordenEntregadas, setOrdenEntregadas] = useState('fecha_entrega');
  const [searchEntregadas, setSearchEntregadas] = useState('');
  const [fotosSeleccionadas, setFotosSeleccionadas] = useState<File[]>([]);
  const [uploadingFotos, setUploadingFotos] = useState(false);

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

  const [cedulaBusqueda, setCedulaBusqueda] = useState('');
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null);
  const [buscandoCliente, setBuscandoCliente] = useState(false);

  useEffect(() => {
    fetchReparaciones();
    fetchReparacionesEntregadas();
    fetchClientes();
    fetchTecnicos();
  }, [ordenActivas, ordenEntregadas, searchEntregadas]);

  const fetchReparaciones = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('reparaciones')
        .select(`
          *,
          clientes (nombre, cedula, email, telefono),
          profiles (nombre_completo)
        `)
        .neq('estado', 'entregado');

      // Ordenar según la selección
      if (ordenActivas === 'estado') {
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
      // First, get all user_ids with role='tecnico'
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'tecnico');

      if (rolesError) throw rolesError;

      if (!userRoles || userRoles.length === 0) {
        setTecnicos([]);
        return;
      }

      const tecnicoIds = userRoles.map(ur => ur.user_id);

      // Then, get profiles for those user_ids
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nombre_completo')
        .in('id', tecnicoIds)
        .eq('activo', true)
        .order('nombre_completo');

      if (error) throw error;
      setTecnicos(data || []);
    } catch (error: any) {
      console.error('Error fetching tecnicos:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los técnicos',
      });
    }
  };

  const buscarClientePorCedula = async (cedula: string) => {
    if (!cedula.trim()) {
      setClienteEncontrado(null);
      setFormData({ ...formData, cliente_id: '' });
      return;
    }

    try {
      setBuscandoCliente(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nombre, cedula, email')
        .eq('cedula', cedula.trim())
        .eq('activo', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setClienteEncontrado(data);
        setFormData({ ...formData, cliente_id: data.id });
        toast({
          title: 'Cliente encontrado',
          description: `${data.nombre}`,
        });
      } else {
        setClienteEncontrado(null);
        setFormData({ ...formData, cliente_id: '' });
        toast({
          variant: 'destructive',
          title: 'Cliente no encontrado',
          description: 'No existe un cliente con esa cédula',
        });
      }
    } catch (error: any) {
      console.error('Error buscando cliente:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al buscar el cliente',
      });
    } finally {
      setBuscandoCliente(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.cliente_id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes buscar y seleccionar un cliente por su cédula',
      });
      return;
    }

    if (fotosSeleccionadas.length > 4) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Máximo 4 fotos permitidas',
      });
      return;
    }

    try {
      setUploadingFotos(true);

      // Insertar la reparación primero
      const { data: reparacionData, error: reparacionError } = await supabase
        .from('reparaciones')
        .insert([
          {
            ...formData,
            estado: 'recibido',
          },
        ])
        .select()
        .single();

      if (reparacionError) throw reparacionError;

      // Subir fotos si hay
      const fotosUrls: string[] = [];
      if (fotosSeleccionadas.length > 0) {
        for (const foto of fotosSeleccionadas) {
          const fileName = `${reparacionData.id}/${Date.now()}-${foto.name}`;
          const { error: uploadError, data: uploadData } = await supabase.storage
            .from('reparaciones-fotos')
            .upload(fileName, foto);

          if (uploadError) {
            console.error('Error subiendo foto:', uploadError);
          } else if (uploadData) {
            const { data: { publicUrl } } = supabase.storage
              .from('reparaciones-fotos')
              .getPublicUrl(uploadData.path);
            fotosUrls.push(publicUrl);
          }
        }

        // Actualizar la reparación con las URLs de las fotos
        await supabase
          .from('reparaciones')
          .update({ fotos: fotosUrls })
          .eq('id', reparacionData.id);
      }

      // TODO: Implementar envío de comprobante por email cuando se configure el servicio de correo

      toast({
        title: 'Reparación registrada',
        description: 'La reparación se registró correctamente',
      });

      fetchReparaciones();
      fetchReparacionesEntregadas();
      handleCloseDialog();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Ocurrió un error al registrar la reparación',
      });
    } finally {
      setUploadingFotos(false);
    }
  };

  const handleFinalizar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedReparacion) return;

    // Validar que la reparación esté pagada
    if (!selectedReparacion.pagado) {
      // Verificar en tiempo real el estado de pago
      const { data: reparacionActualizada } = await supabase
        .from('reparaciones')
        .select('pagado, clientes(nombre, email)')
        .eq('id', selectedReparacion.id)
        .single();

      if (!reparacionActualizada?.pagado) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'La reparación debe estar pagada antes de entregar',
        });
        return;
      }
    }

    // Verificar si el pago fue en efectivo y confirmar recepción
    const { data: pagoData } = await supabase
      .from('pagos_reparaciones')
      .select('metodo_pago')
      .eq('reparacion_id', selectedReparacion.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (pagoData?.metodo_pago === 'efectivo') {
      const confirmado = window.confirm(
        '⚠️ CONFIRMACIÓN DE PAGO EN EFECTIVO\n\n' +
        'El cliente pagó en efectivo.\n\n' +
        '¿Confirma que ya recibió el dinero en efectivo antes de entregar el dispositivo?'
      );
      
      if (!confirmado) {
        return;
      }
    }

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
      fetchReparacionesEntregadas();
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

  const generarComprobante = async (reparacion: Reparacion) => {
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

    let currentY = 180;

    // Estado físico
    if (reparacion.estado_fisico) {
      doc.setFontSize(14);
      doc.text('Estado Físico', 20, currentY);
      doc.setFontSize(11);
      const splitEstado = doc.splitTextToSize(reparacion.estado_fisico, 170);
      doc.text(splitEstado, 20, currentY + 8);
      currentY += 25;
    }

    // Fotos adjuntas
    if (reparacion.fotos && reparacion.fotos.length > 0) {
      doc.setFontSize(14);
      doc.text('Fotos del Dispositivo', 20, currentY);
      currentY += 10;
      
      // Intentar cargar e incrustar las fotos en el PDF
      for (let i = 0; i < reparacion.fotos.length; i++) {
        try {
          const fotoUrl = reparacion.fotos[i];
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          await new Promise((resolve, reject) => {
            img.onload = () => {
              try {
                // Añadir nueva página si es necesario
                if (currentY > 240) {
                  doc.addPage();
                  currentY = 20;
                }
                
                // Calcular dimensiones para que la imagen quepa bien
                const maxWidth = 80;
                const maxHeight = 60;
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                  height = (maxWidth / width) * height;
                  width = maxWidth;
                }
                if (height > maxHeight) {
                  width = (maxHeight / height) * width;
                  height = maxHeight;
                }
                
                doc.setFontSize(10);
                doc.text(`Foto ${i + 1}:`, 20, currentY);
                currentY += 5;
                
                doc.addImage(img, 'JPEG', 20, currentY, width, height);
                currentY += height + 10;
                
                resolve(true);
              } catch (err) {
                reject(err);
              }
            };
            img.onerror = reject;
            img.src = fotoUrl;
          });
        } catch (error) {
          console.error('Error cargando foto:', error);
          doc.setFontSize(10);
          doc.text(`Foto ${i + 1}: Error al cargar`, 20, currentY);
          currentY += 8;
        }
      }
    }

    // Footer
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(10);
    doc.text('Estado: Recibido', 20, currentY);
    if (reparacion.profiles?.nombre_completo) {
      doc.text(`Técnico asignado: ${reparacion.profiles.nombre_completo}`, 20, currentY + 7);
    }

    doc.save(`Comprobante-${reparacion.numero_orden}.pdf`);
  };

  const fetchReparacionesEntregadas = async () => {
    try {
      let query = supabase
        .from('reparaciones')
        .select(`
          *,
          clientes (nombre, cedula, email, telefono),
          profiles (nombre_completo)
        `)
        .eq('estado', 'entregado');

      // Aplicar búsqueda
      if (searchEntregadas.trim()) {
        query = query.or(`numero_orden.ilike.%${searchEntregadas}%,clientes.nombre.ilike.%${searchEntregadas}%,clientes.cedula.ilike.%${searchEntregadas}%`);
      }

      // Ordenar según la selección
      if (ordenEntregadas === 'total') {
        query = query.order('costo_total', { ascending: false });
      } else {
        query = query.order('fecha_entrega', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setReparacionesEntregadas(data || []);
    } catch (error: any) {
      console.error('Error fetching entregadas:', error);
    }
  };

  const generarComprobanteEntrega = async (reparacion: Reparacion) => {
    try {
      // Obtener repuestos
      const { data: repuestosData, error: repuestosError } = await supabase
        .from('reparacion_repuestos')
        .select('*')
        .eq('reparacion_id', reparacion.id);

      if (repuestosError) throw repuestosError;

      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text('Comprobante de Entrega', 105, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.text(`Orden: ${reparacion.numero_orden}`, 20, 40);
      doc.text(`Fecha Ingreso: ${format(new Date(reparacion.fecha_ingreso), 'dd/MM/yyyy')}`, 20, 48);
      doc.text(
        `Fecha Entrega: ${format(new Date(reparacion.fecha_entrega || new Date()), 'dd/MM/yyyy HH:mm')}`,
        20,
        56
      );

      doc.setFontSize(14);
      doc.text('Cliente', 20, 73);
      doc.setFontSize(11);
      doc.text(`Nombre: ${reparacion.clientes?.nombre || 'N/A'}`, 20, 81);
      doc.text(`Cédula: ${reparacion.clientes?.cedula || 'N/A'}`, 20, 88);

      doc.setFontSize(14);
      doc.text('Dispositivo', 20, 105);
      doc.setFontSize(11);
      doc.text(`${reparacion.tipo_producto} - ${reparacion.marca} ${reparacion.modelo}`, 20, 113);

      // Si la cotización fue rechazada, el costo es solo el cargo por revisión
      if (reparacion.estado_cotizacion === 'rechazada') {
        doc.setFontSize(14);
        doc.text('Cargo por Revisión', 20, 130);
        doc.setFontSize(11);
        doc.text(`Total: ${formatCOP(70000)}`, 20, 140);
        doc.text(`Entregado a: ${reparacion.nombre_quien_retira || 'N/A'}`, 20, 150);
      } else if (repuestosData && repuestosData.length > 0) {
        doc.setFontSize(14);
        doc.text('Repuestos Utilizados', 20, 130);

        const tableData = repuestosData.map((r: any) => [
          r.descripcion,
          r.cantidad.toString(),
          formatCOP(r.costo),
          formatCOP(r.cantidad * r.costo),
        ]);

        autoTable(doc, {
          startY: 137,
          head: [['Descripción', 'Cantidad', 'Precio Unit.', 'Subtotal']],
          body: tableData,
          theme: 'grid',
        });

        const finalY = (doc as any).lastAutoTable.finalY || 137;
        doc.setFontSize(14);
        doc.text(`Total: ${formatCOP(reparacion.costo_total)}`, 20, finalY + 15);
        doc.setFontSize(11);
        doc.text(`Entregado a: ${reparacion.nombre_quien_retira || 'N/A'}`, 20, finalY + 25);
      } else {
        doc.setFontSize(11);
        doc.text(`Costo Total: ${formatCOP(reparacion.costo_total)}`, 20, 130);
        doc.text(`Entregado a: ${reparacion.nombre_quien_retira || 'N/A'}`, 20, 140);
      }

      doc.save(`Comprobante-Entrega-${reparacion.numero_orden}.pdf`);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo generar el comprobante',
      });
    }
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
    setCedulaBusqueda('');
    setClienteEncontrado(null);
    setFotosSeleccionadas([]);
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (files.length > 4) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Máximo 4 fotos permitidas',
        });
        return;
      }
      setFotosSeleccionadas(files);
    }
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
      cotizacion_hecha: 'Cotización Hecha',
      cotizacion_aceptada: 'Cotización Aceptada',
      cotizacion_rechazada: 'Cotización Rechazada',
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
            <div className="flex justify-between items-center">
              <CardTitle>Reparaciones Activas</CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="ordenActivas" className="text-sm">Ordenar por:</Label>
                <Select value={ordenActivas} onValueChange={setOrdenActivas}>
                  <SelectTrigger id="ordenActivas" className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fecha_ingreso">Fecha Ingreso</SelectItem>
                    <SelectItem value="estado">Estado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
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
                            <div className="flex flex-col gap-1">
                              <Badge variant={getEstadoBadgeVariant(rep.estado)}>
                                {getEstadoLabel(rep.estado)}
                              </Badge>
                              {rep.estado_cotizacion && rep.estado_cotizacion !== 'pendiente' && (
                                <span className="text-xs text-muted-foreground">
                                  {rep.estado_cotizacion === 'aceptada' ? '✓ Aceptada' : '✗ Rechazada'}
                                </span>
                              )}
                              {rep.estado === 'listo_para_entrega' && (
                                <span className={`text-xs ${rep.pagado ? 'text-green-600' : 'text-orange-600'}`}>
                                  {rep.pagado ? '✓ Pagado' : '⏳ Pendiente pago'}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{rep.profiles?.nombre_completo || 'Sin asignar'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => generarComprobante(rep)}
                                title="Descargar comprobante"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              {rep.estado === 'listo_para_entrega' && (
                                <>
                                  {rep.pagado ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setSelectedReparacion(rep);
                                        setIsFinalizarDialogOpen(true);
                                      }}
                                      title="Finalizar y entregar"
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

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Reparaciones Entregadas</CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="ordenEntregadas" className="text-sm">Ordenar por:</Label>
                <Select value={ordenEntregadas} onValueChange={setOrdenEntregadas}>
                  <SelectTrigger id="ordenEntregadas" className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fecha_entrega">Fecha Entrega</SelectItem>
                    <SelectItem value="total">Total</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por orden, cliente o cédula..."
                value={searchEntregadas}
                onChange={(e) => setSearchEntregadas(e.target.value)}
                className="max-w-md"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Orden</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Fecha Entrega</TableHead>
                    <TableHead>Entregado a</TableHead>
                    <TableHead>Total</TableHead>
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
                        <TableCell>{rep.clientes?.nombre || 'N/A'}</TableCell>
                        <TableCell>
                          {rep.marca} {rep.modelo}
                        </TableCell>
                        <TableCell>
                          {rep.fecha_entrega
                            ? format(new Date(rep.fecha_entrega), 'dd/MM/yyyy HH:mm')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{rep.nombre_quien_retira || 'N/A'}</TableCell>
                        <TableCell>{formatCOP(rep.costo_total)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => generarComprobanteEntrega(rep)}
                            title="Descargar comprobante de entrega"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
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
                    <Label htmlFor="cedula_cliente">Cédula del Cliente *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cedula_cliente"
                        value={cedulaBusqueda}
                        onChange={(e) => setCedulaBusqueda(e.target.value)}
                        onBlur={() => buscarClientePorCedula(cedulaBusqueda)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            buscarClientePorCedula(cedulaBusqueda);
                          }
                        }}
                        placeholder="Ingresa la cédula"
                        disabled={buscandoCliente}
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => buscarClientePorCedula(cedulaBusqueda)}
                        disabled={buscandoCliente}
                      >
                        Buscar
                      </Button>
                    </div>
                    {clienteEncontrado && (
                      <p className="text-sm text-muted-foreground">
                        Cliente: <span className="font-medium">{clienteEncontrado.nombre}</span>
                      </p>
                    )}
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

                <div className="space-y-2">
                  <Label htmlFor="fotos">Fotos del Producto (máximo 4)</Label>
                  <Input
                    id="fotos"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFotoChange}
                    className="cursor-pointer"
                  />
                  {fotosSeleccionadas.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {fotosSeleccionadas.length} foto(s) seleccionada(s)
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={uploadingFotos}>
                  {uploadingFotos ? 'Subiendo fotos...' : 'Registrar Reparación'}
                </Button>
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
