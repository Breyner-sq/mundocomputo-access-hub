import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function InventarioDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard de Inventario</h2>
          <p className="text-muted-foreground">Controla el stock y productos</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Estado del Inventario</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Todos los productos en stock</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
