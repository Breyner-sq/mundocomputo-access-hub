import { Wrench, ClipboardList, LayoutDashboard, Settings, Users } from 'lucide-react';
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
  { title: 'Dashboard', url: '/tecnico', icon: LayoutDashboard },
  { title: 'Clientes', url: '/tecnico/clientes', icon: Users },
  { title: 'Reparaciones', url: '/tecnico/reparaciones', icon: ClipboardList },
  { title: 'Mis Reparaciones', url: '/tecnico/mis-reparaciones', icon: Wrench },
  { title: 'Configuración', url: '/configuracion/perfil', icon: Settings },
];

export function TecnicoSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className={isCollapsed ? 'w-14' : 'w-60'}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Técnico</SidebarGroupLabel>
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
                           ? 'bg-primary/10 text-primary font-medium border-l-4 border-primary'
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
