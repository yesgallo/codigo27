export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export type Role = 'staff' | 'admin';

export interface UserProfile {
  id: string;
  nombre: string;
  apellido: string;
  instagram_handle?: string;
  rol: Role;
  estado_cuenta?: 'pendiente' | 'aprobado' | 'rechazado';
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
  fecha_publicacion?: number;
  created_at: number;
  updated_at?: number;
  autorNombre_demo?: string;
  total_reacciones?: number;
  estadisticas?: {
    reacciones_interesa?: number;
    reacciones_enoja?: number;
    reacciones_alegra?: number;
    reacciones_entristece?: number;
    reacciones_piensa?: number;
  };
}

export type TipoReaccion = 'interesa' | 'enoja' | 'alegra' | 'entristece' | 'piensa';

export interface Reaccion {
  id: string;
  tipo: TipoReaccion;
  created_at: number;
}
