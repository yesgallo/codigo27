import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Publicacion } from '../types';
import { Link, Navigate } from 'react-router-dom';
import { PenSquare, Clock, CheckCircle, AlertCircle, PlusCircle, ArrowLeft, Trash2, RefreshCw } from 'lucide-react';

const StatusBadge = ({ estado }: { estado: string }) => {
  if (estado === 'publicado') return <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"><CheckCircle className="w-3 h-3"/> Publicado</span>;
  if (estado === 'observado') return <span className="flex items-center gap-1 text-[#E63946] bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"><AlertCircle className="w-3 h-3"/> Observado</span>;
  return <span className="flex items-center gap-1 text-gray-500 bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"><Clock className="w-3 h-3"/> Borrador</span>;
};

export const Dashboard = () => {
  const { user, profile } = useAuth();
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const fetchPublicaciones = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setFetchError('');

    try {
      // Timeout de 8 segundos para la consulta
      const fetchPromise = supabase
        .from('publicaciones')
        .select('*')
        .eq('estudiante_id', user.id)
        .order('created_at', { ascending: false });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 8000)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) {
        console.error('Error fetching publicaciones:', error);
        setFetchError('No se pudieron cargar tus publicaciones.');
      } else {
        setPublicaciones(data || []);
      }
    } catch (e: any) {
      if (e?.message === 'timeout') {
        setFetchError('La conexión tardó demasiado. Verificá tu red e intentá de nuevo.');
      } else {
        console.error('fetchPublicaciones exception:', e);
        setFetchError('Error inesperado al cargar publicaciones.');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPublicaciones();
    // Nota: removemos la suscripción realtime por WebSocket porque genera errores
    // cuando Supabase realtime tiene problemas de conectividad.
    // El usuario puede refrescar manualmente si necesita ver cambios.
  }, [fetchPublicaciones]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('¿Eliminar este borrador? Esta acción no se puede deshacer.')) return;
    try {
      const { error } = await supabase.from('publicaciones').delete().eq('id', id);
      if (error) {
        alert('Error al eliminar: ' + error.message);
      } else {
        fetchPublicaciones();
      }
    } catch (e: any) {
      alert('Error al eliminar: ' + (e?.message || 'Error desconocido'));
    }
  };

  // Mientras carga las publicaciones
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#E63946] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-500 font-medium uppercase tracking-widest">Cargando publicaciones...</p>
        </div>
      </div>
    );
  }

  // Redirigir admin al panel admin
  if (profile?.rol === 'admin') {
    return <Navigate to="/admin" />;
  }

  // Cuenta pendiente de aprobación
  if (profile?.estado_cuenta === 'pendiente') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 mt-10">
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-8 text-center rounded-xl">
          <h2 className="text-2xl font-black uppercase italic mb-2 tracking-tighter">Cuenta en Revisión</h2>
          <p className="font-medium">Tu cuenta está pendiente de aprobación. Podrás publicar cuando el administrador valide tu acceso.</p>
          <Link to="/" className="inline-flex items-center gap-2 mt-6 text-[#E63946] font-bold text-xs uppercase hover:text-black transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver al Inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      <Link to="/" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-[#E63946] hover:text-black mb-8 transition">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver al Inicio
      </Link>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 pb-6 border-b-2 border-black gap-4">
        <div>
          <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">
            Hola, {profile?.nombre || 'Periodista'}
          </h1>
          <p className="text-gray-500 mt-2 font-medium">Gestioná tus producciones periodísticas.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPublicaciones}
            className="flex items-center gap-2 border border-gray-300 hover:border-black text-gray-600 hover:text-black px-4 py-3 text-xs font-bold uppercase tracking-wider transition"
            title="Actualizar lista"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/editor/new"
            className="flex items-center gap-2 bg-[#E63946] hover:bg-red-700 text-white px-6 py-3 text-xs font-bold uppercase tracking-wider transition"
          >
            <PlusCircle className="w-4 h-4" />
            Nueva Publicación
          </Link>
        </div>
      </div>

      {fetchError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center justify-between">
          <span>{fetchError}</span>
          <button onClick={fetchPublicaciones} className="ml-4 underline font-bold text-xs uppercase">
            Reintentar
          </button>
        </div>
      )}

      <div className="bg-white border border-gray-200 overflow-hidden flex flex-col min-h-[400px]">
        {publicaciones.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <PenSquare className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-1">Aún no tenés publicaciones</p>
            <p>Comenzá a escribir tu primer artículo, subí tu podcast o video.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {publicaciones.map(pub => (
              <li key={pub.id}>
                <div className="block hover:bg-gray-50 transition p-6 md:p-8 border-b border-gray-100 last:border-0 relative">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <StatusBadge estado={pub.estado} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#E63946]">{pub.formato}</span>
                        {pub.estado === 'publicado' && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 border-l border-gray-200 pl-3">
                            {pub.fecha_publicacion ? new Date(pub.fecha_publicacion).toLocaleDateString('es-AR') : ''}
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl font-bold text-[#1A1A1A] truncate tracking-tight">
                        {pub.titulo || 'Sin título'}
                      </h3>
                      {pub.estado === 'observado' && pub.comentario_docente && (
                        <p className="mt-3 text-sm text-[#E63946] bg-red-50 p-4 border border-red-100 font-medium tracking-wide">
                          <strong className="uppercase mr-2 text-xs">Comentario:</strong> {pub.comentario_docente}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-gray-400 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Link
                        to={`/editor/${pub.id}`}
                        className="flex items-center gap-1 text-gray-600 hover:text-black hover:bg-gray-200 bg-gray-100 px-3 py-2 rounded-md transition text-[10px] font-bold uppercase tracking-widest"
                      >
                        <PenSquare className="w-4 h-4" /> Editar
                      </Link>
                      {pub.estado !== 'publicado' && (
                        <button
                          onClick={(e) => handleDelete(e, pub.id)}
                          className="flex items-center gap-1 text-[#E63946] hover:text-white transition-colors bg-red-50 hover:bg-red-600 px-3 py-2 rounded-md text-[10px] font-bold uppercase tracking-widest"
                        >
                          <Trash2 className="w-4 h-4" /> Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
