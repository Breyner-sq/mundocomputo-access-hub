-- Crear tabla de reparaciones
CREATE TABLE IF NOT EXISTS public.reparaciones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_orden text UNIQUE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id),
  tecnico_id uuid REFERENCES public.profiles(id),
  
  -- Datos del dispositivo
  marca text NOT NULL,
  modelo text NOT NULL,
  numero_serie text,
  tipo_producto text NOT NULL,
  
  -- Información de la reparación
  descripcion_falla text NOT NULL,
  estado_fisico text,
  fotos_ingreso text[], -- Array de URLs de fotos
  
  -- Estados y fechas
  estado text NOT NULL DEFAULT 'recibido',
  fecha_ingreso timestamp with time zone NOT NULL DEFAULT now(),
  fecha_finalizacion timestamp with time zone,
  
  -- Datos de entrega
  nombre_quien_retira text,
  fecha_entrega timestamp with time zone,
  
  -- Costos y tiempos
  costo_total numeric DEFAULT 0,
  tiempo_trabajo_minutos integer DEFAULT 0,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Crear tabla de historial de estados
CREATE TABLE IF NOT EXISTS public.reparacion_estados (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reparacion_id uuid NOT NULL REFERENCES public.reparaciones(id) ON DELETE CASCADE,
  estado_anterior text,
  estado_nuevo text NOT NULL,
  notas text,
  usuario_id uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Crear tabla de repuestos utilizados
CREATE TABLE IF NOT EXISTS public.reparacion_repuestos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reparacion_id uuid NOT NULL REFERENCES public.reparaciones(id) ON DELETE CASCADE,
  producto_id uuid REFERENCES public.productos(id),
  descripcion text NOT NULL,
  cantidad integer NOT NULL DEFAULT 1,
  costo numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Función para generar número de orden
CREATE OR REPLACE FUNCTION public.generate_orden_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.numero_orden IS NULL THEN
    NEW.numero_orden := CONCAT('ORD-', LPAD(SUBSTRING(NEW.id::text FROM 1 FOR 8), 8, '0'));
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger para generar número de orden
CREATE TRIGGER generate_orden_number_trigger
BEFORE INSERT ON public.reparaciones
FOR EACH ROW
EXECUTE FUNCTION public.generate_orden_number();

-- Trigger para updated_at
CREATE TRIGGER handle_updated_at_reparaciones
BEFORE UPDATE ON public.reparaciones
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Habilitar RLS
ALTER TABLE public.reparaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reparacion_estados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reparacion_repuestos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para reparaciones
CREATE POLICY "Admins y técnicos pueden ver todas las reparaciones"
ON public.reparaciones FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'administrador'::app_role) OR 
  has_role(auth.uid(), 'tecnico'::app_role)
);

CREATE POLICY "Admins y técnicos pueden insertar reparaciones"
ON public.reparaciones FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'administrador'::app_role) OR 
  has_role(auth.uid(), 'tecnico'::app_role)
);

CREATE POLICY "Admins y técnicos pueden actualizar reparaciones"
ON public.reparaciones FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'administrador'::app_role) OR 
  has_role(auth.uid(), 'tecnico'::app_role)
);

CREATE POLICY "Admins pueden eliminar reparaciones"
ON public.reparaciones FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'administrador'::app_role));

-- Políticas RLS para historial de estados
CREATE POLICY "Admins y técnicos pueden ver historial"
ON public.reparacion_estados FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'administrador'::app_role) OR 
  has_role(auth.uid(), 'tecnico'::app_role)
);

CREATE POLICY "Admins y técnicos pueden insertar estados"
ON public.reparacion_estados FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'administrador'::app_role) OR 
  has_role(auth.uid(), 'tecnico'::app_role)
);

-- Políticas RLS para repuestos
CREATE POLICY "Admins y técnicos pueden ver repuestos"
ON public.reparacion_repuestos FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'administrador'::app_role) OR 
  has_role(auth.uid(), 'tecnico'::app_role)
);

CREATE POLICY "Admins y técnicos pueden insertar repuestos"
ON public.reparacion_repuestos FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'administrador'::app_role) OR 
  has_role(auth.uid(), 'tecnico'::app_role)
);

CREATE POLICY "Admins y técnicos pueden actualizar repuestos"
ON public.reparacion_repuestos FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'administrador'::app_role) OR 
  has_role(auth.uid(), 'tecnico'::app_role)
);

CREATE POLICY "Admins y técnicos pueden eliminar repuestos"
ON public.reparacion_repuestos FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'administrador'::app_role) OR 
  has_role(auth.uid(), 'tecnico'::app_role)
);

-- Agregar el rol técnico si no existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND 'tecnico' = ANY(enum_range(NULL::app_role)::text[])) THEN
    ALTER TYPE app_role ADD VALUE 'tecnico';
  END IF;
END$$;