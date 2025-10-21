-- Crear función para generar número de factura (si no existe)
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.numero_factura IS NULL THEN
    NEW.numero_factura := CONCAT('F-', LPAD(SUBSTRING(NEW.id::text FROM 1 FOR 8), 8, '0'));
  END IF;
  RETURN NEW;
END;
$$;

-- Eliminar trigger si existe y recrearlo
DROP TRIGGER IF EXISTS set_invoice_number ON public.ventas;

-- Trigger para generar número de factura automáticamente
CREATE TRIGGER set_invoice_number
BEFORE INSERT ON public.ventas
FOR EACH ROW
EXECUTE FUNCTION public.generate_invoice_number();

-- Crear tabla de devoluciones si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'devoluciones') THEN
    CREATE TABLE public.devoluciones (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      venta_id UUID NOT NULL REFERENCES public.ventas(id) ON DELETE CASCADE,
      cliente_id UUID NOT NULL REFERENCES public.clientes(id),
      vendedor_id UUID NOT NULL,
      producto_id UUID NOT NULL REFERENCES public.productos(id),
      cantidad INTEGER NOT NULL CHECK (cantidad > 0),
      motivo TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'procesada' CHECK (estado IN ('procesada', 'rechazada')),
      fecha_devolucion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      notas TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );

    -- Enable RLS on devoluciones table
    ALTER TABLE public.devoluciones ENABLE ROW LEVEL SECURITY;

    -- Policies for devoluciones table
    CREATE POLICY "Admins and sales can view all returns"
    ON public.devoluciones
    FOR SELECT
    USING (
      has_role(auth.uid(), 'administrador'::app_role) OR 
      has_role(auth.uid(), 'ventas'::app_role)
    );

    CREATE POLICY "Sales and admins can insert returns"
    ON public.devoluciones
    FOR INSERT
    WITH CHECK (
      has_role(auth.uid(), 'ventas'::app_role) OR 
      has_role(auth.uid(), 'administrador'::app_role)
    );

    -- Add indexes for better performance
    CREATE INDEX idx_devoluciones_venta_id ON public.devoluciones(venta_id);
    CREATE INDEX idx_devoluciones_cliente_id ON public.devoluciones(cliente_id);
    CREATE INDEX idx_devoluciones_producto_id ON public.devoluciones(producto_id);
    CREATE INDEX idx_devoluciones_fecha ON public.devoluciones(fecha_devolucion DESC);
  END IF;
END $$;