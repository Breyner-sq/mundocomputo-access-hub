import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TecnicoDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard de Técnico</h2>
          <p className="text-muted-foreground">Gestiona tus órdenes de servicio</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Órdenes Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No hay órdenes pendientes</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
