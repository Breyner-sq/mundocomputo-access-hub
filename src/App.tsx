import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import RoleRedirect from "./pages/RoleRedirect";
import Unauthorized from "./pages/Unauthorized";
import AdminDashboard from "./pages/admin/AdminDashboard";
import GestionUsuarios from "./pages/admin/GestionUsuarios";
import TecnicoDashboard from "./pages/tecnico/TecnicoDashboard";
import VentasDashboard from "./pages/ventas/VentasDashboard";
import InventarioDashboard from "./pages/inventario/InventarioDashboard";
import InventarioProductos from "./pages/inventario/InventarioProductos";
import InventarioCategorias from "./pages/inventario/InventarioCategorias";
import InventarioStock from "./pages/inventario/InventarioStock";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<RoleRedirect />} />
            <Route path="/auth" element={<Auth />} />
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
                <ProtectedRoute allowedRoles={['ventas']}>
                  <VentasDashboard />
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
  </QueryClientProvider>
);

export default App;
