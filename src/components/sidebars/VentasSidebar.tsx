import { ShoppingCart, Users, LayoutDashboard, TrendingUp, Settings, Package, ClipboardCheck } from 'lucide-react';
import { NavLink } from 'react-router-dom';
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

const menuItems = [
  { title: 'Dashboard', url: '/ventas', icon: LayoutDashboard },
  { title: 'Ventas', url: '/ventas/registro', icon: ShoppingCart },
  { title: 'Clientes', url: '/ventas/clientes', icon: Users },
  { title: 'Estadísticas', url: '/ventas/estadisticas', icon: TrendingUp },
  { title: 'Productos', url: '/ventas/productos', icon: Package },
  { title: 'Stock', url: '/ventas/stock', icon: ClipboardCheck },
  { title: 'Configuración', url: '/configuracion/perfil', icon: Settings },
];

export function VentasSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className={isCollapsed ? 'w-14' : 'w-60'}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Ventas</SidebarGroupLabel>
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
