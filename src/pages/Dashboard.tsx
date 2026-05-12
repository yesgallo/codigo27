import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Publicacion } from '../types';
import { Link, Navigate } from 'react-router-dom';
import { PenSquare, Clock, CheckCircle, AlertCircle, PlusCircle, ArrowLeft, Trash2 } from 'lucide-react';

const StatusBadge = ({ estado }: { estado: string }) => {
  if (estado === 'publicado') return <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"><CheckCircle className="w-3 h-3"/> Publicado</span>;
  if (estado === 'observado') return <span className="flex items-center gap-1 text-[#E63946] bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"><AlertCircle className="w-3 h-3"/> Observado</span>;
  return <span className="flex items-center gap-1 text-gray-500 bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"><Clock className="w-3 h-3"/> Borrador</span>;
};

export const Dashboard = () => {
  const { user, profile } = useAuth();
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPublicaciones = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('publicaciones')
      .select('*')
      .eq('estudiante_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching publicaciones:', error);
    } else {
      setPublicaciones(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchPublicaciones();

    const channelId = `dashboard_realtime_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'publicaciones', filter: `estudiante_id=eq.${user.id}` },
        () => fetchPublicaciones()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('¿Estás seguro de que deseas eliminar este borrador? Esta acción no se puede deshacer.')) {
      const { error } = await supabase.from('publicaciones').delete().eq('id', id);
      if (error) console.error('Error deleting:', error);
      else fetchPublicaciones();
    }
  };

  if (!user || loading) return <div className="p-8 text-center text-gray-500">Cargando dashboard...</div>;

  if (profile?.rol === 'admin') {
    return <Navigate to="/admin" />;
  }

  if (profile?.estado_cuenta === 'pendiente') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 mt-10">
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-8 text-center rounded-xl">
           <h2 className="text-2xl font-black uppercase italic mb-2 tracking-tighter">Cuenta en Revisión</h2>
           <p className="font-medium">Tu cuenta está pendiente de aprobación por el administrador. Podrás publicar artículos o medios cuando tu rol de reportero/a sea validado.</p>
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
          <h1 className="text-4xl font-black text-[#1A1A1A] tracking-tighter uppercase italic">Hola, {profile?.nombre}</h1>
          <p className="text-gray-500 mt-2 font-medium">Gestiona tus producciones periodísticas.</p>
        </div>
        <Link 
          to="/editor/new" 
          className="flex items-center gap-2 bg-[#E63946] hover:bg-red-700 text-white px-6 py-3 text-xs font-bold uppercase tracking-wider transition"
        >
          <PlusCircle className="w-4 h-4" />
          Nueva Publicación
        </Link>
      </div>

      <div className="bg-white border border-gray-200 overflow-hidden flex flex-col min-h-[400px]">
        {publicaciones.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <PenSquare className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-1">Aún no tienes publicaciones</p>
            <p>Comienza a escribir tu primer artículo, subir tu podcast o video.</p>
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
                            {pub.fecha_publicacion ? new Date(pub.fecha_publicacion).toLocaleDateString() : ''}
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl font-bold text-[#1A1A1A] truncate tracking-tight">
                        {pub.titulo || 'Sin título'}
                      </h3>
                      {pub.estado === 'observado' && pub.comentario_docente && (
                        <p className="mt-3 text-sm text-[#E63946] bg-red-50 p-4 border border-red-100 font-medium tracking-wide">
                          <strong className="uppercase mr-2 text-xs">Comentario Jefa de Edición:</strong> {pub.comentario_docente}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-gray-400 shrink-0" onClick={(e) => e.stopPropagation()}>
                       <Link to={`/editor/${pub.id}`} className="flex items-center gap-1 text-gray-600 hover:text-black hover:bg-gray-200 bg-gray-100 px-3 py-2 rounded-md transition text-[10px] font-bold uppercase tracking-widest">
                         <PenSquare className="w-4 h-4" /> Editar
                       </Link>
                       {pub.estado === 'borrador' && (
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
