-- Agregar campo estado_cotizacion a la tabla reparaciones
ALTER TABLE public.reparaciones 
ADD COLUMN estado_cotizacion text DEFAULT 'pendiente' CHECK (estado_cotizacion IN ('pendiente', 'aceptada', 'rechazada'));

-- Crear índice para búsquedas por numero_orden
CREATE INDEX IF NOT EXISTS idx_reparaciones_numero_orden ON public.reparaciones(numero_orden);

-- Permitir consultas públicas de reparaciones por número de orden (solo lectura)
CREATE POLICY "Cualquiera puede consultar reparación por número de orden"
ON public.reparaciones
FOR SELECT
TO anon
USING (true);

-- Permitir consultas públicas de repuestos asociados a reparaciones
CREATE POLICY "Cualquiera puede ver repuestos de reparaciones"
ON public.reparacion_repuestos
FOR SELECT
TO anon
USING (true);

-- Permitir actualizar estado_cotizacion desde consulta pública
CREATE POLICY "Cualquiera puede actualizar estado de cotización"
ON public.reparaciones
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

COMMENT ON COLUMN public.reparaciones.estado_cotizacion IS 'Estado de la cotización: pendiente, aceptada, rechazada';