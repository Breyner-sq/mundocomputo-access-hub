import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, FolderOpen, Edit } from 'lucide-react';
import { format } from 'date-fns';

interface Category {
  id: string;
  nombre: string;
  descripcion: string | null;
  created_at: string;
}

export default function InventarioCategorias() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las categorías',
        variant: 'destructive',
      });
      return;
    }

    setCategories(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editingCategory) {
      // Actualizar categoría existente
      const { error } = await supabase
        .from('categorias')
        .update({
          nombre: formData.nombre,
          descripcion: formData.descripcion || null,
        })
        .eq('id', editingCategory.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudo actualizar la categoría',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      toast({
        title: 'Éxito',
        description: 'Categoría actualizada correctamente',
      });
    } else {
      // Crear nueva categoría
      const { error } = await supabase.from('categorias').insert([
        {
          nombre: formData.nombre,
          descripcion: formData.descripcion || null,
        },
      ]);

      if (error) {
        toast({
          title: 'Error',
          description: 'No se pudo crear la categoría',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      toast({
        title: 'Éxito',
        description: 'Categoría creada correctamente',
      });
    }

    setFormData({
      nombre: '',
      descripcion: '',
    });

    setOpen(false);
    setEditingCategory(null);
    setLoading(false);
    fetchCategories();
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      nombre: category.nombre,
      descripcion: category.descripcion || '',
    });
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    // Verificar si hay productos asociados a esta categoría
    const { count, error: countError } = await supabase
      .from('productos')
      .select('id', { count: 'exact', head: true })
      .eq('categoria_id', deleteId);

    if (countError) {
      toast({
        title: 'Error',
        description: 'No se pudo verificar los productos asociados',
        variant: 'destructive',
      });
      return;
    }

    if (count && count > 0) {
      toast({
        title: 'No se puede eliminar',
        description: `Esta categoría tiene ${count} producto(s) asociado(s). Elimina o reasigna los productos primero.`,
        variant: 'destructive',
      });
      setDeleteId(null);
      return;
    }

    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', deleteId);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la categoría',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Éxito',
      description: 'Categoría eliminada correctamente',
    });

    setDeleteId(null);
    fetchCategories();
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingCategory(null);
    setFormData({
      nombre: '',
      descripcion: '',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Categorías</h2>
            <p className="text-muted-foreground">Organiza tus productos por categorías</p>
          </div>
          <Dialog open={open} onOpenChange={handleCloseDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Categoría
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? 'Editar Categoría' : 'Crear Nueva Categoría'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData({ ...formData, descripcion: e.target.value })
                    }
                    placeholder="Descripción de la categoría"
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (editingCategory ? 'Actualizando...' : 'Creando...') : (editingCategory ? 'Actualizar Categoría' : 'Crear Categoría')}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <FolderOpen className="inline mr-2 h-5 w-5" />
              Lista de Categorías
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No hay categorías registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.nombre}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {category.descripcion || '-'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(category.created_at), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(category.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará la categoría permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
