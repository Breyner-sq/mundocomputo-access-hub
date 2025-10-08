-- Permitir a empleados de ventas ver categorías (solo lectura)
CREATE POLICY "Sales can view all categories"
ON public.categorias
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'ventas'::app_role));

-- Permitir a empleados de ventas ver lotes de inventario (solo lectura)
CREATE POLICY "Sales can view all inventory batches"
ON public.lotes_inventario
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'ventas'::app_role));