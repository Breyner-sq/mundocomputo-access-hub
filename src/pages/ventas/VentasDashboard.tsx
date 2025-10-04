import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function VentasDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard de Ventas</h2>
          <p className="text-muted-foreground">Gestiona las ventas y clientes</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ventas del Día</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No hay ventas registradas hoy</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
