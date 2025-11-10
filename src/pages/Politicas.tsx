import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Shield, AlertCircle } from 'lucide-react';
import { PublicNav } from '@/components/PublicNav';

export default function Politicas() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="border-red-200">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <FileText className="h-5 w-5 text-red-600" />
                </div>
                <CardTitle className="text-red-700">Términos y Condiciones del Servicio</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">1. Aceptación del Servicio</h3>
                <p className="text-muted-foreground">
                  Al entregar su dispositivo para reparación, usted acepta los términos y condiciones establecidos en este documento. Es responsabilidad del cliente leer y comprender estas políticas antes de proceder con el servicio.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">2. Diagnóstico y Cotización</h3>
                <p className="text-muted-foreground">
                  El servicio de diagnóstico inicial es gratuito. Una vez completado el diagnóstico, se enviará una cotización detallada al correo electrónico registrado. El cliente tiene 7 días para aceptar o rechazar la cotización.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">3. Rechazo de Cotización</h3>
                <p className="text-muted-foreground">
                  Si el cliente rechaza la cotización, se cobrará un cargo de $70,000 COP por concepto de revisión y diagnóstico. Este cargo debe ser pagado antes de retirar el dispositivo.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">4. Tiempo de Reparación</h3>
                <p className="text-muted-foreground">
                  Los tiempos de reparación varían según la complejidad del trabajo y la disponibilidad de repuestos. Se informará al cliente sobre el tiempo estimado una vez aceptada la cotización.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">5. Pago y Métodos de Pago</h3>
                <p className="text-muted-foreground">
                  El pago debe realizarse antes de la entrega del dispositivo reparado. Aceptamos pagos en efectivo y tarjetas de crédito/débito. No se entregarán dispositivos sin el pago completo del servicio.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-red-600" />
                </div>
                <CardTitle className="text-red-700">Garantía y Responsabilidades</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Garantía del Servicio</h3>
                <p className="text-muted-foreground">
                  Todas las reparaciones incluyen garantía de 30 días sobre repuestos y mano de obra. La garantía cubre defectos de fabricación de los repuestos instalados y errores en el proceso de reparación.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Exclusiones de Garantía</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Daños causados por mal uso o accidentes después de la entrega</li>
                  <li>Daños por líquidos o caídas posteriores a la reparación</li>
                  <li>Modificaciones realizadas por terceros</li>
                  <li>Daños estéticos que no afecten el funcionamiento</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Responsabilidad de Datos</h3>
                <p className="text-muted-foreground">
                  No nos hacemos responsables por la pérdida de datos almacenados en el dispositivo. Es responsabilidad del cliente realizar copias de seguridad antes de entregar el equipo para reparación.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <CardTitle className="text-red-700">Dispositivos Abandonados</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Los dispositivos no reclamados después de 60 días de finalizada la reparación serán considerados abandonados. Después de este período, la empresa se reserva el derecho de disponer del dispositivo para cubrir los costos del servicio. Se realizarán al menos 3 intentos de contacto antes de considerar un dispositivo como abandonado.
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-4">
                <strong>Última actualización:</strong> Enero 2024
              </p>
              <p className="text-sm text-muted-foreground">
                Estas políticas están sujetas a cambios sin previo aviso. Es responsabilidad del cliente mantenerse informado sobre las políticas vigentes. Para preguntas o aclaraciones, por favor contáctenos.
              </p>
              <Link to="/contacto">
                <Button variant="outline" className="mt-4 border-red-300 text-red-700 hover:bg-red-100">
                  Contáctanos para Más Información
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
