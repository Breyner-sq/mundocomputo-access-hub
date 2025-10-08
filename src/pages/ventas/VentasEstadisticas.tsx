import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, ShoppingBag, Users, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export default function VentasEstadisticas() {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalVentas: 0,
    numeroVentas: 0,
    clientesActivos: 0,
    promedioVenta: 0,
  });
  const [ventasPorMes, setVentasPorMes] = useState<any[]>([]);
  const [topProductos, setTopProductos] = useState<any[]>([]);

  useEffect(() => {
    fetchEstadisticas();
  }, []);

  const fetchEstadisticas = async () => {
    try {
      const [ventasRes, clientesRes, ventasDetalladas, itemsRes] = await Promise.all([
        supabase.from('ventas').select('total'),
        supabase.from('clientes').select('id').eq('activo', true),
        supabase.from('ventas').select('total, fecha'),
        supabase.from('venta_items').select('producto_id, cantidad, productos(nombre)'),
      ]);

      if (ventasRes.error) throw ventasRes.error;
      if (clientesRes.error) throw clientesRes.error;

      const totalVentas = (ventasRes.data || []).reduce((sum, v) => sum + Number(v.total), 0);
      const numeroVentas = (ventasRes.data || []).length;

      setStats({
        totalVentas,
        numeroVentas,
        clientesActivos: (clientesRes.data || []).length,
        promedioVenta: numeroVentas > 0 ? totalVentas / numeroVentas : 0,
      });

      // Procesar ventas por mes
      const ventasPorMesMap = new Map();
      (ventasDetalladas.data || []).forEach(venta => {
        const mes = new Date(venta.fecha).toLocaleString('es', { month: 'short', year: 'numeric' });
        const current = ventasPorMesMap.get(mes) || 0;
        ventasPorMesMap.set(mes, current + Number(venta.total));
      });

      const ventasPorMesData = Array.from(ventasPorMesMap.entries())
        .map(([mes, total]) => ({ mes, total }))
        .slice(-6);
      setVentasPorMes(ventasPorMesData);

      // Procesar top productos
      const productosMap = new Map();
      (itemsRes.data || []).forEach(item => {
        const nombre = item.productos?.nombre || 'Desconocido';
        const current = productosMap.get(nombre) || 0;
        productosMap.set(nombre, current + item.cantidad);
      });

      const topProductosData = Array.from(productosMap.entries())
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5);
      setTopProductos(topProductosData);

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Estadísticas de Ventas</h2>
          <p className="text-muted-foreground">Visualiza el rendimiento de ventas</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total en Ventas</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalVentas.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Número de Ventas</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.numeroVentas}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.clientesActivos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio por Venta</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.promedioVenta.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  total: {
                    label: 'Total',
                    color: 'hsl(var(--primary))',
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ventasPorMes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 5 Productos Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  cantidad: {
                    label: 'Cantidad',
                    color: 'hsl(var(--primary))',
                  },
                }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProductos}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="cantidad" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
