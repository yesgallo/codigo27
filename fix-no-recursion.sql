-- =====================================================
-- FIX DEFINITIVO Y A PRUEBA DE FALLOS: Sin Recursión
-- Ejecutar en Supabase Dashboard → SQL Editor → New query
-- =====================================================

-- 1. Eliminar función anterior y todas las políticas que dependan de ella
DROP FUNCTION IF EXISTS get_my_rol() CASCADE;

-- 2. Eliminar TODAS las policies actuales de perfiles para limpiar
DROP POLICY IF EXISTS "perfiles_select_own" ON perfiles;
DROP POLICY IF EXISTS "perfiles_select_admin" ON perfiles;
DROP POLICY IF EXISTS "perfiles_select_all" ON perfiles;
DROP POLICY IF EXISTS "perfiles_insert_own" ON perfiles;
DROP POLICY IF EXISTS "perfiles_update_own" ON perfiles;
DROP POLICY IF EXISTS "perfiles_update_admin" ON perfiles;

-- 3. Crear policies de perfiles (La clave: SELECT público para evitar bucles)
-- Como es un portal de noticias, los perfiles (nombre, rol) son datos públicos
CREATE POLICY "perfiles_select_all" ON perfiles
  FOR SELECT USING (true);

CREATE POLICY "perfiles_insert_own" ON perfiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "perfiles_update_own" ON perfiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "perfiles_update_admin" ON perfiles
  FOR UPDATE USING (
    (SELECT rol FROM perfiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

-- 4. Eliminar TODAS las policies actuales de publicaciones
DROP POLICY IF EXISTS "publicaciones_select_published" ON publicaciones;
DROP POLICY IF EXISTS "publicaciones_select_own" ON publicaciones;
DROP POLICY IF EXISTS "publicaciones_select_admin" ON publicaciones;
DROP POLICY IF EXISTS "publicaciones_insert_staff" ON publicaciones;
DROP POLICY IF EXISTS "publicaciones_update_own" ON publicaciones;
DROP POLICY IF EXISTS "publicaciones_update_admin" ON publicaciones;
DROP POLICY IF EXISTS "publicaciones_delete_own_draft" ON publicaciones;
DROP POLICY IF EXISTS "publicaciones_delete_admin" ON publicaciones;

-- 5. Crear policies de publicaciones sin funciones externas
CREATE POLICY "publicaciones_select_published" ON publicaciones
  FOR SELECT USING (estado = 'publicado');

CREATE POLICY "publicaciones_select_own" ON publicaciones
  FOR SELECT USING (auth.uid() = estudiante_id);

CREATE POLICY "publicaciones_select_admin" ON publicaciones
  FOR SELECT USING (
    (SELECT rol FROM perfiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

CREATE POLICY "publicaciones_insert_staff" ON publicaciones
  FOR INSERT WITH CHECK (auth.uid() = estudiante_id);

CREATE POLICY "publicaciones_update_own" ON publicaciones
  FOR UPDATE USING (auth.uid() = estudiante_id);

CREATE POLICY "publicaciones_update_admin" ON publicaciones
  FOR UPDATE USING (
    (SELECT rol FROM perfiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

CREATE POLICY "publicaciones_delete_own_draft" ON publicaciones
  FOR DELETE USING (auth.uid() = estudiante_id AND estado = 'borrador');

CREATE POLICY "publicaciones_delete_admin" ON publicaciones
  FOR DELETE USING (
    (SELECT rol FROM perfiles WHERE id = auth.uid() LIMIT 1) = 'admin'
  );

-- 6. Re-crear la vista de autores para la UI (por si acaso no existe)
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
