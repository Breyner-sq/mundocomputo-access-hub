-- Agregar columna para fotos de entrega
ALTER TABLE reparaciones
ADD COLUMN IF NOT EXISTS fotos_entrega text[] DEFAULT '{}';

COMMENT ON COLUMN reparaciones.fotos_entrega IS 'URLs de las fotos tomadas al momento de la entrega';