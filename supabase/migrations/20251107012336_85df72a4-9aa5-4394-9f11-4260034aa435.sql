-- Corregir función para generar número de orden con search_path
CREATE OR REPLACE FUNCTION public.generate_orden_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.numero_orden IS NULL THEN
    NEW.numero_orden := CONCAT('ORD-', LPAD(SUBSTRING(NEW.id::text FROM 1 FOR 8), 8, '0'));
  END IF;
  RETURN NEW;
END;
$$;