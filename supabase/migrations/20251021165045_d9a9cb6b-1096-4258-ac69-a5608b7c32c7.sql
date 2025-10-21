-- Eliminar el constraint antiguo que no permite cantidad = 0
ALTER TABLE lotes_inventario DROP CONSTRAINT IF EXISTS lotes_inventario_cantidad_check;

-- Agregar nuevo constraint que permite cantidad >= 0
ALTER TABLE lotes_inventario ADD CONSTRAINT lotes_inventario_cantidad_check CHECK (cantidad >= 0);