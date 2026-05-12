import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Publicacion } from '../types';
import { Link, useSearchParams } from 'react-router-dom';
import { Video, Headphones, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const FormatoIcon = ({ formato }: { formato: string }) => {
  if (formato === 'video') return <Video className="w-4 h-4 text-white" />;
  if (formato === 'audio') return <Headphones className="w-4 h-4 text-white" />;
  return <FileText className="w-4 h-4 text-white" />;
};

export const Home = () => {
  const [publicaciones, setPublicaciones] = useState<(Publicacion & { autorNombre?: string, autorHandle?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const formatoFiltro = searchParams.get('formato');

  const fetchPublicaciones = async () => {
    try {
      let query = supabase
        .from('publicaciones')
        .select('*, perfiles(nombre, apellido, instagram_handle)')
        .eq('estado', 'publicado')
        .order('fecha_publicacion', { ascending: false, nullsFirst: false });

      if (formatoFiltro) {
        query = query.eq('formato', formatoFiltro);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching publicaciones:', error);
      }
      
      const posts = (data || []).map((p: any) => ({
        ...p,
        autorNombre: p.autor_nombre_demo || 
          (p.perfiles ? `${p.perfiles.nombre} ${p.perfiles.apellido}` : 'Autor Anónimo'),
        autorHandle: p.perfiles?.instagram_handle || '',
      }));

      setPublicaciones(posts);
    } catch (e) {
      console.error('Unexpected error fetching publicaciones:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicaciones();

    // Realtime subscription
    const channelId = `publicaciones_home_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'publicaciones', filter: 'estado=eq.publicado' },
        () => {
          fetchPublicaciones();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [formatoFiltro]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando publicaciones...</div>;
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 md:py-16">
      {publicaciones.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200">
          <h2 className="text-2xl font-black tracking-tight uppercase italic">No hay publicaciones disponibles</h2>
          <p className="text-gray-500 mt-2 font-medium">Explora los diferentes formatos o regresa más tarde.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl md:text-5xl font-black text-[#1A1A1A] leading-[1.1] mb-8 tracking-tighter uppercase italic border-b-4 border-black pb-4">
            Últimas Publicaciones
          </h1>
          {publicaciones.map((pub) => (
            <Link 
              key={pub.id} 
              to={`/publicacion/${pub.id}`} 
              className="group block bg-white p-6 md:p-10 border-2 border-gray-100 hover:border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 relative overflow-hidden"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`inline-flex items-center gap-1.5 text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest ${pub.formato === 'video' ? 'bg-black' : pub.formato === 'audio' ? 'bg-blue-600' : 'bg-[#E63946]'}`}>
                      <FormatoIcon formato={pub.formato} />
                      {pub.formato}
                    </span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      {formatDistanceToNow(new Date(pub.fecha_publicacion || pub.created_at), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                  
                  <h2 className="text-2xl md:text-4xl font-black text-[#1A1A1A] leading-[1.1] tracking-tight uppercase italic group-hover:text-[#E63946] transition-colors mb-4 line-clamp-2">
                    {pub.titulo}
                  </h2>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">POR</span>
                    <span className="text-sm font-bold uppercase text-[#1A1A1A]">{pub.autorNombre}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
