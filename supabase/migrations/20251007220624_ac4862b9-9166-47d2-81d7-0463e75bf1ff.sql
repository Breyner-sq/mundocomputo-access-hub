-- Crear tabla de clientes
CREATE TABLE public.clientes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  email text NOT NULL,
  telefono text,
  cedula text NOT NULL UNIQUE,
  direccion text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Crear tabla de ventas
CREATE TABLE public.ventas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id),
  vendedor_id uuid NOT NULL,
  total numeric NOT NULL,
  fecha timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Crear tabla de items de venta
CREATE TABLE public.venta_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venta_id uuid NOT NULL REFERENCES public.ventas(id) ON DELETE CASCADE,
  producto_id uuid NOT NULL REFERENCES public.productos(id),
  cantidad integer NOT NULL,
  precio_unitario numeric NOT NULL,
  subtotal numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Agregar columna avatar_url a profiles
ALTER TABLE public.profiles
ADD COLUMN avatar_url text;

-- Enable RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venta_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para clientes
CREATE POLICY "Admins and sales can view all clients"
  ON public.clientes FOR SELECT
  USING (has_role(auth.uid(), 'administrador'::app_role) OR has_role(auth.uid(), 'ventas'::app_role));

CREATE POLICY "Admins and sales can insert clients"
  ON public.clientes FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'administrador'::app_role) OR has_role(auth.uid(), 'ventas'::app_role));

CREATE POLICY "Admins and sales can update clients"
  ON public.clientes FOR UPDATE
  USING (has_role(auth.uid(), 'administrador'::app_role) OR has_role(auth.uid(), 'ventas'::app_role));

CREATE POLICY "Admins and sales can delete clients"
  ON public.clientes FOR DELETE
  USING (has_role(auth.uid(), 'administrador'::app_role) OR has_role(auth.uid(), 'ventas'::app_role));

-- Políticas RLS para ventas
CREATE POLICY "Admins and sales can view all sales"
  ON public.ventas FOR SELECT
  USING (has_role(auth.uid(), 'administrador'::app_role) OR has_role(auth.uid(), 'ventas'::app_role));

CREATE POLICY "Sales can insert their own sales"
  ON public.ventas FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'ventas'::app_role) OR has_role(auth.uid(), 'administrador'::app_role));

-- Políticas RLS para items de venta
CREATE POLICY "Admins and sales can view all sale items"
  ON public.venta_items FOR SELECT
  USING (has_role(auth.uid(), 'administrador'::app_role) OR has_role(auth.uid(), 'ventas'::app_role));

CREATE POLICY "Sales can insert sale items"
  ON public.venta_items FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'ventas'::app_role) OR has_role(auth.uid(), 'administrador'::app_role));

-- Triggers para updated_at
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_ventas_updated_at
  BEFORE UPDATE ON public.ventas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();