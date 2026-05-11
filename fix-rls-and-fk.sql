-- ============================================
-- CORRECCIONES CRÍTICAS - Ejecutar completo en SQL Editor
-- ============================================

-- 1. CORREGIR RECURSIÓN INFINITA EN RLS DE PERFILES
-- El problema: las policies de perfiles hacen SELECT a perfiles para verificar rol = admin
-- → causa bucle infinito. La solución: usar auth.jwt() o una función security definer.

-- Primero eliminamos todas las policies problemáticas de perfiles
DROP POLICY IF EXISTS "perfiles_select_own" ON perfiles;
DROP POLICY IF EXISTS "perfiles_select_admin" ON perfiles;
DROP POLICY IF EXISTS "perfiles_insert_own" ON perfiles;
DROP POLICY IF EXISTS "perfiles_update_own" ON perfiles;
DROP POLICY IF EXISTS "perfiles_update_admin" ON perfiles;

-- Función auxiliar que lee el rol SIN disparar RLS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_my_rol()
RETURNS TEXT AS $$
  SELECT rol FROM public.perfiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Recrear policies SIN recursión
CREATE POLICY "perfiles_select_own" ON perfiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "perfiles_select_admin" ON perfiles
  FOR SELECT USING (get_my_rol() = 'admin');

CREATE POLICY "perfiles_insert_own" ON perfiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "perfiles_update_own" ON perfiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "perfiles_update_admin" ON perfiles
  FOR UPDATE USING (get_my_rol() = 'admin');


-- 2. CORREGIR LAS POLICIES DE PUBLICACIONES (también usan subquery recursiva)
DROP POLICY IF EXISTS "publicaciones_select_admin" ON publicaciones;
DROP POLICY IF EXISTS "publicaciones_update_admin" ON publicaciones;
DROP POLICY IF EXISTS "publicaciones_delete_admin" ON publicaciones;
DROP POLICY IF EXISTS "publicaciones_insert_staff" ON publicaciones;
DROP POLICY IF EXISTS "publicaciones_update_own" ON publicaciones;
DROP POLICY IF EXISTS "publicaciones_delete_own_draft" ON publicaciones;

-- Recrear usando get_my_rol()
CREATE POLICY "publicaciones_select_admin" ON publicaciones
  FOR SELECT USING (get_my_rol() = 'admin');

CREATE POLICY "publicaciones_update_admin" ON publicaciones
  FOR UPDATE USING (get_my_rol() = 'admin');

CREATE POLICY "publicaciones_delete_admin" ON publicaciones
  FOR DELETE USING (get_my_rol() = 'admin');

CREATE POLICY "publicaciones_insert_staff" ON publicaciones
  FOR INSERT WITH CHECK (auth.uid() = estudiante_id);

CREATE POLICY "publicaciones_update_own" ON publicaciones
  FOR UPDATE USING (auth.uid() = estudiante_id);

CREATE POLICY "publicaciones_delete_own_draft" ON publicaciones
  FOR DELETE USING (auth.uid() = estudiante_id AND estado = 'borrador');


-- 3. CORREGIR FOREIGN KEY para que PostgREST pueda hacer el JOIN
-- PostgREST necesita una FK real registrada en el schema
-- Verificamos si existe y la recreamos correctamente

ALTER TABLE publicaciones
  DROP CONSTRAINT IF EXISTS publicaciones_estudiante_id_fkey;

ALTER TABLE publicaciones
  ADD CONSTRAINT publicaciones_estudiante_id_fkey
  FOREIGN KEY (estudiante_id) REFERENCES perfiles(id) ON DELETE SET NULL;

-- 4. SEED DATA: 5 publicaciones de prueba publicadas
-- (se insertarán con el id del admin yesicalp@gmail.com)
-- Primero obtenemos el id del admin:
DO $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'yesicalp@gmail.com' LIMIT 1;

  IF admin_id IS NOT NULL THEN
    INSERT INTO publicaciones (titulo, cuerpo, formato, imagen_portada, estado, estudiante_id, autor_nombre_demo, fecha_publicacion)
    VALUES
    (
      'El Renacimiento de los Huertos Urbanos: Cultivando Sostenibilidad',
      'En las grandes metrópolis del mundo, una tendencia está transformando los balcones y azoteas en oasis productivos. Los huertos urbanos no solo ofrecen alimentos frescos, sino que actúan como reguladores térmicos naturales y promueven la biodiversidad en entornos de concreto. Esta práctica ha fortalecido los lazos comunitarios en barrios donde los vecinos comparten semillas y técnicas de cultivo ecológico.',
      'texto',
      'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=1200&auto=format&fit=crop',
      'publicado',
      admin_id,
      'Lucía Méndez',
      NOW() - INTERVAL '1 day'
    ),
    (
      'La Inteligencia Artificial en el Arte: ¿Colaboradora o Competidora?',
      'El auge de las herramientas de generación de imágenes mediante IA ha desatado un debate sin precedentes en la comunidad creativa. Mientras algunos artistas ven en estos algoritmos una extensión de su pincel para explorar horizontes visuales antes imposibles, otros temen por la devaluación del esfuerzo humano y los derechos de autor.',
      'texto',
      'https://images.unsplash.com/photo-1675271591211-126ad94e495d?q=80&w=1200&auto=format&fit=crop',
      'publicado',
      admin_id,
      'Julián Estrada',
      NOW() - INTERVAL '2 days'
    ),
    (
      'Turismo de Estrellas: El Auge de los Destinos Starlight',
      'La búsqueda de cielos limpios y libres de contaminación lumínica se ha convertido en el nuevo motor del turismo astronómico. Regiones remotas están recibiendo a viajeros equipados con telescopios que buscan conectar con el cosmos.',
      'texto',
      'https://images.unsplash.com/photo-1506318137071-a8e063b4bcc0?q=80&w=1200&auto=format&fit=crop',
      'publicado',
      admin_id,
      'Mariana Casal',
      NOW() - INTERVAL '3 days'
    ),
    (
      'El Método JOMO: La Alegría de Perderse de Algo',
      'Frente a la ansiedad generada por la hiperconectividad (FOMO), surge el movimiento JOMO (Joy Of Missing Out). Esta filosofía invita a las personas a desconectarse de las redes sociales para reconectar con el presente, la lectura física y el silencio.',
      'texto',
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1200&auto=format&fit=crop',
      'publicado',
      admin_id,
      'Roberto Varela',
      NOW() - INTERVAL '4 days'
    ),
    (
      'Avances en la Energía de Fusión: El Sol en la Tierra',
      'Científicos han alcanzado hitos históricos en la contención de plasma para generar energía mediante fusión nuclear, una fuente limpia y virtualmente ilimitada. A diferencia de la fisión actual, este proceso no produce residuos radioactivos de larga duración.',
      'texto',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
      'publicado',
      admin_id,
      'Elena Torres',
      NOW() - INTERVAL '5 days'
    );

    RAISE NOTICE 'Seed data insertada correctamente para admin_id: %', admin_id;
  ELSE
    RAISE NOTICE 'No se encontró el usuario admin. Asegurate de que yesicalp@gmail.com esté registrado.';
  END IF;
END $$;
