-- Create categories table
CREATE TABLE public.categorias (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.productos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  descripcion text,
  categoria_id uuid REFERENCES public.categorias(id) ON DELETE SET NULL,
  precio_venta decimal(10,2) NOT NULL,
  codigo_barras text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create inventory batches table
CREATE TABLE public.lotes_inventario (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id uuid REFERENCES public.productos(id) ON DELETE CASCADE NOT NULL,
  cantidad integer NOT NULL CHECK (cantidad > 0),
  precio_compra decimal(10,2) NOT NULL,
  fecha_ingreso date NOT NULL DEFAULT CURRENT_DATE,
  notas text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lotes_inventario ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categorias
CREATE POLICY "Admins and inventory can view all categories"
  ON public.categorias FOR SELECT
  USING (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'inventario')
  );

CREATE POLICY "Admins and inventory can insert categories"
  ON public.categorias FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'inventario')
  );

CREATE POLICY "Admins and inventory can update categories"
  ON public.categorias FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'inventario')
  );

CREATE POLICY "Admins and inventory can delete categories"
  ON public.categorias FOR DELETE
  USING (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'inventario')
  );

-- RLS Policies for productos
CREATE POLICY "Admins and inventory can view all products"
  ON public.productos FOR SELECT
  USING (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'inventario')
  );

CREATE POLICY "Admins and inventory can insert products"
  ON public.productos FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'inventario')
  );

CREATE POLICY "Admins and inventory can update products"
  ON public.productos FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'inventario')
  );

CREATE POLICY "Admins and inventory can delete products"
  ON public.productos FOR DELETE
  USING (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'inventario')
  );

-- RLS Policies for lotes_inventario
CREATE POLICY "Admins and inventory can view all batches"
  ON public.lotes_inventario FOR SELECT
  USING (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'inventario')
  );

CREATE POLICY "Admins and inventory can insert batches"
  ON public.lotes_inventario FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'inventario')
  );

CREATE POLICY "Admins and inventory can update batches"
  ON public.lotes_inventario FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'inventario')
  );

CREATE POLICY "Admins and inventory can delete batches"
  ON public.lotes_inventario FOR DELETE
  USING (
    public.has_role(auth.uid(), 'administrador') OR 
    public.has_role(auth.uid(), 'inventario')
  );

-- Triggers for updated_at
CREATE TRIGGER update_categorias_updated_at
  BEFORE UPDATE ON public.categorias
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_productos_updated_at
  BEFORE UPDATE ON public.productos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_lotes_inventario_updated_at
  BEFORE UPDATE ON public.lotes_inventario
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for better performance
CREATE INDEX idx_productos_categoria ON public.productos(categoria_id);
CREATE INDEX idx_lotes_producto ON public.lotes_inventario(producto_id);
CREATE INDEX idx_lotes_fecha ON public.lotes_inventario(fecha_ingreso);