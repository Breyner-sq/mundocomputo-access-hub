import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { AdminSidebar } from '@/components/sidebars/AdminSidebar';
import { TecnicoSidebar } from '@/components/sidebars/TecnicoSidebar';
import { VentasSidebar } from '@/components/sidebars/VentasSidebar';
import { InventarioSidebar } from '@/components/sidebars/InventarioSidebar';
import { AdminInventarioSidebar } from '@/components/sidebars/AdminInventarioSidebar';
import { supabase } from '@/integrations/supabase/client';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { role, signOut, user } = useAuth();
  const location = useLocation();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchAvatar();
    }
  }, [user?.id]);

  const fetchAvatar = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user?.id)
      .single();
    
    if (data?.avatar_url) {
      setAvatarUrl(data.avatar_url);
    }
  };

  const getSidebar = () => {
    // Si el admin está en rutas de inventario, mostramos el AdminInventarioSidebar
    if (role === 'administrador' && location.pathname.startsWith('/admin/inventario')) {
      return <AdminInventarioSidebar />;
    }
    
    switch (role) {
      case 'administrador':
        return <AdminSidebar />;
      case 'tecnico':
        return <TecnicoSidebar />;
      case 'ventas':
        return <VentasSidebar />;
      case 'inventario':
        return <InventarioSidebar />;
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {getSidebar()}
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-background flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-bold">MundoComputo</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">
                  {user?.email}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesión
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6 bg-muted/30">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
