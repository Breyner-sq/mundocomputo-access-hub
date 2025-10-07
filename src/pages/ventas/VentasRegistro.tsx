import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingCart, FileDown, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Cliente {
  id: string;
  nombre: string;
  email: string;
}

interface Producto {
  id: string;
  nombre: string;
  precio_venta: number;
}

interface VentaItem {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface Venta {
  id: string;
  cliente_id: string;
  vendedor_id: string;
  total: number;
  fecha: string;
  clientes: { nombre: string; email: string };
  profiles: { nombre_completo: string };
}

export default function VentasRegistro() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [selectedCliente, setSelectedCliente] = useState('');
  const [items, setItems] = useState<VentaItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    producto_id: '',
    cantidad: 1,
  });

  useEffect(() => {
    fetchClientes();
    fetchProductos();
    fetchVentas();
  }, []);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nombre, email')
        .eq('activo', true);

      if (error) throw error;
      setClientes(data || []);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, precio_venta');

      if (error) throw error;
      setProductos(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchVentas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          *,
          clientes (nombre, email),
          profiles (nombre_completo)
        `)
        .order('fecha', { ascending: false });

      if (error) throw error;
      setVentas(data || []);
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

  const addItem = () => {
    if (!currentItem.producto_id || currentItem.cantidad <= 0) {
      toast({
        title: 'Error',
        description: 'Seleccione un producto y cantidad válida',
        variant: 'destructive',
      });
      return;
    }

    const producto = productos.find(p => p.id === currentItem.producto_id);
    if (!producto) return;

    const newItem: VentaItem = {
      producto_id: currentItem.producto_id,
      cantidad: currentItem.cantidad,
      precio_unitario: producto.precio_venta,
      subtotal: producto.precio_venta * currentItem.cantidad,
    };

    setItems([...items, newItem]);
    setCurrentItem({ producto_id: '', cantidad: 1 });
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCliente || items.length === 0) {
      toast({
        title: 'Error',
        description: 'Seleccione un cliente y agregue al menos un producto',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const total = calculateTotal();

      const { data: venta, error: ventaError } = await supabase
        .from('ventas')
        .insert([{
          cliente_id: selectedCliente,
          vendedor_id: user?.id,
          total,
        }])
        .select()
        .single();

      if (ventaError) throw ventaError;

      const itemsToInsert = items.map(item => ({
        venta_id: venta.id,
        ...item,
      }));

      const { error: itemsError } = await supabase
        .from('venta_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      const cliente = clientes.find(c => c.id === selectedCliente);
      if (cliente) {
        await sendInvoice(venta.id, cliente, items, total);
      }

      toast({
        title: 'Venta registrada',
        description: 'La venta ha sido registrada y la factura enviada por correo',
      });

      handleCloseDialog();
      fetchVentas();
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

  const sendInvoice = async (ventaId: string, cliente: Cliente, items: VentaItem[], total: number) => {
    try {
      const itemsData = items.map(item => {
        const producto = productos.find(p => p.id === item.producto_id);
        return {
          product: producto?.nombre || 'Producto',
          quantity: item.cantidad,
          price: item.precio_unitario,
          subtotal: item.subtotal,
        };
      });

      await supabase.functions.invoke('send-invoice', {
        body: {
          clientEmail: cliente.email,
          clientName: cliente.nombre,
          invoiceNumber: ventaId.substring(0, 8),
          items: itemsData,
          total,
          date: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error sending invoice:', error);
    }
  };

  const exportSalesReport = async () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Reporte de Ventas', 14, 20);
    
    const tableData = ventas.map(venta => [
      format(new Date(venta.fecha), 'dd/MM/yyyy HH:mm', { locale: es }),
      venta.clientes.nombre,
      venta.profiles?.nombre_completo || 'N/A',
      `$${venta.total.toFixed(2)}`,
    ]);

    autoTable(doc, {
      head: [['Fecha', 'Cliente', 'Vendedor', 'Total']],
      body: tableData,
      startY: 30,
    });

    doc.save(`reporte-ventas-${format(new Date(), 'yyyy-MM-dd')}.pdf`);

    toast({
      title: 'Reporte exportado',
      description: 'El reporte PDF ha sido generado',
    });
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setSelectedCliente('');
    setItems([]);
    setCurrentItem({ producto_id: '', cantidad: 1 });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Registro de Ventas</h2>
            <p className="text-muted-foreground">Gestiona las ventas realizadas</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportSalesReport}>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar Reporte
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Nueva Venta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Registrar Nueva Venta</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select value={selectedCliente} onValueChange={setSelectedCliente} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Agregar Productos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <Label>Producto</Label>
                          <Select
                            value={currentItem.producto_id}
                            onValueChange={(value) => setCurrentItem({ ...currentItem, producto_id: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un producto" />
                            </SelectTrigger>
                            <SelectContent>
                              {productos.map((producto) => (
                                <SelectItem key={producto.id} value={producto.id}>
                                  {producto.nombre} - ${producto.precio_venta}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Cantidad</Label>
                          <Input
                            type="number"
                            min="1"
                            value={currentItem.cantidad}
                            onChange={(e) => setCurrentItem({ ...currentItem, cantidad: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                      </div>
                      <Button type="button" onClick={addItem} variant="outline" className="w-full">
                        Agregar Producto
                      </Button>

                      {items.length > 0 && (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Producto</TableHead>
                              <TableHead>Cantidad</TableHead>
                              <TableHead>Precio</TableHead>
                              <TableHead>Subtotal</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map((item, index) => {
                              const producto = productos.find(p => p.id === item.producto_id);
                              return (
                                <TableRow key={index}>
                                  <TableCell>{producto?.nombre}</TableCell>
                                  <TableCell>{item.cantidad}</TableCell>
                                  <TableCell>${item.precio_unitario.toFixed(2)}</TableCell>
                                  <TableCell>${item.subtotal.toFixed(2)}</TableCell>
                                  <TableCell>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeItem(index)}
                                    >
                                      Eliminar
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            <TableRow>
                              <TableCell colSpan={3} className="text-right font-bold">Total:</TableCell>
                              <TableCell className="font-bold">${calculateTotal().toFixed(2)}</TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? 'Procesando...' : 'Registrar Venta'}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ventas Realizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      {loading ? 'Cargando...' : 'No hay ventas registradas'}
                    </TableCell>
                  </TableRow>
                ) : (
                  ventas.map((venta) => (
                    <TableRow key={venta.id}>
                      <TableCell>
                        {format(new Date(venta.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell>{venta.clientes.nombre}</TableCell>
                      <TableCell>{venta.profiles?.nombre_completo || 'N/A'}</TableCell>
                      <TableCell className="font-medium">${venta.total.toFixed(2)}</TableCell>
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
