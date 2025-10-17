import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";
import { ThemeProvider } from '@/components/theme-provider';
import Auth from "./pages/Auth";
import RoleRedirect from "./pages/RoleRedirect";
import Unauthorized from "./pages/Unauthorized";
import AdminDashboard from "./pages/admin/AdminDashboard";
import GestionUsuarios from "./pages/admin/GestionUsuarios";
import AuthLogs from "./pages/admin/AuthLogs";
import TecnicoDashboard from "./pages/tecnico/TecnicoDashboard";
import VentasDashboard from "./pages/ventas/VentasDashboard";
import VentasRegistro from "./pages/ventas/VentasRegistro";
import VentasClientes from "./pages/ventas/VentasClientes";
import VentasEstadisticas from "./pages/ventas/VentasEstadisticas";
import VentasProductos from "./pages/ventas/VentasProductos";
import VentasStock from "./pages/ventas/VentasStock";
import InventarioDashboard from "./pages/inventario/InventarioDashboard";
import InventarioProductos from "./pages/inventario/InventarioProductos";
import InventarioCategorias from "./pages/inventario/InventarioCategorias";
import InventarioStock from "./pages/inventario/InventarioStock";
import Perfil from "./pages/configuracion/Perfil";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system"  storageKey="app-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <AccessibilityMenu />
            <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<RoleRedirect />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['administrador']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/usuarios"
              element={
                <ProtectedRoute allowedRoles={['administrador']}>
                  <GestionUsuarios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/auth-logs"
              element={
                <ProtectedRoute allowedRoles={['administrador']}>
                  <AuthLogs />
                </ProtectedRoute>
              }
            />
            
            {/* Admin Ventas Routes */}
            <Route path="/admin/ventas" element={<ProtectedRoute allowedRoles={['administrador']}><VentasDashboard /></ProtectedRoute>} />
            <Route path="/admin/ventas/registro" element={<ProtectedRoute allowedRoles={['administrador']}><VentasRegistro /></ProtectedRoute>} />
            <Route path="/admin/ventas/clientes" element={<ProtectedRoute allowedRoles={['administrador']}><VentasClientes /></ProtectedRoute>} />
            <Route path="/admin/ventas/estadisticas" element={<ProtectedRoute allowedRoles={['administrador']}><VentasEstadisticas /></ProtectedRoute>} />
            
            {/* Tecnico Routes */}
            <Route
              path="/tecnico"
              element={
                <ProtectedRoute allowedRoles={['tecnico']}>
                  <TecnicoDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Ventas Routes */}
            <Route
              path="/ventas"
              element={
                <ProtectedRoute allowedRoles={['ventas', 'administrador']}>
                  <VentasDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ventas/registro"
              element={
                <ProtectedRoute allowedRoles={['ventas', 'administrador']}>
                  <VentasRegistro />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ventas/clientes"
              element={
                <ProtectedRoute allowedRoles={['ventas', 'administrador']}>
                  <VentasClientes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ventas/estadisticas"
              element={
                <ProtectedRoute allowedRoles={['ventas', 'administrador']}>
                  <VentasEstadisticas />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ventas/productos"
              element={
                <ProtectedRoute allowedRoles={['ventas', 'administrador']}>
                  <VentasProductos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ventas/stock"
              element={
                <ProtectedRoute allowedRoles={['ventas', 'administrador']}>
                  <VentasStock />
                </ProtectedRoute>
              }
            />
            
            {/* Configuración Routes */}
            <Route
              path="/configuracion/perfil"
              element={
                <ProtectedRoute allowedRoles={['administrador', 'tecnico', 'ventas', 'inventario']}>
                  <Perfil />
                </ProtectedRoute>
              }
            />
            
            {/* Inventario Routes */}
            <Route
              path="/inventario"
              element={
                <ProtectedRoute allowedRoles={['inventario', 'administrador']}>
                  <InventarioDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventario/productos"
              element={
                <ProtectedRoute allowedRoles={['inventario', 'administrador']}>
                  <InventarioProductos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventario/categorias"
              element={
                <ProtectedRoute allowedRoles={['inventario', 'administrador']}>
                  <InventarioCategorias />
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventario/stock"
              element={
                <ProtectedRoute allowedRoles={['inventario', 'administrador']}>
                  <InventarioStock />
                </ProtectedRoute>
              }
            />
            
            {/* Admin Inventario Routes (same as inventario) */}
            <Route
              path="/admin/inventario"
              element={
                <ProtectedRoute allowedRoles={['administrador']}>
                  <InventarioDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/inventario/productos"
              element={
                <ProtectedRoute allowedRoles={['administrador']}>
                  <InventarioProductos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/inventario/categorias"
              element={
                <ProtectedRoute allowedRoles={['administrador']}>
                  <InventarioCategorias />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/inventario/stock"
              element={
                <ProtectedRoute allowedRoles={['administrador']}>
                  <InventarioStock />
                </ProtectedRoute>
              }
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
