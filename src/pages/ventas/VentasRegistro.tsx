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
import { ShoppingCart, FileDown, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCOP } from '@/lib/formatCurrency';

interface Cliente {
  id: string;
  nombre: string;
  email: string;
  cedula: string;
  activo: boolean;
}

interface Producto {
  id: string;
  nombre: string;
  precio_venta: number;
  stock_actual?: number;
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
  numero_factura: string;
  vendedor?: {
    nombre_completo: string;
  };
  items?: Array<{
    cantidad: number;
    producto?: {
      nombre: string;
    };
  }>;
}

export default function VentasRegistro() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [cedulaInput, setCedulaInput] = useState('');
  const [items, setItems] = useState<VentaItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    producto_id: '',
    cantidad: 1,
  });
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState<'fecha' | 'producto' | 'vendedor'>('fecha');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    type: 'all',
    producto_id: '',
    startDate: '',
    endDate: '',
    month: '',
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
        .select('id, nombre, email, cedula, activo')
        .eq('activo', true);

      if (error) throw error;
      setClientes(data || []);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchProductos = async () => {
    try {
      const { data: productosData, error: productosError } = await supabase
        .from('productos')
        .select('id, nombre, precio_venta')
        .order('nombre');

      if (productosError) throw productosError;

      // Fetch stock for each product
      const { data: lotesData, error: lotesError } = await supabase
        .from('lotes_inventario')
        .select('producto_id, cantidad');

      if (lotesError) throw lotesError;

      // Calculate total stock for each product
      const productosConStock = (productosData || []).map(producto => {
        const stock_actual = (lotesData || [])
          .filter(lote => lote.producto_id === producto.id)
          .reduce((sum, lote) => sum + lote.cantidad, 0);
        return { ...producto, stock_actual };
      });

      setProductos(productosConStock);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos',
        variant: 'destructive',
      });
    }
  };

  const fetchVentas = async () => {
    setLoading(true);
    try {
      const { data: ventasData, error: ventasError } = await supabase
        .from('ventas')
        .select(`
          id, 
          cliente_id, 
          vendedor_id, 
          total, 
          fecha,
          numero_factura,
          created_at,
          vendedor:profiles!ventas_vendedor_id_fkey(nombre_completo)
        `)
        .order('fecha', { ascending: false });

      if (ventasError) throw ventasError;

      // Fetch items for each venta
      const ventasConItems = await Promise.all(
        (ventasData || []).map(async (venta) => {
          const { data: itemsData } = await supabase
            .from('venta_items')
            .select(`
              cantidad,
              producto:productos(nombre)
            `)
            .eq('venta_id', venta.id);

          return {
            ...venta,
            items: itemsData || []
          };
        })
      );

      setVentas(ventasConItems);
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

    // Verificar stock disponible
    const stockDisponible = producto.stock_actual || 0;
    const cantidadYaEnItems = items
      .filter(item => item.producto_id === currentItem.producto_id)
      .reduce((sum, item) => sum + item.cantidad, 0);
    
    const stockRestante = stockDisponible - cantidadYaEnItems;

    if (stockRestante <= 0) {
      toast({
        title: 'Sin stock',
        description: `No hay stock disponible de ${producto.nombre}`,
        variant: 'destructive',
      });
      return;
    }

    if (currentItem.cantidad > stockRestante) {
      toast({
        title: 'Stock insuficiente',
        description: `Solo hay ${stockRestante} unidades disponibles de ${producto.nombre}`,
        variant: 'destructive',
      });
      return;
    }

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

  const handleClientSearch = async () => {
    if (!cedulaInput.trim()) {
      toast({
        title: 'Error',
        description: 'Ingrese una cédula para buscar',
        variant: 'destructive',
      });
      return;
    }

    const cliente = clientes.find(c => c.cedula === cedulaInput.trim());
    
    if (!cliente) {
      toast({
        title: 'Cliente no encontrado',
        description: 'No se encontró un cliente con esa cédula',
        variant: 'destructive',
      });
      return;
    }

    if (!cliente.activo) {
      toast({
        title: 'Cliente inactivo',
        description: 'Este cliente está inactivo',
        variant: 'destructive',
      });
      return;
    }

    setSelectedCliente(cliente);
    toast({
      title: 'Cliente encontrado',
      description: `Cliente: ${cliente.nombre}`,
    });
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

      // Preparar items en formato JSONB para la función
      const itemsJson = items.map(item => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
      }));

      // Llamar a la función RPC que maneja toda la transacción
      const { data, error } = await supabase.rpc('procesar_venta', {
        p_cliente_id: selectedCliente.id,
        p_vendedor_id: user?.id,
        p_items: itemsJson,
      });

      if (error) {
        console.error('Error en RPC:', error);
        throw new Error(error.message);
      }

      // Verificar el resultado de la función
      const resultado = data as { success: boolean; venta_id?: string; total?: number; error?: string; message: string };

      if (!resultado.success) {
        throw new Error(resultado.error || 'Error al procesar la venta');
      }

      // Obtener los datos de la venta creada
      const { data: venta, error: ventaError } = await supabase
        .from('ventas')
        .select('*')
        .eq('id', resultado.venta_id)
        .single();

      if (ventaError) {
        console.error('Error obteniendo venta:', ventaError);
      }

      // Enviar factura por correo
      try {
        await sendInvoice(resultado.venta_id!, selectedCliente, items, total);
      } catch (emailError) {
        console.error('Error enviando factura:', emailError);
        // No fallar si el email falla
      }

      toast({
        title: 'Venta registrada exitosamente',
        description: `Venta ${venta?.numero_factura || resultado.venta_id!.substring(0, 8)} registrada. Total: ${formatCOP(resultado.total!)}`,
      });

      handleCloseDialog();
      fetchVentas();
      fetchProductos();
    } catch (error: any) {
      console.error('Error en venta:', error);
      
      toast({
        title: 'Error al registrar venta',
        description: error.message || 'Ocurrió un error al procesar la venta',
        variant: 'destructive',
      });
      
      // Recargar datos para asegurar consistencia
      fetchProductos();
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

  const generateInvoice = async (ventaId: string) => {
    try {
      const { data: venta, error: ventaError } = await supabase
        .from('ventas')
        .select(`
          *,
          vendedor:profiles!ventas_vendedor_id_fkey(nombre_completo)
        `)
        .eq('id', ventaId)
        .single();

      if (ventaError) throw ventaError;

      const { data: items, error: itemsError } = await supabase
        .from('venta_items')
        .select(`
          *,
          producto:productos(nombre)
        `)
        .eq('venta_id', ventaId);

      if (itemsError) throw itemsError;

      const cliente = clientes.find(c => c.id === venta.cliente_id);

      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text('FACTURA DE VENTA', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Factura No: ${ventaId.substring(0, 8).toUpperCase()}`, 14, 40);
      doc.text(`Fecha: ${format(new Date(venta.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}`, 14, 48);
      
      doc.text('CLIENTE:', 14, 62);
      doc.setFontSize(10);
      doc.text(`Nombre: ${cliente?.nombre || 'N/A'}`, 14, 70);
      doc.text(`Cédula: ${cliente?.cedula || 'N/A'}`, 14, 76);
      doc.text(`Email: ${cliente?.email || 'N/A'}`, 14, 82);
      
      doc.setFontSize(12);
      doc.text('VENDEDOR:', 14, 96);
      doc.setFontSize(10);
      doc.text(`${venta.vendedor?.nombre_completo || 'N/A'}`, 14, 104);

      const tableData = items.map(item => [
        item.producto?.nombre || 'N/A',
        item.cantidad.toString(),
        `$${item.precio_unitario.toFixed(2)}`,
        `$${item.subtotal.toFixed(2)}`,
      ]);

      autoTable(doc, {
        head: [['Producto', 'Cantidad', 'Precio Unit.', 'Subtotal']],
        body: tableData,
        startY: 115,
        foot: [['', '', 'TOTAL:', `$${venta.total.toFixed(2)}`]],
        footStyles: { fontStyle: 'bold', fillColor: [240, 240, 240] },
      });

      doc.save(`factura-${ventaId.substring(0, 8)}.pdf`);

      toast({
        title: 'Factura generada',
        description: 'La factura ha sido descargada',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo generar la factura',
        variant: 'destructive',
      });
    }
  };

  const exportSalesReport = async () => {
    try {
      let filteredData = [...ventas];

      // Apply filters based on export options
      if (exportOptions.type === 'producto' && exportOptions.producto_id) {
        // Fetch all venta_items for the selected product
        const { data: ventaItems, error } = await supabase
          .from('venta_items')
          .select('venta_id')
          .eq('producto_id', exportOptions.producto_id);
        
        if (error) throw error;
        
        const ventaIdsWithProduct = new Set(ventaItems?.map(item => item.venta_id) || []);
        filteredData = filteredData.filter(venta => ventaIdsWithProduct.has(venta.id));
      }

      if (exportOptions.type === 'rango' && exportOptions.startDate && exportOptions.endDate) {
        const start = new Date(exportOptions.startDate);
        const end = new Date(exportOptions.endDate);
        end.setHours(23, 59, 59, 999);
        
        filteredData = filteredData.filter(venta => {
          const ventaDate = new Date(venta.fecha);
          return ventaDate >= start && ventaDate <= end;
        });
      }

      if (exportOptions.type === 'mes' && exportOptions.month) {
        const [year, month] = exportOptions.month.split('-').map(Number);
        filteredData = filteredData.filter(venta => {
          const ventaDate = new Date(venta.fecha);
          return ventaDate.getFullYear() === year && ventaDate.getMonth() === month - 1;
        });
      }

      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('Reporte de Ventas', 14, 20);
      
      // Add filter information
      doc.setFontSize(10);
      let yPos = 30;
      if (exportOptions.type === 'producto' && exportOptions.producto_id) {
        const producto = productos.find(p => p.id === exportOptions.producto_id);
        doc.text(`Filtrado por producto: ${producto?.nombre || 'N/A'}`, 14, yPos);
        yPos += 6;
      }
      if (exportOptions.type === 'rango' && exportOptions.startDate && exportOptions.endDate) {
        doc.text(`Rango: ${format(new Date(exportOptions.startDate), 'dd/MM/yyyy')} - ${format(new Date(exportOptions.endDate), 'dd/MM/yyyy')}`, 14, yPos);
        yPos += 6;
      }
      if (exportOptions.type === 'mes' && exportOptions.month) {
        const [year, month] = exportOptions.month.split('-');
        doc.text(`Mes: ${month}/${year}`, 14, yPos);
        yPos += 6;
      }

      const tableData = filteredData.map(venta => {
        const cliente = clientes.find(c => c.id === venta.cliente_id);
        return [
          format(new Date(venta.fecha), 'dd/MM/yyyy HH:mm', { locale: es }),
          cliente?.nombre || 'N/A',
          venta.vendedor?.nombre_completo || 'N/A',
          formatCOP(venta.total),
        ];
      });

      autoTable(doc, {
        head: [['Fecha', 'Cliente', 'Vendedor', 'Total']],
        body: tableData,
        startY: yPos + 5,
        foot: [['', '', 'TOTAL:', formatCOP(filteredData.reduce((sum, v) => sum + v.total, 0))]],
        footStyles: { fontStyle: 'bold', fillColor: [240, 240, 240] },
      });

      doc.save(`reporte-ventas-${format(new Date(), 'yyyy-MM-dd')}.pdf`);

      toast({
        title: 'Reporte exportado',
        description: 'El reporte PDF ha sido generado',
      });
      
      setExportDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'No se pudo generar el reporte',
        variant: 'destructive',
      });
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setSelectedCliente(null);
    setCedulaInput('');
    setItems([]);
    setCurrentItem({ producto_id: '', cantidad: 1 });
  };

  const filteredVentas = ventas
    .filter(venta => {
      const cliente = clientes.find(c => c.id === venta.cliente_id);
      return cliente?.nombre.toLowerCase().includes(searchFilter.toLowerCase()) ||
             cliente?.cedula.toLowerCase().includes(searchFilter.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === 'fecha') {
        const dateA = new Date(a.fecha).getTime();
        const dateB = new Date(b.fecha).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      if (sortBy === 'vendedor') {
        const vendedorA = a.vendedor?.nombre_completo || '';
        const vendedorB = b.vendedor?.nombre_completo || '';
        return sortOrder === 'asc' 
          ? vendedorA.localeCompare(vendedorB)
          : vendedorB.localeCompare(vendedorA);
      }
      if (sortBy === 'producto') {
        const productoA = a.items?.[0]?.producto?.nombre || '';
        const productoB = b.items?.[0]?.producto?.nombre || '';
        return sortOrder === 'asc'
          ? productoA.localeCompare(productoB)
          : productoB.localeCompare(productoA);
      }
      return 0;
    });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Registro de Ventas</h2>
            <p className="text-muted-foreground">Gestiona las ventas realizadas</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar Reporte
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Exportar Reporte de Ventas</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Tipo de Exportación</Label>
                    <Select
                      value={exportOptions.type}
                      onValueChange={(value) => setExportOptions({ ...exportOptions, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las ventas</SelectItem>
                        <SelectItem value="producto">Por producto</SelectItem>
                        <SelectItem value="rango">Rango de fechas</SelectItem>
                        <SelectItem value="mes">Por mes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {exportOptions.type === 'producto' && (
                    <div>
                      <Label>Producto</Label>
                      <Select
                        value={exportOptions.producto_id}
                        onValueChange={(value) => setExportOptions({ ...exportOptions, producto_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un producto" />
                        </SelectTrigger>
                        <SelectContent>
                          {productos.map((producto) => (
                            <SelectItem key={producto.id} value={producto.id}>
                              {producto.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {exportOptions.type === 'rango' && (
                    <>
                      <div>
                        <Label>Fecha Inicio</Label>
                        <Input
                          type="date"
                          value={exportOptions.startDate}
                          onChange={(e) => setExportOptions({ ...exportOptions, startDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Fecha Fin</Label>
                        <Input
                          type="date"
                          value={exportOptions.endDate}
                          onChange={(e) => setExportOptions({ ...exportOptions, endDate: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  {exportOptions.type === 'mes' && (
                    <div>
                      <Label>Mes</Label>
                      <Input
                        type="month"
                        value={exportOptions.month}
                        onChange={(e) => setExportOptions({ ...exportOptions, month: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={exportSalesReport} className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar PDF
                    </Button>
                    <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
                    <Label>Buscar Cliente por Cédula</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ingrese la cédula del cliente"
                        value={cedulaInput}
                        onChange={(e) => setCedulaInput(e.target.value)}
                        disabled={!!selectedCliente}
                      />
                      {!selectedCliente ? (
                        <Button type="button" onClick={handleClientSearch}>
                          Buscar
                        </Button>
                      ) : (
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setSelectedCliente(null);
                            setCedulaInput('');
                          }}
                        >
                          Cambiar
                        </Button>
                      )}
                    </div>
                    {selectedCliente && (
                      <div className="p-3 bg-muted rounded-md">
                        <p className="font-medium">{selectedCliente.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedCliente.email} - {selectedCliente.cedula}
                        </p>
                      </div>
                    )}
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
                                <SelectItem 
                                  key={producto.id} 
                                  value={producto.id}
                                  disabled={(producto.stock_actual || 0) <= 0}
                                >
                                  {producto.nombre} - ${producto.precio_venta} 
                                  {(producto.stock_actual || 0) > 0 
                                    ? ` (Stock: ${producto.stock_actual})` 
                                    : ' (Sin stock)'}
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
                        <div className="max-h-[300px] overflow-y-auto border rounded-md">
                          <Table>
                            <TableHeader className="sticky top-0 bg-background">
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
                                    <TableCell>{formatCOP(item.precio_unitario)}</TableCell>
                                    <TableCell>{formatCOP(item.subtotal)}</TableCell>
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
                                <TableCell className="font-bold">{formatCOP(calculateTotal())}</TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
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
            <div className="mb-4 space-y-4">
              <Input
                placeholder="Filtrar por cliente (nombre o cédula)..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Ordenar por</Label>
                  <Select
                    value={sortBy}
                    onValueChange={(value: 'fecha' | 'producto' | 'vendedor') => setSortBy(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fecha">Fecha</SelectItem>
                      <SelectItem value="producto">Producto</SelectItem>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Orden</Label>
                  <Select
                    value={sortOrder}
                    onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascendente</SelectItem>
                      <SelectItem value="desc">Descendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Factura</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVentas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      {loading ? 'Cargando...' : searchFilter ? 'No se encontraron ventas' : 'No hay ventas registradas'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVentas.map((venta) => {
                    const cliente = clientes.find(c => c.id === venta.cliente_id);
                    const productosVendidos = venta.items?.map(item => 
                      `${item.producto?.nombre || 'N/A'} (${item.cantidad})`
                    ).join(', ') || 'N/A';
                    
                    return (
                      <TableRow key={venta.id}>
                        <TableCell className="font-medium">{venta.numero_factura}</TableCell>
                        <TableCell>
                          {format(new Date(venta.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </TableCell>
                        <TableCell>{cliente?.nombre || 'N/A'}</TableCell>
                        <TableCell>{venta.vendedor?.nombre_completo || 'N/A'}</TableCell>
                        <TableCell className="max-w-xs truncate" title={productosVendidos}>
                          {productosVendidos}
                        </TableCell>
                        <TableCell className="font-medium">{formatCOP(venta.total)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => generateInvoice(venta.id)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Ver Factura
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
