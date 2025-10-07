import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, ShoppingBag, Users, TrendingUp } from 'lucide-react';

export default function VentasEstadisticas() {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalVentas: 0,
    numeroVentas: 0,
    clientesActivos: 0,
    promedioVenta: 0,
  });

  useEffect(() => {
    fetchEstadisticas();
  }, []);

  const fetchEstadisticas = async () => {
    try {
      const [ventasRes, clientesRes] = await Promise.all([
        supabase.from('ventas').select('total'),
        supabase.from('clientes').select('id').eq('activo', true),
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
      </div>
    </DashboardLayout>
  );
}
