-- Permitir que técnicos puedan ver clientes
CREATE POLICY "Technicians can view all clients"
ON public.clientes
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'tecnico'::app_role));