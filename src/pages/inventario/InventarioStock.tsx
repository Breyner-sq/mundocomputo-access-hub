import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Package } from 'lucide-react';
import { format } from 'date-fns';

interface Product {
  id: string;
  nombre: string;
  codigo_barras: string | null;
}

interface InventoryBatch {
  id: string;
  producto_id: string;
  cantidad: number;
  precio_compra: number;
  fecha_ingreso: string;
  notas: string | null;
  created_at: string;
  productos: Product;
}

export default function InventarioStock() {
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    producto_id: '',
    cantidad: '',
    precio_compra: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    notas: '',
  });

  useEffect(() => {
    fetchBatches();
    fetchProducts();
  }, []);

  const fetchBatches = async () => {
    const { data, error } = await supabase
      .from('lotes_inventario')
      .select('*, productos(id, nombre, codigo_barras)')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los lotes',
        variant: 'destructive',
      });
      return;
    }

    setBatches(data || []);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('id, nombre, codigo_barras')
      .order('nombre');

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos',
        variant: 'destructive',
      });
      return;
    }

    setProducts(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('lotes_inventario').insert([
      {
        producto_id: formData.producto_id,
        cantidad: parseInt(formData.cantidad),
        precio_compra: parseFloat(formData.precio_compra),
        fecha_ingreso: formData.fecha_ingreso,
        notas: formData.notas || null,
      },
    ]);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear el lote',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    toast({
      title: 'Éxito',
      description: 'Lote creado correctamente',
    });

    setFormData({
      producto_id: '',
      cantidad: '',
      precio_compra: '',
      fecha_ingreso: new Date().toISOString().split('T')[0],
      notas: '',
    });

    setOpen(false);
    setLoading(false);
    fetchBatches();
  };

  const getTotalStock = (productId: string) => {
    return batches
      .filter(b => b.producto_id === productId)
      .reduce((sum, b) => sum + b.cantidad, 0);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Control de Stock</h2>
            <p className="text-muted-foreground">Gestiona los lotes de inventario</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Lote
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ingresar Nuevo Lote</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Producto</Label>
                  <Select
                    value={formData.producto_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, producto_id: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cantidad">Cantidad</Label>
                  <Input
                    id="cantidad"
                    type="number"
                    min="1"
                    value={formData.cantidad}
                    onChange={(e) =>
                      setFormData({ ...formData, cantidad: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precio_compra">Precio de Compra</Label>
                  <Input
                    id="precio_compra"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio_compra}
                    onChange={(e) =>
                      setFormData({ ...formData, precio_compra: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha_ingreso">Fecha de Ingreso</Label>
                  <Input
                    id="fecha_ingreso"
                    type="date"
                    value={formData.fecha_ingreso}
                    onChange={(e) =>
                      setFormData({ ...formData, fecha_ingreso: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notas">Notas (opcional)</Label>
                  <Textarea
                    id="notas"
                    value={formData.notas}
                    onChange={(e) =>
                      setFormData({ ...formData, notas: e.target.value })
                    }
                    placeholder="Información adicional sobre el lote"
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Creando...' : 'Crear Lote'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <Package className="inline mr-2 h-5 w-5" />
              Lotes de Inventario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio Compra</TableHead>
                  <TableHead>Fecha Ingreso</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No hay lotes registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  batches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">
                        {batch.productos.nombre}
                      </TableCell>
                      <TableCell>{batch.cantidad}</TableCell>
                      <TableCell>${batch.precio_compra.toFixed(2)}</TableCell>
                      <TableCell>{format(new Date(batch.fecha_ingreso), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {batch.notas || '-'}
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
