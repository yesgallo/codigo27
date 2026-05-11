export type Role = 'staff' | 'admin';

export interface UserProfile {
  id: string;
  nombre: string;
  apellido: string;
  instagram_handle?: string;
  rol: Role;
  estado_cuenta?: 'pendiente' | 'aprobado' | 'rechazado';
  created_at?: string;
}

export type Formato = 'texto' | 'video' | 'audio';
export type Estado = 'borrador' | 'publicado' | 'observado';

export interface Publicacion {
  id: string;
  titulo: string;
  cuerpo?: string;
  formato: Formato;
  media_url?: string;
  imagen_portada?: string;
  estado: Estado;
  comentario_docente?: string;
  estudiante_id: string;
  autor_nombre_demo?: string;
  total_reacciones?: number;
  fecha_publicacion?: string;
  created_at: string;
  updated_at?: string;
  // Joined from perfiles
  perfiles?: {
    nombre: string;
    apellido: string;
    instagram_handle?: string;
  };
}

export type TipoReaccion = 'interesa' | 'enoja' | 'alegra' | 'entristece' | 'piensa';

export interface Reaccion {
  id: number;
  publicacion_id: string;
  tipo: TipoReaccion;
  created_at: string;
}
