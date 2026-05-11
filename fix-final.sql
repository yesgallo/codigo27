-- =====================================================
-- FIX DEFINITIVO: RLS + Vista para evitar el join FK
-- Ejecutar en Supabase Dashboard → SQL Editor → New query
-- =====================================================

-- 1. Función auxiliar SIN recursión RLS
CREATE OR REPLACE FUNCTION get_my_rol()
RETURNS TEXT AS $$
  SELECT rol FROM public.perfiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Eliminar TODAS las policies de perfiles y recrearlas sin recursión
DROP POLICY IF EXISTS "perfiles_select_own" ON perfiles;
DROP POLICY IF EXISTS "perfiles_select_admin" ON perfiles;
DROP POLICY IF EXISTS "perfiles_insert_own" ON perfiles;
DROP POLICY IF EXISTS "perfiles_update_own" ON perfiles;
DROP POLICY IF EXISTS "perfiles_update_admin" ON perfiles;

CREATE POLICY "perfiles_select_own" ON perfiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "perfiles_select_admin" ON perfiles
  FOR SELECT USING (get_my_rol() = 'admin');

CREATE POLICY "perfiles_insert_own" ON perfiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "perfiles_update_own" ON perfiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "perfiles_update_admin" ON perfiles
  FOR UPDATE USING (get_my_rol() = 'admin');

-- 3. Eliminar TODAS las policies de publicaciones y recrearlas con get_my_rol()
DROP POLICY IF EXISTS "publicaciones_select_published" ON publicaciones;
DROP POLICY IF EXISTS "publicaciones_select_own" ON publicaciones;
DROP POLICY IF EXISTS "publicaciones_select_admin" ON publicaciones;
DROP POLICY IF EXISTS "publicaciones_insert_staff" ON publicaciones;
DROP POLICY IF EXISTS "publicaciones_update_own" ON publicaciones;
DROP POLICY IF EXISTS "publicaciones_update_admin" ON publicaciones;
DROP POLICY IF EXISTS "publicaciones_delete_own_draft" ON publicaciones;
DROP POLICY IF EXISTS "publicaciones_delete_admin" ON publicaciones;

CREATE POLICY "publicaciones_select_published" ON publicaciones
  FOR SELECT USING (estado = 'publicado');

CREATE POLICY "publicaciones_select_own" ON publicaciones
  FOR SELECT USING (auth.uid() = estudiante_id);

CREATE POLICY "publicaciones_select_admin" ON publicaciones
  FOR SELECT USING (get_my_rol() = 'admin');

CREATE POLICY "publicaciones_insert_staff" ON publicaciones
  FOR INSERT WITH CHECK (auth.uid() = estudiante_id);

CREATE POLICY "publicaciones_update_own" ON publicaciones
  FOR UPDATE USING (auth.uid() = estudiante_id);

CREATE POLICY "publicaciones_update_admin" ON publicaciones
  FOR UPDATE USING (get_my_rol() = 'admin');

CREATE POLICY "publicaciones_delete_own_draft" ON publicaciones
  FOR DELETE USING (auth.uid() = estudiante_id AND estado = 'borrador');

CREATE POLICY "publicaciones_delete_admin" ON publicaciones
  FOR DELETE USING (get_my_rol() = 'admin');

-- 4. Vista que resuelve el autor sin necesitar el join FK desde el frontend
CREATE OR REPLACE VIEW publicaciones_con_autor AS
SELECT
  p.*,
  COALESCE(
    NULLIF(p.autor_nombre_demo, ''),
    NULLIF(per.nombre || ' ' || per.apellido, ' '),
    'Autor Anónimo'
  ) AS autor_display,
  per.instagram_handle AS autor_instagram
FROM publicaciones p
LEFT JOIN perfiles per ON per.id = p.estudiante_id;
