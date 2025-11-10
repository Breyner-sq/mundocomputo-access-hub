import ConsultarReparacion from './ConsultarReparacion';
import { PublicNav } from '@/components/PublicNav';

export default function EstadoReparacion() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav />

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <ConsultarReparacion />
      </div>
    </div>
  );
}
