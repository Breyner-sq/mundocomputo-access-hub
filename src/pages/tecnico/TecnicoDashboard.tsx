import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Wrench, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { formatCOP } from '@/lib/formatCurrency';

export default function TecnicoDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    enCurso: 0,
    finalizadas: 0,
    pendientes: 0,
    promedioTiempo: 0,
    gananciasMes: 0,
    misReparaciones: 0,
  });

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      // Reparaciones en curso (todas menos entregadas)
      const { count: enCurso } = await supabase
        .from('reparaciones')
        .select('*', { count: 'exact', head: true })
        .neq('estado', 'entregado');

      // Reparaciones finalizadas
      const { count: finalizadas } = await supabase
        .from('reparaciones')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'entregado');

      // Reparaciones pendientes (recibidas)
      const { count: pendientes } = await supabase
        .from('reparaciones')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'recibido');

      // Mis reparaciones (asignadas al técnico actual)
      const { count: misReparaciones } = await supabase
        .from('reparaciones')
        .select('*', { count: 'exact', head: true })
        .eq('tecnico_id', user?.id)
        .neq('estado', 'entregado');

      // Ganancias del mes actual
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const { data: reparacionesMes } = await supabase
        .from('reparaciones')
        .select('costo_total, fecha_ingreso, fecha_finalizacion')
        .eq('estado', 'entregado')
        .gte('fecha_finalizacion', inicioMes.toISOString());

      const gananciasMes = reparacionesMes?.reduce(
        (sum, rep) => sum + (Number(rep.costo_total) || 0),
        0
      ) || 0;

      // Calcular promedio de tiempo de reparación (en días)
      const { data: reparacionesCompletas } = await supabase
        .from('reparaciones')
        .select('fecha_ingreso, fecha_finalizacion')
        .eq('estado', 'entregado')
        .not('fecha_finalizacion', 'is', null)
        .limit(50);

      let promedioTiempo = 0;
      if (reparacionesCompletas && reparacionesCompletas.length > 0) {
        const tiempos = reparacionesCompletas.map((rep) => {
          const inicio = new Date(rep.fecha_ingreso);
          const fin = new Date(rep.fecha_finalizacion!);
          return (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24); // días
        });
        promedioTiempo = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
      }

      setStats({
        enCurso: enCurso || 0,
        finalizadas: finalizadas || 0,
        pendientes: pendientes || 0,
        promedioTiempo: Math.round(promedioTiempo * 10) / 10,
        gananciasMes,
        misReparaciones: misReparaciones || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard de Técnico</h2>
          <p className="text-muted-foreground">Vista general de reparaciones</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Reparaciones en Curso
              </CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.enCurso}</div>
              <p className="text-xs text-muted-foreground">
                Activas en el sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Mis Reparaciones
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.misReparaciones}</div>
              <p className="text-xs text-muted-foreground">
                Asignadas a mí
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Finalizadas
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.finalizadas}</div>
              <p className="text-xs text-muted-foreground">
                Total completadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pendientes
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendientes}</div>
              <p className="text-xs text-muted-foreground">
                Sin asignar técnico
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Promedio de Tiempo
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.promedioTiempo} días</div>
              <p className="text-xs text-muted-foreground">
                Tiempo de reparación
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ganancias del Mes
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCOP(stats.gananciasMes)}</div>
              <p className="text-xs text-muted-foreground">
                Ingresos mensuales
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
