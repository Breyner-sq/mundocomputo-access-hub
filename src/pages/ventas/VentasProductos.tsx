import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package } from 'lucide-react';

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

export default function VentasProductos() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
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

  const filteredProducts = products.filter(product =>
    product.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Productos</h2>
            <p className="text-muted-foreground">Consulta el catálogo de productos (Solo lectura)</p>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
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
