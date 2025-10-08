-- Allow sales users to view products (read-only access)
CREATE POLICY "Sales can view all products" 
ON public.productos 
FOR SELECT 
USING (
  has_role(auth.uid(), 'ventas'::app_role)
);