import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wrench, Search, Users, Shield, Phone, Mail, MapPin } from 'lucide-react';
import { PublicNav } from '@/components/PublicNav';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-900 text-white">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              Servicio Técnico Especializado
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-red-100">
              Reparamos tu dispositivo con garantía y profesionalismo
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/estado-reparacion">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg">
                  <Search className="mr-2 h-5 w-5" />
                  Consultar Reparación
                </Button>
              </Link>
              <Link to="/contacto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg bg-white/10 hover:bg-white/20 border-white text-white">
                  <Phone className="mr-2 h-5 w-5" />
                  Contáctanos
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent"></div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
            Nuestros Servicios
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-red-200 hover:border-red-500 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <Wrench className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-red-700">Reparación Profesional</CardTitle>
                <CardDescription>
                  Técnicos certificados con años de experiencia en reparación de dispositivos electrónicos
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-red-200 hover:border-red-500 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-red-700">Seguimiento en Línea</CardTitle>
                <CardDescription>
                  Consulta el estado de tu reparación en tiempo real con tu número de orden
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-red-200 hover:border-red-500 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-red-700">Garantía Extendida</CardTitle>
                <CardDescription>
                  Todas nuestras reparaciones incluyen garantía de repuestos y mano de obra
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-red-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-red-900">
            ¿Cómo Funciona?
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {[
                { step: 1, title: 'Ingreso del Dispositivo', desc: 'Trae tu dispositivo y recibe un número de orden' },
                { step: 2, title: 'Diagnóstico', desc: 'Nuestros técnicos revisan y diagnostican el problema' },
                { step: 3, title: 'Cotización', desc: 'Recibes una cotización detallada por email' },
                { step: 4, title: 'Reparación', desc: 'Una vez aprobada, procedemos con la reparación' },
                { step: 5, title: 'Entrega', desc: 'Recoges tu dispositivo reparado y funcionando' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-red-900 mb-1">{item.title}</h3>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-red-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            ¿Listo para reparar tu dispositivo?
          </h2>
          <p className="text-xl mb-8 text-red-100 max-w-2xl mx-auto">
            Contáctanos hoy y obtén un diagnóstico gratuito
          </p>
          <Link to="/contacto">
            <Button size="lg" variant="secondary" className="text-lg">
              Contáctanos
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Navegación</h3>
              <ul className="space-y-2">
                <li><Link to="/estado-reparacion" className="hover:text-red-400 transition-colors">Consultar Reparación</Link></li>
                <li><Link to="/quienes-somos" className="hover:text-red-400 transition-colors">Quiénes Somos</Link></li>
                <li><Link to="/contacto" className="hover:text-red-400 transition-colors">Contacto</Link></li>
                <li><Link to="/politicas" className="hover:text-red-400 transition-colors">Políticas</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Contacto</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-red-400" />
                  <span>+57 (XXX) XXX-XXXX</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-red-400" />
                  <span>contacto@reparaciones.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-400" />
                  <span>Dirección de ejemplo</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-4">Horarios</h3>
              <p>Lunes a Viernes: 8:00 AM - 6:00 PM</p>
              <p>Sábados: 9:00 AM - 2:00 PM</p>
              <p className="mt-2 text-red-400">Domingos: Cerrado</p>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center">
            <p>&copy; 2024 Servicio Técnico. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
