import { Package, ClipboardCheck, LayoutDashboard, TruckIcon, Settings } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

export function InventarioSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const location = useLocation();
  
  // Detectar si estamos en rutas de admin o inventario
  const baseUrl = location.pathname.startsWith('/admin/inventario') 
    ? '/admin/inventario' 
    : '/inventario';
  
  const menuItems = [
    { title: 'Dashboard', url: baseUrl, icon: LayoutDashboard },
    { title: 'Productos', url: `${baseUrl}/productos`, icon: Package },
    { title: 'Categorías', url: `${baseUrl}/categorias`, icon: TruckIcon },
    { title: 'Control de Stock', url: `${baseUrl}/stock`, icon: ClipboardCheck },
    { title: 'Configuración', url: '/configuracion/perfil', icon: Settings },
  ];

  return (
    <Sidebar className={isCollapsed ? 'w-14' : 'w-60'}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Inventario</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted/50'
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
