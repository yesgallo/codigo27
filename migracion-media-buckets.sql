-- Crear buckets para videos y audios (ejecutar en Supabase SQL Editor)
-- Ve a: Supabase Dashboard → Storage → New bucket (para cada uno)
-- O ejecutá este SQL:

INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('videos_publicaciones', 'videos_publicaciones', true),
  ('audios_publicaciones', 'audios_publicaciones', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acceso para videos
CREATE POLICY "Videos públicos para lectura" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos_publicaciones');

CREATE POLICY "Staff puede subir videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'videos_publicaciones' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Autor puede actualizar su video" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'videos_publicaciones' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Políticas de acceso para audios
CREATE POLICY "Audios públicos para lectura" ON storage.objects
  FOR SELECT USING (bucket_id = 'audios_publicaciones');

CREATE POLICY "Staff puede subir audios" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'audios_publicaciones' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Autor puede actualizar su audio" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'audios_publicaciones' AND auth.uid()::text = (storage.foldername(name))[1]
  );
