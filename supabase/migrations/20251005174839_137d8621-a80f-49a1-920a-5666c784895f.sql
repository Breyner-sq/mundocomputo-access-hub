-- Add active status to profiles
ALTER TABLE public.profiles 
ADD COLUMN activo boolean DEFAULT true NOT NULL;

-- Add index for better performance when filtering active users
CREATE INDEX idx_profiles_activo ON public.profiles(activo);

-- RLS policy for admins to manage user status
CREATE POLICY "Admins can delete users"
  ON public.profiles
  FOR DELETE
  USING (public.has_role(auth.uid(), 'administrador'));