import { Users, Settings, LayoutDashboard, Package, FileText, ShoppingCart, TrendingUp, ChevronRight, BarChart } from 'lucide-react';
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';

const menuItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Gestionar Usuarios', url: '/admin/usuarios', icon: Users },
  { 
    title: 'Inventario', 
    icon: Package, 
    subItems: [
      { title: 'Dashboard', url: '/inventario', icon: LayoutDashboard },
      { title: 'Productos', url: '/inventario/productos', icon: Package },
      { title: 'Categorías', url: '/inventario/categorias', icon: FileText },
      { title: 'Stock', url: '/inventario/stock', icon: BarChart },
    ]
  },
  { 
    title: 'Ventas', 
    icon: ShoppingCart, 
    subItems: [
      { title: 'Dashboard', url: '/admin/ventas', icon: LayoutDashboard },
      { title: 'Registro', url: '/admin/ventas/registro', icon: ShoppingCart },
      { title: 'Clientes', url: '/admin/ventas/clientes', icon: Users },
      { title: 'Estadísticas', url: '/admin/ventas/estadisticas', icon: TrendingUp },
    ]
  },
  { title: 'Registros de Autentificación', url: '/admin/auth-logs', icon: FileText },
  { title: 'Configuración', url: '/configuracion/perfil', icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className={isCollapsed ? 'w-14' : 'w-60'}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administrador</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => 
                item.subItems ? (
                  <Collapsible key={item.title} className="group/collapsible" defaultOpen>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title}>
                          <item.icon className="h-4 w-4" />
                          {!isCollapsed && <span>{item.title}</span>}
                          {!isCollapsed && <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {!isCollapsed && (
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subItems.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild>
                                  <NavLink
                                    to={subItem.url}
                                    end
                                    className={({ isActive }) =>
                                      isActive
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'hover:bg-muted/50'
                                    }
                                  >
                                    <subItem.icon className="h-4 w-4" />
                                    <span>{subItem.title}</span>
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      )}
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
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
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
