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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Package, Edit, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Category {
  id: string;
  nombre: string;
}

interface Product {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria_id: string | null;
  precio_venta: number;
  codigo_barras: string | null;
  categorias: Category | null;
}

export default function InventarioProductos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria_id: '',
    precio_venta: '',
    codigo_barras: '',
    stock_minimo: '10',
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('*, categorias(id, nombre)')
      .order('created_at', { ascending: false });

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

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categorias')
      .select('id, nombre')
      .order('nombre');

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las categorías',
        variant: 'destructive',
      });
      return;
    }

    setCategories(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editingProduct) {
      // Actualizar producto existente
      const { error } = await supabase
        .from('productos')
        .update({
          nombre: formData.nombre,
          descripcion: formData.descripcion || null,
          categoria_id: formData.categoria_id || null,
          precio_venta: parseFloat(formData.precio_venta),
          codigo_barras: formData.codigo_barras || null,
          stock_minimo: parseInt(formData.stock_minimo),
        })
        .eq('id', editingProduct.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudo actualizar el producto',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      toast({
        title: 'Éxito',
        description: 'Producto actualizado correctamente',
      });
    } else {
      // Crear nuevo producto
      const { error } = await supabase.from('productos').insert([
        {
          nombre: formData.nombre,
          descripcion: formData.descripcion || null,
          categoria_id: formData.categoria_id || null,
          precio_venta: parseFloat(formData.precio_venta),
          codigo_barras: formData.codigo_barras || null,
          stock_minimo: parseInt(formData.stock_minimo),
        },
      ]);

      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudo crear el producto',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      toast({
        title: 'Éxito',
        description: 'Producto creado correctamente',
      });
    }

    setFormData({
      nombre: '',
      descripcion: '',
      categoria_id: '',
      precio_venta: '',
      codigo_barras: '',
      stock_minimo: '10',
    });

    setOpen(false);
    setEditingProduct(null);
    setLoading(false);
    fetchProducts();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      nombre: product.nombre,
      descripcion: product.descripcion || '',
      categoria_id: product.categoria_id || '',
      precio_venta: product.precio_venta.toString(),
      codigo_barras: product.codigo_barras || '',
      stock_minimo: (product as any).stock_minimo?.toString() || '10',
    });
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    // Verificar si hay lotes asociados a este producto
    const { count, error: countError } = await supabase
      .from('lotes_inventario')
      .select('id', { count: 'exact', head: true })
      .eq('producto_id', deleteId);

    if (countError) {
      toast({
        title: 'Error',
        description: 'No se pudo verificar los lotes asociados',
        variant: 'destructive',
      });
      return;
    }

    if (count && count > 0) {
      toast({
        title: 'No se puede eliminar',
        description: `Este producto tiene ${count} lote(s) de inventario asociado(s). Elimina los lotes primero.`,
        variant: 'destructive',
      });
      setDeleteId(null);
      return;
    }

    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', deleteId);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el producto',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Éxito',
      description: 'Producto eliminado correctamente',
    });

    setDeleteId(null);
    fetchProducts();
  };

  const handleCloseDialog = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEditingProduct(null);
      setFormData({
        nombre: '',
        descripcion: '',
        categoria_id: '',
        precio_venta: '',
        codigo_barras: '',
        stock_minimo: '10',
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Reporte de Productos', 14, 22);
    doc.setFontSize(11);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);
    
    const tableData = products.map(product => [
      product.nombre,
      product.descripcion || '-',
      product.categorias?.nombre || '-',
      `$${product.precio_venta.toFixed(2)}`,
      product.codigo_barras || '-'
    ]);
    
    autoTable(doc, {
      head: [['Nombre', 'Descripción', 'Categoría', 'Precio Venta', 'Código Barras']],
      body: tableData,
      startY: 35,
    });
    
    doc.save(`reporte-productos-${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: 'Éxito',
      description: 'Reporte exportado correctamente',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Productos</h2>
            <p className="text-muted-foreground">Gestiona el catálogo de productos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToPDF}>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            <Dialog open={open} onOpenChange={handleCloseDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData({ ...formData, descripcion: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select
                    value={formData.categoria_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, categoria_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precio_venta">Precio de Venta</Label>
                  <Input
                    id="precio_venta"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio_venta}
                    onChange={(e) =>
                      setFormData({ ...formData, precio_venta: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigo_barras">Código de Barras (opcional)</Label>
                  <Input
                    id="codigo_barras"
                    value={formData.codigo_barras}
                    onChange={(e) =>
                      setFormData({ ...formData, codigo_barras: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock_minimo">Stock Mínimo</Label>
                  <Input
                    id="stock_minimo"
                    type="number"
                    min="0"
                    value={formData.stock_minimo}
                    onChange={(e) =>
                      setFormData({ ...formData, stock_minimo: e.target.value })
                    }
                    required
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (editingProduct ? 'Actualizando...' : 'Creando...') : (editingProduct ? 'Actualizar Producto' : 'Crear Producto')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <Package className="inline mr-2 h-5 w-5" />
              Lista de Productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Buscar producto por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio Venta</TableHead>
                  <TableHead>Código Barras</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      {searchQuery ? 'No se encontraron productos' : 'No hay productos registrados'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.nombre}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {product.descripcion || '-'}
                      </TableCell>
                      <TableCell>
                        {product.categorias?.nombre || '-'}
                      </TableCell>
                      <TableCell>${product.precio_venta.toFixed(2)}</TableCell>
                      <TableCell>{product.codigo_barras || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(product.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará el producto permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
