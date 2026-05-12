-- =====================================================
-- FIX DE CLAVE FORÁNEA (FOREIGN KEY)
-- Ejecutar en Supabase Dashboard → SQL Editor → New query
-- =====================================================

-- 1. Eliminar la restricción vieja que apunta a la tabla equivocada ("users")
ALTER TABLE publicaciones 
  DROP CONSTRAINT IF EXISTS publicaciones_estudiante_id_fkey;

-- 2. Crear la restricción correcta apuntando a "perfiles"
ALTER TABLE publicaciones 
  ADD CONSTRAINT publicaciones_estudiante_id_fkey 
  FOREIGN KEY (estudiante_id) 
  REFERENCES perfiles(id) 
  ON DELETE SET NULL;

-- 3. Recargar la memoria caché de Supabase para que reconozca el cambio
NOTIFY pgrst, 'reload schema';
