-- Agregar foreign key para vendedor_id en ventas
ALTER TABLE public.ventas
ADD CONSTRAINT ventas_vendedor_id_fkey 
FOREIGN KEY (vendedor_id) 
REFERENCES public.profiles(id);