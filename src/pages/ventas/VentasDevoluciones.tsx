import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { PackageX, FileText, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { formatCOP } from '@/lib/formatCurrency';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Devolucion {
  id: string;
  venta_id: string;
  cliente_id: string;
  producto_id: string;
  cantidad: number;
  motivo: string;
  estado: string;
  fecha_devolucion: string;
  notas: string | null;
  ventas: {
    numero_factura: string;
    total: number;
  };
  clientes: {
    nombre: string;
    cedula: string;
  };
  productos: {
    nombre: string;
    precio_venta: number;
  };
}

export default function VentasDevoluciones() {
  const { user } = useAuth();
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    numero_factura: '',
    producto_id: '',
    cantidad: '',
    motivo: '',
    notas: '',
  });

  const [ventaEncontrada, setVentaEncontrada] = useState<any>(null);
  const [productosVenta, setProductosVenta] = useState<any[]>([]);

  useEffect(() => {
    fetchDevoluciones();
  }, []);

  const fetchDevoluciones = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('devoluciones')
        .select(`
          *,
          ventas!inner(numero_factura, total),
          clientes!inner(nombre, cedula),
          productos!inner(nombre, precio_venta)
        `)
        .order('fecha_devolucion', { ascending: false });

      if (error) throw error;
      setDevoluciones(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const buscarVenta = async () => {
    if (!formData.numero_factura.trim()) {
      toast({
        title: 'Error',
        description: 'Ingrese un número de factura',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: venta, error: ventaError } = await supabase
        .from('ventas')
        .select('*')
        .eq('numero_factura', formData.numero_factura.trim())
        .single();

      if (ventaError) throw new Error('Factura no encontrada');

      setVentaEncontrada(venta);

      // Obtener productos de la venta
      const { data: items, error: itemsError } = await supabase
        .from('venta_items')
        .select(`
          *,
          producto:productos!inner(id, nombre, precio_venta)
        `)
        .eq('venta_id', venta.id);

      if (itemsError) throw itemsError;

      setProductosVenta(items || []);

      toast({
        title: 'Factura encontrada',
        description: `Factura ${formData.numero_factura} válida`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setVentaEncontrada(null);
      setProductosVenta([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ventaEncontrada || !formData.producto_id || !formData.cantidad || !formData.motivo) {
      toast({
        title: 'Error',
        description: 'Complete todos los campos requeridos',
        variant: 'destructive',
      });
      return;
    }

    const cantidad = parseInt(formData.cantidad);
    const productoVenta = productosVenta.find(p => p.producto.id === formData.producto_id);

    if (!productoVenta) {
      toast({
        title: 'Error',
        description: 'Producto no válido',
        variant: 'destructive',
      });
      return;
    }

    if (cantidad > productoVenta.cantidad) {
      toast({
        title: 'Error',
        description: `Solo se vendieron ${productoVenta.cantidad} unidades de este producto`,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('devoluciones').insert([
        {
          venta_id: ventaEncontrada.id,
          cliente_id: ventaEncontrada.cliente_id,
          vendedor_id: user?.id,
          producto_id: formData.producto_id,
          cantidad,
          motivo: formData.motivo,
          notas: formData.notas || null,
          estado: 'procesada',
        },
      ]);

      if (error) throw error;

      toast({
        title: 'Devolución registrada',
        description: 'La devolución ha sido registrada exitosamente. El stock no se ha modificado ya que el producto está defectuoso.',
      });

      handleCloseDialog();
      fetchDevoluciones();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setFormData({
      numero_factura: '',
      producto_id: '',
      cantidad: '',
      motivo: '',
      notas: '',
    });
    setVentaEncontrada(null);
    setProductosVenta([]);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Reporte de Devoluciones', 14, 20);
    doc.setFontSize(11);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`Total devoluciones: ${devoluciones.length}`, 14, 35);

    const tableData = devoluciones.map(dev => [
      dev.ventas.numero_factura,
      format(new Date(dev.fecha_devolucion), 'dd/MM/yyyy HH:mm', { locale: es }),
      dev.clientes.nombre,
      dev.productos.nombre,
      dev.cantidad.toString(),
      dev.motivo,
      dev.estado,
    ]);

    autoTable(doc, {
      startY: 42,
      head: [['Factura', 'Fecha', 'Cliente', 'Producto', 'Cantidad', 'Motivo', 'Estado']],
      body: tableData,
    });

    doc.save(`devoluciones_${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: 'Reporte generado',
      description: 'El reporte de devoluciones ha sido descargado',
    });
  };

  const filteredDevoluciones = devoluciones.filter(dev =>
    dev.ventas.numero_factura.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dev.clientes.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dev.productos.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Devoluciones</h2>
            <p className="text-muted-foreground">Gestiona las devoluciones por garantía</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToPDF}>
              <FileText className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Devolución
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Registrar Devolución por Garantía</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="numero_factura">Número de Factura *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="numero_factura"
                        placeholder="Ej: F-12345678"
                        value={formData.numero_factura}
                        onChange={(e) => setFormData({ ...formData, numero_factura: e.target.value })}
                        required
                      />
                      <Button type="button" onClick={buscarVenta} disabled={loading}>
                        Buscar
                      </Button>
                    </div>
                  </div>

                  {ventaEncontrada && (
                    <>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm">
                          <strong>Factura:</strong> {ventaEncontrada.numero_factura}
                        </p>
                        <p className="text-sm">
                          <strong>Total:</strong> {formatCOP(ventaEncontrada.total)}
                        </p>
                        <p className="text-sm">
                          <strong>Fecha:</strong> {format(new Date(ventaEncontrada.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Producto a devolver *</Label>
                        <Select
                          value={formData.producto_id}
                          onValueChange={(value) => setFormData({ ...formData, producto_id: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un producto" />
                          </SelectTrigger>
                          <SelectContent>
                            {productosVenta.map((item) => (
                              <SelectItem key={item.producto.id} value={item.producto.id}>
                                {item.producto.nombre} (Cantidad: {item.cantidad})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cantidad">Cantidad a devolver *</Label>
                        <Input
                          id="cantidad"
                          type="number"
                          min="1"
                          value={formData.cantidad}
                          onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="motivo">Motivo de la devolución *</Label>
                        <Textarea
                          id="motivo"
                          placeholder="Describa el motivo de la devolución (producto defectuoso, daño, etc.)"
                          value={formData.motivo}
                          onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                          required
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notas">Notas adicionales (opcional)</Label>
                        <Textarea
                          id="notas"
                          placeholder="Información adicional sobre la devolución"
                          value={formData.notas}
                          onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                          rows={2}
                        />
                      </div>

                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>Importante:</strong> Esta devolución no aumentará el stock ya que el producto está defectuoso.
                        </p>
                      </div>

                      <Button type="submit" disabled={loading} className="w-full">
                        {loading ? 'Registrando...' : 'Registrar Devolución'}
                      </Button>
                    </>
                  )}
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <PackageX className="inline mr-2 h-5 w-5" />
              Historial de Devoluciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Buscar por factura, cliente o producto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Factura</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevoluciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      {searchQuery ? 'No se encontraron devoluciones' : 'No hay devoluciones registradas'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDevoluciones.map((dev) => (
                    <TableRow key={dev.id}>
                      <TableCell className="font-medium">{dev.ventas.numero_factura}</TableCell>
                      <TableCell>
                        {format(new Date(dev.fecha_devolucion), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell>{dev.clientes.nombre}</TableCell>
                      <TableCell>{dev.productos.nombre}</TableCell>
                      <TableCell>{dev.cantidad}</TableCell>
                      <TableCell className="max-w-xs truncate" title={dev.motivo}>
                        {dev.motivo}
                      </TableCell>
                      <TableCell>
                        <Badge variant={dev.estado === 'procesada' ? 'default' : 'secondary'}>
                          {dev.estado}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
