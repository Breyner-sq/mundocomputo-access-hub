-- Agregar columna 'aceptado' a la tabla reparacion_repuestos
-- Este campo permite que el cliente seleccione qué repuestos acepta en la cotización
ALTER TABLE public.reparacion_repuestos 
ADD COLUMN IF NOT EXISTS aceptado BOOLEAN NOT NULL DEFAULT true;