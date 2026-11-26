-- Agregar columna genero a la tabla publicaciones
ALTER TABLE publicaciones ADD COLUMN IF NOT EXISTS genero TEXT;

-- Recargar el esquema de PostgREST en Supabase
NOTIFY pgrst, 'reload schema';
