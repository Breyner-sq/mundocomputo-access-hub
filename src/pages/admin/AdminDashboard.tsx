import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, TrendingUp, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    totalProductos: 0,
    ventasDelMes: 0,
    totalVentas: 0,
  });

  useEffect(() => {
    fetchStats();

    // Suscripción en tiempo real para usuarios
    const usersChannel = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchStats();
      })
      .subscribe();

    // Suscripción en tiempo real para productos
    const productsChannel = supabase
      .channel('productos-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => {
        fetchStats();
      })
      .subscribe();

    // Suscripción en tiempo real para ventas
    const salesChannel = supabase
      .channel('ventas-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(salesChannel);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const [profilesRes, productosRes, ventasRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('productos').select('id', { count: 'exact' }),
        supabase.from('ventas').select('total, fecha'),
      ]);

      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const ventasDelMes = (ventasRes.data || [])
        .filter(v => new Date(v.fecha) >= firstDayOfMonth)
        .reduce((sum, v) => sum + Number(v.total), 0);

      setStats({
        totalUsuarios: profilesRes.count || 0,
        totalProductos: productosRes.count || 0,
        ventasDelMes,
        totalVentas: (ventasRes.data || []).length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard de Administrador</h2>
          <p className="text-muted-foreground">Vista general del sistema en tiempo real</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsuarios}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProductos}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.ventasDelMes.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVentas}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
