-- Eliminar políticas viejas por si quedaron a medias
DROP POLICY IF EXISTS "Videos públicos para lectura" ON storage.objects;
DROP POLICY IF EXISTS "Staff puede subir videos" ON storage.objects;
DROP POLICY IF EXISTS "Autor puede actualizar su video" ON storage.objects;
DROP POLICY IF EXISTS "Audios públicos para lectura" ON storage.objects;
DROP POLICY IF EXISTS "Staff puede subir audios" ON storage.objects;
DROP POLICY IF EXISTS "Autor puede actualizar su audio" ON storage.objects;

-- Políticas universales para VIDEOS (Lectura pública, Insert/Update/Delete para usuarios logueados)
CREATE POLICY "Lectura publica videos" ON storage.objects FOR SELECT USING (bucket_id = 'videos_publicaciones');
CREATE POLICY "Insertar videos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'videos_publicaciones');
CREATE POLICY "Actualizar videos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'videos_publicaciones');
CREATE POLICY "Eliminar videos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'videos_publicaciones');

-- Políticas universales para AUDIOS (Lectura pública, Insert/Update/Delete para usuarios logueados)
CREATE POLICY "Lectura publica audios" ON storage.objects FOR SELECT USING (bucket_id = 'audios_publicaciones');
CREATE POLICY "Insertar audios" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'audios_publicaciones');
CREATE POLICY "Actualizar audios" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'audios_publicaciones');
CREATE POLICY "Eliminar audios" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'audios_publicaciones');
