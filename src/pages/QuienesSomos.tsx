import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Users, Clock, Shield } from 'lucide-react';
import { PublicNav } from '@/components/PublicNav';
import { Button } from '@/components/ui/button';

export default function QuienesSomos() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* About Section */}
          <section className="text-center">
            <h2 className="text-3xl font-bold text-red-900 mb-4">Nuestra Historia</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Somos una empresa dedicada a la reparación de dispositivos electrónicos con más de 10 años de experiencia en el mercado. Nuestro compromiso es ofrecer un servicio de calidad, rápido y confiable para que nuestros clientes puedan volver a disfrutar de sus dispositivos lo antes posible.
            </p>
          </section>

          {/* Values */}
          <section>
            <h2 className="text-3xl font-bold text-red-900 mb-8 text-center">Nuestros Valores</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-red-200">
                <CardHeader>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <Award className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle className="text-red-700">Calidad</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Utilizamos repuestos originales y de alta calidad para garantizar la mejor reparación posible.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-red-200">
                <CardHeader>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle className="text-red-700">Rapidez</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Nos esforzamos por entregar las reparaciones en el menor tiempo posible sin comprometer la calidad.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-red-200">
                <CardHeader>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle className="text-red-700">Atención al Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Nuestro equipo está siempre disponible para resolver tus dudas y mantenerte informado sobre tu reparación.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-red-200">
                <CardHeader>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-red-600" />
                  </div>
                  <CardTitle className="text-red-700">Garantía</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Todas nuestras reparaciones incluyen garantía para tu tranquilidad y confianza.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Team */}
          <section className="text-center">
            <h2 className="text-3xl font-bold text-red-900 mb-4">Nuestro Equipo</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Contamos con un equipo de técnicos certificados y altamente capacitados, con años de experiencia en la reparación de diversos tipos de dispositivos. Nuestro personal se mantiene constantemente actualizado con las últimas tecnologías y técnicas de reparación.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-8">
              <p className="text-xl font-semibold text-red-900 mb-2">+5,000 Dispositivos Reparados</p>
              <p className="text-muted-foreground">Más de 10 años de experiencia satisfaciendo a nuestros clientes</p>
            </div>
          </section>

          {/* Mission */}
          <section className="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-lg p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Nuestra Misión</h2>
            <p className="text-lg leading-relaxed">
              Proporcionar servicios de reparación de dispositivos electrónicos de la más alta calidad, con atención personalizada y precios justos, contribuyendo a la sostenibilidad mediante la prolongación de la vida útil de los equipos.
            </p>
          </section>

          {/* CTA */}
          <section className="text-center">
            <h2 className="text-2xl font-bold text-red-900 mb-4">¿Necesitas reparar tu dispositivo?</h2>
            <p className="text-muted-foreground mb-6">Contáctanos hoy y obtén un diagnóstico gratuito</p>
            <Link to="/contacto">
              <Button size="lg" className="bg-red-600 hover:bg-red-700">
                Contáctanos Ahora
              </Button>
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
