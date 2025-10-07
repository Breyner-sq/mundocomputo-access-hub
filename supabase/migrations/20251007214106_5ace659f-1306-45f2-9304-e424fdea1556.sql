-- Agregar columna stock_minimo a la tabla productos
ALTER TABLE public.productos 
ADD COLUMN stock_minimo integer NOT NULL DEFAULT 10;

COMMENT ON COLUMN public.productos.stock_minimo IS 'Cantidad mínima de stock antes de generar alertas';