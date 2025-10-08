import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, AlertTriangle } from 'lucide-react';
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
  productos: Product & {
    categorias: { nombre: string } | null;
  };
}

interface LowStockProduct {
  id: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  categoria: string | null;
}

export default function VentasStock() {
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [searchBatches, setSearchBatches] = useState('');
  const [searchLowStock, setSearchLowStock] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchBatches();
    fetchLowStockProducts();
  }, []);

  const fetchBatches = async () => {
    const { data, error } = await supabase
      .from('lotes_inventario')
      .select('*, productos(id, nombre, codigo_barras, categorias(nombre))')
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

  const fetchLowStockProducts = async () => {
    try {
      const { data: productos, error: prodError } = await supabase
        .from('productos')
        .select('id, nombre, stock_minimo, categorias(nombre)');

      if (prodError) throw prodError;

      const { data: lotes, error: lotesError } = await supabase
        .from('lotes_inventario')
        .select('producto_id, cantidad');

      if (lotesError) throw lotesError;

      const stockPorProducto: { [key: string]: number } = {};
      lotes?.forEach((lote: any) => {
        if (!stockPorProducto[lote.producto_id]) {
          stockPorProducto[lote.producto_id] = 0;
        }
        stockPorProducto[lote.producto_id] += lote.cantidad;
      });

      const productosStockBajo: LowStockProduct[] = productos
        ?.map((prod: any) => ({
          id: prod.id,
          nombre: prod.nombre,
          stock_actual: stockPorProducto[prod.id] || 0,
          stock_minimo: prod.stock_minimo,
          categoria: prod.categorias?.nombre || null,
        }))
        .filter((prod) => prod.stock_actual < prod.stock_minimo) || [];

      setLowStockProducts(productosStockBajo);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
    }
  };

  const filteredBatches = batches.filter(batch =>
    batch.productos.nombre.toLowerCase().includes(searchBatches.toLowerCase())
  );

  const filteredLowStock = lowStockProducts.filter(product =>
    product.nombre.toLowerCase().includes(searchLowStock.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Control de Stock</h2>
            <p className="text-muted-foreground">Consulta los lotes de inventario (Solo lectura)</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <Package className="inline mr-2 h-5 w-5" />
              Lotes de Inventario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Buscar lote por producto..."
                value={searchBatches}
                onChange={(e) => setSearchBatches(e.target.value)}
              />
            </div>
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
                {filteredBatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      {searchBatches ? 'No se encontraron lotes' : 'No hay lotes registrados'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBatches.map((batch) => (
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

        <Card>
          <CardHeader>
            <CardTitle>
              <AlertTriangle className="inline mr-2 h-5 w-5 text-warning" />
              Productos con Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Buscar producto..."
                value={searchLowStock}
                onChange={(e) => setSearchLowStock(e.target.value)}
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Stock Actual</TableHead>
                  <TableHead>Stock Mínimo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLowStock.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      {searchLowStock ? 'No se encontraron productos' : 'No hay productos con stock bajo'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLowStock.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.nombre}</TableCell>
                      <TableCell>{product.categoria || '-'}</TableCell>
                      <TableCell className="text-destructive font-semibold">
                        {product.stock_actual}
                      </TableCell>
                      <TableCell>{product.stock_minimo}</TableCell>
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
