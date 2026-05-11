-- CORRECCIÓN: Trigger más robusto con manejo de errores
-- Ejecutar en Supabase Dashboard → SQL Editor

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre, apellido, rol, estado_cuenta)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'nombre', ''),
      split_part(COALESCE(NEW.email, 'usuario'), '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'apellido', '-'),
    CASE WHEN NEW.email = 'yesicalp@gmail.com' THEN 'admin' ELSE 'staff' END,
    CASE WHEN NEW.email = 'yesicalp@gmail.com' THEN 'aprobado' ELSE 'pendiente' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Si falla, no bloqueamos el registro; el perfil se creará desde el frontend
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
