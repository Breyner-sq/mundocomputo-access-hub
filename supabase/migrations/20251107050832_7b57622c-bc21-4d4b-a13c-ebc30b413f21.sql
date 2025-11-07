-- Agregar campo para fotos en reparaciones
ALTER TABLE reparaciones ADD COLUMN fotos text[] DEFAULT '{}';

-- Crear bucket para fotos de reparaciones
INSERT INTO storage.buckets (id, name, public) 
VALUES ('reparaciones-fotos', 'reparaciones-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para fotos de reparaciones
CREATE POLICY "Fotos son públicas para ver"
ON storage.objects FOR SELECT
USING (bucket_id = 'reparaciones-fotos');

CREATE POLICY "Técnicos y admins pueden subir fotos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'reparaciones-fotos' 
  AND (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('tecnico', 'administrador')
    )
  )
);

CREATE POLICY "Técnicos y admins pueden actualizar fotos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'reparaciones-fotos' 
  AND (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('tecnico', 'administrador')
    )
  )
);

CREATE POLICY "Técnicos y admins pueden eliminar fotos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'reparaciones-fotos' 
  AND (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('tecnico', 'administrador')
    )
  )
);