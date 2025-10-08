import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Pencil, Trash2, Search, XCircle, CheckCircle, FileDown, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  cedula: string;
  direccion: string | null;
  activo: boolean;
  created_at: string;
}

interface Venta {
  id: string;
  fecha: string;
  total: number;
  cliente_id: string;
  items?: Array<{
    cantidad: number;
    producto?: {
      nombre: string;
    };
  }>;
}

export default function VentasClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCedulaDialog, setSearchCedulaDialog] = useState(false);
  const [cedulaSearch, setCedulaSearch] = useState('');
  const [ventasCliente, setVentasCliente] = useState<Venta[]>([]);
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    cedula: '',
    direccion: '',
  });

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientes(data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingCliente) {
        const { error } = await supabase
          .from('clientes')
          .update(formData)
          .eq('id', editingCliente.id);

        if (error) throw error;

        toast({
          title: 'Cliente actualizado',
          description: 'El cliente ha sido actualizado correctamente',
        });
      } else {
        const { error } = await supabase
          .from('clientes')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: 'Cliente creado',
          description: 'El cliente ha sido creado correctamente',
        });
      }

      handleCloseDialog();
      fetchClientes();
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

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nombre: cliente.nombre,
      email: cliente.email,
      telefono: cliente.telefono || '',
      cedula: cliente.cedula,
      direccion: cliente.direccion || '',
    });
    setOpen(true);
  };

  const handleToggleActive = async (cliente: Cliente) => {
    try {
      const { error } = await supabase
        .from('clientes')
        .update({ activo: !cliente.activo })
        .eq('id', cliente.id);

      if (error) throw error;

      toast({
        title: cliente.activo ? 'Cliente desactivado' : 'Cliente activado',
        description: `El cliente ha sido ${cliente.activo ? 'desactivado' : 'activado'} correctamente`,
      });

      fetchClientes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este cliente?')) return;

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Cliente eliminado',
        description: 'El cliente ha sido eliminado correctamente',
      });

      fetchClientes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingCliente(null);
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      cedula: '',
      direccion: '',
    });
  };

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cliente.cedula.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const buscarVentasPorCedula = async () => {
    if (!cedulaSearch.trim()) {
      toast({
        title: 'Error',
        description: 'Ingrese una cédula para buscar',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data: cliente, error: clienteError } = await supabase
        .from('clientes')
        .select('*')
        .eq('cedula', cedulaSearch.trim())
        .single();

      if (clienteError) throw new Error('Cliente no encontrado');

      setClienteEncontrado(cliente);

      const { data: ventasData, error: ventasError } = await supabase
        .from('ventas')
        .select('id, fecha, total, cliente_id')
        .eq('cliente_id', cliente.id)
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

      setVentasCliente(ventasConItems);

      toast({
        title: 'Búsqueda exitosa',
        description: `Se encontraron ${ventasConItems?.length || 0} ventas para ${cliente.nombre}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setVentasCliente([]);
      setClienteEncontrado(null);
    } finally {
      setLoading(false);
    }
  };

  const exportarVentasClientePDF = () => {
    if (!clienteEncontrado || ventasCliente.length === 0) {
      toast({
        title: 'Error',
        description: 'No hay ventas para exportar',
        variant: 'destructive',
      });
      return;
    }

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Historial de Ventas', 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Cliente: ${clienteEncontrado.nombre}`, 14, 30);
    doc.text(`Cédula: ${clienteEncontrado.cedula}`, 14, 37);
    doc.text(`Total de ventas: ${ventasCliente.length}`, 14, 44);
    
    const totalGeneral = ventasCliente.reduce((sum, v) => sum + Number(v.total), 0);
    doc.text(`Monto total: $${totalGeneral.toFixed(2)}`, 14, 51);

    autoTable(doc, {
      startY: 58,
      head: [['Fecha', 'Hora', 'Productos', 'Total']],
      body: ventasCliente.map(venta => {
        const productosVendidos = venta.items?.map(item => 
          `${item.producto?.nombre || 'N/A'} (${item.cantidad})`
        ).join(', ') || 'N/A';
        
        return [
          format(new Date(venta.fecha), 'dd/MM/yyyy', { locale: es }),
          format(new Date(venta.fecha), 'HH:mm', { locale: es }),
          productosVendidos,
          `$${Number(venta.total).toFixed(2)}`,
        ];
      }),
    });

    doc.save(`ventas_${clienteEncontrado.cedula}_${Date.now()}.pdf`);

    toast({
      title: 'PDF generado',
      description: 'El reporte ha sido descargado correctamente',
    });
  };

  const exportarTodosClientesPDF = () => {
    if (clientes.length === 0) {
      toast({
        title: 'Error',
        description: 'No hay clientes para exportar',
        variant: 'destructive',
      });
      return;
    }

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Reporte de Todos los Clientes', 14, 20);
    
    doc.setFontSize(11);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`Total de clientes: ${clientes.length}`, 14, 35);

    autoTable(doc, {
      startY: 42,
      head: [['Nombre', 'Email', 'Cédula', 'Teléfono', 'Estado']],
      body: clientes.map(cliente => [
        cliente.nombre,
        cliente.email,
        cliente.cedula,
        cliente.telefono || '-',
        cliente.activo ? 'Activo' : 'Inactivo'
      ]),
    });

    doc.save(`clientes_${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: 'PDF generado',
      description: 'El reporte de todos los clientes ha sido descargado',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
            <p className="text-muted-foreground">Gestiona la información de tus clientes</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportarTodosClientesPDF}>
              <FileText className="mr-2 h-4 w-4" />
              Exportar Todos (PDF)
            </Button>
            <Dialog open={searchCedulaDialog} onOpenChange={setSearchCedulaDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Search className="mr-2 h-4 w-4" />
                  Buscar Ventas
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Buscar Ventas por Cliente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="cedulaSearch">Número de Cédula</Label>
                      <Input
                        id="cedulaSearch"
                        placeholder="Ingrese la cédula del cliente"
                        value={cedulaSearch}
                        onChange={(e) => setCedulaSearch(e.target.value)}
                      />
                    </div>
                    <Button onClick={buscarVentasPorCedula} disabled={loading} className="mt-6">
                      <Search className="mr-2 h-4 w-4" />
                      {loading ? 'Buscando...' : 'Buscar'}
                    </Button>
                  </div>

                  {clienteEncontrado && (
                    <>
                      <Card>
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle>Ventas de {clienteEncontrado.nombre}</CardTitle>
                            <Button onClick={exportarVentasClientePDF} size="sm">
                              <FileDown className="mr-2 h-4 w-4" />
                              Exportar PDF
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Hora</TableHead>
                                <TableHead>Productos</TableHead>
                                <TableHead>Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {ventasCliente.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    No hay ventas registradas para este cliente
                                  </TableCell>
                                </TableRow>
                              ) : (
                                ventasCliente.map((venta) => {
                                  const productosVendidos = venta.items?.map(item => 
                                    `${item.producto?.nombre || 'N/A'} (${item.cantidad})`
                                  ).join(', ') || 'N/A';
                                  
                                  return (
                                    <TableRow key={venta.id}>
                                      <TableCell>
                                        {format(new Date(venta.fecha), 'dd/MM/yyyy', { locale: es })}
                                      </TableCell>
                                      <TableCell>
                                        {format(new Date(venta.fecha), 'HH:mm', { locale: es })}
                                      </TableCell>
                                      <TableCell className="max-w-xs truncate" title={productosVendidos}>
                                        {productosVendidos}
                                      </TableCell>
                                      <TableCell className="font-medium">
                                        ${Number(venta.total).toFixed(2)}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })
                              )}
                            </TableBody>
                          </Table>
                          {ventasCliente.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">Total General:</span>
                                <span className="text-xl font-bold">
                                  ${ventasCliente.reduce((sum, v) => sum + Number(v.total), 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingCliente(null)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Nuevo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre Completo *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cedula">Número de Cédula *</Label>
                  <Input
                    id="cedula"
                    value={formData.cedula}
                    onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Guardando...' : editingCliente ? 'Actualizar' : 'Crear'}
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
            <CardTitle>Lista de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Buscar por nombre o cédula..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      {loading ? 'Cargando...' : searchQuery ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nombre}</TableCell>
                      <TableCell>{cliente.email}</TableCell>
                      <TableCell>{cliente.telefono || 'N/A'}</TableCell>
                      <TableCell>{cliente.cedula}</TableCell>
                      <TableCell>
                        <Badge variant={cliente.activo ? 'default' : 'secondary'}>
                          {cliente.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(cliente)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(cliente)}
                          >
                            {cliente.activo ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(cliente.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
