import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogIn, Menu, X } from 'lucide-react';

export function PublicNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/home" className="text-xl font-bold text-red-600">
              MundoComputo
            </Link>
            <div className="hidden md:flex gap-6">
              <Link to="/home" className="text-gray-700 hover:text-red-600 transition-colors">
                Inicio
              </Link>
              <Link to="/quienes-somos" className="text-gray-700 hover:text-red-600 transition-colors">
                Quiénes Somos
              </Link>
              <Link to="/contacto" className="text-gray-700 hover:text-red-600 transition-colors">
                Contacto
              </Link>
              <Link to="/estado-reparacion" className="text-gray-700 hover:text-red-600 transition-colors">
                Consultar Reparación
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth" className="hidden md:block">
              <Button variant="default" size="sm" className="bg-red-600 hover:bg-red-700">
                <LogIn className="mr-2 h-4 w-4" />
                Empleados
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200 mt-2">
            <div className="flex flex-col gap-3 pt-4">
              <Link
                to="/home"
                className="text-gray-700 hover:text-red-600 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Inicio
              </Link>
              <Link
                to="/quienes-somos"
                className="text-gray-700 hover:text-red-600 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Quiénes Somos
              </Link>
              <Link
                to="/contacto"
                className="text-gray-700 hover:text-red-600 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contacto
              </Link>
              <Link
                to="/estado-reparacion"
                className="text-gray-700 hover:text-red-600 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Consultar Reparación
              </Link>
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="default" size="sm" className="bg-red-600 hover:bg-red-700 w-full">
                  <LogIn className="mr-2 h-4 w-4" />
                  Empleados
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
