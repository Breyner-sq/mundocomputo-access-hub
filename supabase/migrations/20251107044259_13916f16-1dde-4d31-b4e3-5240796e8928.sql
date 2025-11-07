-- Crear función para actualizar updated_at si no existe
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear tabla de pagos para reparaciones
CREATE TABLE public.pagos_reparaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reparacion_id UUID NOT NULL REFERENCES public.reparaciones(id) ON DELETE CASCADE,
  monto NUMERIC NOT NULL,
  metodo_pago TEXT NOT NULL, -- 'efectivo', 'tarjeta', 'transferencia'
  estado TEXT NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'aprobado', 'rechazado'
  numero_transaccion TEXT,
  fecha_pago TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_pagos_reparaciones_reparacion_id ON public.pagos_reparaciones(reparacion_id);
CREATE INDEX idx_pagos_reparaciones_estado ON public.pagos_reparaciones(estado);

-- Agregar campo pagado a reparaciones
ALTER TABLE public.reparaciones 
ADD COLUMN pagado BOOLEAN NOT NULL DEFAULT false;

-- RLS policies para pagos_reparaciones
ALTER TABLE public.pagos_reparaciones ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver pagos (para consulta pública)
CREATE POLICY "Cualquiera puede ver pagos de reparaciones"
  ON public.pagos_reparaciones
  FOR SELECT
  USING (true);

-- Cualquiera puede insertar pagos (para simulación pública)
CREATE POLICY "Cualquiera puede crear pagos"
  ON public.pagos_reparaciones
  FOR INSERT
  WITH CHECK (true);

-- Admins y técnicos pueden actualizar pagos
CREATE POLICY "Admins y técnicos pueden actualizar pagos"
  ON public.pagos_reparaciones
  FOR UPDATE
  USING (has_role(auth.uid(), 'administrador'::app_role) OR has_role(auth.uid(), 'tecnico'::app_role));

-- Trigger para actualizar updated_at
CREATE TRIGGER update_pagos_reparaciones_updated_at
  BEFORE UPDATE ON public.pagos_reparaciones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();