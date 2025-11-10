-- Create table for contact form submissions
CREATE TABLE IF NOT EXISTS public.formularios_contacto (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  mensaje TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'nuevo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atendido_por UUID REFERENCES auth.users(id),
  notas_internas TEXT
);

-- Enable RLS
ALTER TABLE public.formularios_contacto ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert contact forms
CREATE POLICY "Cualquiera puede enviar formularios"
ON public.formularios_contacto
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow sales and admins to view contact forms
CREATE POLICY "Ventas y admins pueden ver formularios"
ON public.formularios_contacto
FOR SELECT
USING (has_role(auth.uid(), 'ventas'::app_role) OR has_role(auth.uid(), 'administrador'::app_role));

-- Allow sales and admins to update contact forms
CREATE POLICY "Ventas y admins pueden actualizar formularios"
ON public.formularios_contacto
FOR UPDATE
USING (has_role(auth.uid(), 'ventas'::app_role) OR has_role(auth.uid(), 'administrador'::app_role));

-- Create index for faster queries
CREATE INDEX idx_formularios_contacto_estado ON public.formularios_contacto(estado);
CREATE INDEX idx_formularios_contacto_created_at ON public.formularios_contacto(created_at DESC);