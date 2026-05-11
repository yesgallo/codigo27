-- Paso 1: Agregar columna faltante si no existe
ALTER TABLE publicaciones ADD COLUMN IF NOT EXISTS autor_nombre_demo TEXT;

-- Paso 2: Asegurarse de que estudiante_id sea nullable
ALTER TABLE publicaciones ALTER COLUMN estudiante_id DROP NOT NULL;

-- Paso 3: Insertar seed data sin estudiante_id (solo con autor_nombre_demo)
INSERT INTO publicaciones (titulo, cuerpo, formato, imagen_portada, estado, autor_nombre_demo, fecha_publicacion)
VALUES
(
  'El Renacimiento de los Huertos Urbanos: Cultivando Sostenibilidad',
  'En las grandes metrópolis del mundo, una tendencia está transformando los balcones y azoteas en oasis productivos. Los huertos urbanos no solo ofrecen alimentos frescos, sino que actúan como reguladores térmicos naturales y promueven la biodiversidad en entornos de concreto. Esta práctica ha fortalecido los lazos comunitarios en barrios donde los vecinos comparten semillas y técnicas de cultivo ecológico.',
  'texto',
  'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=1200&auto=format&fit=crop',
  'publicado', 'Lucía Méndez', NOW() - INTERVAL '1 day'
),
(
  'La Inteligencia Artificial en el Arte: ¿Colaboradora o Competidora?',
  'El auge de las herramientas de generación de imágenes mediante IA ha desatado un debate sin precedentes en la comunidad creativa. Mientras algunos artistas ven en estos algoritmos una extensión de su pincel para explorar horizontes visuales antes imposibles, otros temen por la devaluación del esfuerzo humano y los derechos de autor.',
  'texto',
  'https://images.unsplash.com/photo-1675271591211-126ad94e495d?q=80&w=1200&auto=format&fit=crop',
  'publicado', 'Julián Estrada', NOW() - INTERVAL '2 days'
),
(
  'Turismo de Estrellas: El Auge de los Destinos Starlight',
  'La búsqueda de cielos limpios y libres de contaminación lumínica se ha convertido en el nuevo motor del turismo astronómico. Regiones remotas reciben a viajeros equipados con telescopios que buscan conectar con el cosmos. Este fenómeno ha impulsado a diversos gobiernos a proteger zonas rurales mediante leyes de protección del cielo nocturno.',
  'texto',
  'https://images.unsplash.com/photo-1506318137071-a8e063b4bcc0?q=80&w=1200&auto=format&fit=crop',
  'publicado', 'Mariana Casal', NOW() - INTERVAL '3 days'
),
(
  'El Método JOMO: La Alegría de Perderse de Algo',
  'Frente a la ansiedad generada por la hiperconectividad (FOMO), surge el movimiento JOMO (Joy Of Missing Out). Esta filosofía invita a las personas a desconectarse de las redes sociales para reconectar con el presente, la lectura física y el silencio.',
  'texto',
  'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1200&auto=format&fit=crop',
  'publicado', 'Roberto Varela', NOW() - INTERVAL '4 days'
),
(
  'Avances en la Energía de Fusión: El Sol en la Tierra',
  'Científicos han alcanzado hitos históricos en la contención de plasma para generar energía mediante fusión nuclear, una fuente limpia y virtualmente ilimitada. A diferencia de la fisión actual, este proceso no produce residuos radioactivos de larga duración.',
  'texto',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
  'publicado', 'Elena Torres', NOW() - INTERVAL '5 days'
);
