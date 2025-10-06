import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Package, FolderOpen, Package2, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function InventarioDashboard() {
  const [stats, setStats] = useState({
    totalProductos: 0,
    totalCategorias: 0,
    totalLotes: 0,
    stockTotal: 0,
  });
  const [productsByCategory, setProductsByCategory] = useState<{ nombre: string; cantidad: number }[]>([]);
  const [recentBatches, setRecentBatches] = useState<{ nombre: string; cantidad: number; fecha: string }[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
    fetchProductsByCategory();
    fetchRecentBatches();
  }, []);

  const fetchStats = async () => {
    try {
      const [productosRes, categoriasRes, lotesRes] = await Promise.all([
        supabase.from('productos').select('id', { count: 'exact', head: true }),
        supabase.from('categorias').select('id', { count: 'exact', head: true }),
        supabase.from('lotes_inventario').select('cantidad'),
      ]);

      const stockTotal = lotesRes.data?.reduce((sum, lote) => sum + lote.cantidad, 0) || 0;

      setStats({
        totalProductos: productosRes.count || 0,
        totalCategorias: categoriasRes.count || 0,
        totalLotes: lotesRes.data?.length || 0,
        stockTotal,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las estadísticas',
        variant: 'destructive',
      });
    }
  };

  const fetchProductsByCategory = async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('categoria_id, categorias(nombre)');

    if (error) {
      console.error(error);
      return;
    }

    const categoryCount: { [key: string]: number } = {};
    data.forEach((producto: any) => {
      const nombre = producto.categorias?.nombre || 'Sin categoría';
      categoryCount[nombre] = (categoryCount[nombre] || 0) + 1;
    });

    const chartData = Object.entries(categoryCount).map(([nombre, cantidad]) => ({
      nombre,
      cantidad,
    }));

    setProductsByCategory(chartData);
  };

  const fetchRecentBatches = async () => {
    const { data, error } = await supabase
      .from('lotes_inventario')
      .select('cantidad, fecha_ingreso, productos(nombre)')
      .order('fecha_ingreso', { ascending: false })
      .limit(7);

    if (error) {
      console.error(error);
      return;
    }

    const chartData = data.map((lote: any) => ({
      nombre: lote.productos.nombre,
      cantidad: lote.cantidad,
      fecha: new Date(lote.fecha_ingreso).toLocaleDateString(),
    }));

    setRecentBatches(chartData);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard de Inventario</h2>
          <p className="text-muted-foreground">Visión general del estado del inventario</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProductos}</div>
              <p className="text-xs text-muted-foreground">Productos registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categorías</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCategorias}</div>
              <p className="text-xs text-muted-foreground">Categorías activas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lotes</CardTitle>
              <Package2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLotes}</div>
              <p className="text-xs text-muted-foreground">Lotes de inventario</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.stockTotal}</div>
              <p className="text-xs text-muted-foreground">Unidades en stock</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Productos por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={productsByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ nombre, cantidad }) => `${nombre}: ${cantidad}`}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="cantidad"
                  >
                    {productsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lotes Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={recentBatches}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nombre" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cantidad" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
