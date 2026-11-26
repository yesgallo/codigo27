import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Publicacion } from '../types';
import { Link, useSearchParams } from 'react-router-dom';
import { Video, Headphones, FileText, Play, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface PostConAutor extends Publicacion {
  autorNombre?: string;
  autorHandle?: string;
}

// Subcomponente de columna para la portada en 3 columnas
const ColumnaPeriodistica = ({
  titulo,
  icono,
  colorBadge,
  posts,
}: {
  titulo: string;
  icono: React.ReactNode;
  colorBadge: string;
  posts: PostConAutor[];
}) => {
  const principal = posts[0];
  const secundarias = posts.slice(1);

  return (
    <section className="flex flex-col">
      {/* Cabezal de la columna estilo diario */}
      <div className="pb-3 mb-6 border-b-2 border-black flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 ${colorBadge}`}></span>
          <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-[#1A1A1A] flex items-center gap-2">
            {icono}
            {titulo}
          </h2>
        </div>
        <span className="text-xs font-bold text-gray-400 font-mono">
          {posts.length}
        </span>
      </div>

      {posts.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-gray-200 p-6 bg-gray-50/50">
          <p className="text-xs text-gray-400 uppercase font-bold tracking-wider italic">
            Sin producciones en esta sección
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Nota Principal / Destacada de la columna */}
          {principal && (
            <article className="mb-6 pb-6 border-b border-gray-200">
              <Link to={`/publicacion/${principal.id}`} className="group block">
                {principal.imagen_portada && (
                  <div className="mb-4 overflow-hidden bg-gray-100 aspect-video relative border border-gray-100">
                    <img
                      src={principal.imagen_portada}
                      alt={principal.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {principal.formato === 'video' && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-10 h-10 bg-white/95 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 text-black fill-current ml-0.5" />
                        </div>
                      </div>
                    )}
                    {principal.formato === 'audio' && (
                      <div className="absolute bottom-2 left-2 bg-black/80 text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded flex items-center gap-1">
                        <Headphones className="w-3 h-3 text-[#E63946]" /> Podcast
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {principal.genero && (
                    <span className="bg-[#1A1A1A] text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                      {principal.genero}
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {formatDistanceToNow(new Date(principal.fecha_publicacion || principal.created_at), { addSuffix: true, locale: es })}
                  </span>
                </div>

                <h3 className="text-xl md:text-2xl font-black text-[#1A1A1A] leading-tight uppercase italic group-hover:text-[#E63946] transition-colors mb-2">
                  {principal.titulo}
                </h3>

                <div className="flex items-center gap-1.5 text-xs uppercase font-bold text-gray-500">
                  <span className="text-gray-400 text-[10px]">POR</span>
                  <span className="text-[#1A1A1A]">{principal.autorNombre}</span>
                </div>
              </Link>
            </article>
          )}

          {/* Notas Secundarias / Listado compacto */}
          {secundarias.length > 0 && (
            <div className="space-y-5">
              {secundarias.map((post) => (
                <article key={post.id} className="pb-5 border-b border-gray-100 last:border-b-0">
                  <Link to={`/publicacion/${post.id}`} className="group block">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      {post.genero && (
                        <span className="bg-gray-100 border border-gray-200 text-gray-800 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5">
                          {post.genero}
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {formatDistanceToNow(new Date(post.fecha_publicacion || post.created_at), { addSuffix: true, locale: es })}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-[#1A1A1A] leading-snug group-hover:text-[#E63946] transition-colors mb-1.5 line-clamp-3">
                      {post.titulo}
                    </h4>

                    <div className="flex items-center gap-1 text-[11px] uppercase font-bold text-gray-500">
                      <span className="text-gray-400 text-[9px]">POR</span>
                      <span className="text-gray-900">{post.autorNombre}</span>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export const Home = () => {
  const [publicaciones, setPublicaciones] = useState<PostConAutor[]>([]);
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
    return <div className="p-8 text-center text-gray-500 font-medium uppercase tracking-widest text-xs">Cargando portada...</div>;
  }

  // Filtrar por cada tipo de formato
  const textos = publicaciones.filter(p => p.formato === 'texto');
  const podcasts = publicaciones.filter(p => p.formato === 'audio');
  const videos = publicaciones.filter(p => p.formato === 'video');

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 md:py-12">
      {/* Si hay un filtro activo por URL (ej. ?formato=audio) */}
      {formatoFiltro && (
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-black">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase tracking-widest text-[#E63946]">Sección:</span>
            <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tight text-[#1A1A1A]">
              {formatoFiltro === 'audio' ? 'Podcasts' : formatoFiltro === 'video' ? 'Videos' : 'Artículos & Textos'}
            </h1>
          </div>
          <Link
            to="/"
            className="inline-flex items-center text-xs font-black uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Ver portada completa (3 columnas)
          </Link>
        </div>
      )}

      {/* Si no hay publicaciones en absoluto */}
      {publicaciones.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200">
          <h2 className="text-2xl font-black tracking-tight uppercase italic">No hay publicaciones disponibles</h2>
          <p className="text-gray-500 mt-2 font-medium">Regresa más tarde para ver nuevas producciones.</p>
        </div>
      ) : formatoFiltro ? (
        /* Vista filtrada: cuadrícula periodística */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicaciones.map(pub => (
            <article
              key={pub.id}
              className="bg-white p-6 border-2 border-gray-200 hover:border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {pub.imagen_portada && (
                  <div className="mb-4 aspect-video overflow-hidden bg-gray-100">
                    <img src={pub.imagen_portada} alt={pub.titulo} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {pub.genero && (
                    <span className="bg-[#1A1A1A] text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5">
                      {pub.genero}
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {formatDistanceToNow(new Date(pub.fecha_publicacion || pub.created_at), { addSuffix: true, locale: es })}
                  </span>
                </div>
                <h2 className="text-xl font-black text-[#1A1A1A] leading-snug uppercase italic mb-3">
                  <Link to={`/publicacion/${pub.id}`} className="hover:text-[#E63946] transition-colors">
                    {pub.titulo}
                  </Link>
                </h2>
              </div>
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs uppercase font-bold text-gray-500">
                <span>POR <strong className="text-[#1A1A1A]">{pub.autorNombre}</strong></span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        /* Portada Principal: 3 Columnas Tradicionales con líneas divisorias */
        <div>
          {/* Cabezal de edición periodística */}
          <div className="border-t-2 border-b border-black py-2.5 mb-8 flex flex-col sm:flex-row justify-between items-center text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500 gap-2">
            <span>Edición Digital · Bolívar</span>
            <span className="text-[#E63946]">Producciones Periodísticas</span>
            <span>Total: {publicaciones.length} publicaciones</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-0 lg:divide-x divide-gray-300">
            {/* Columna 1: Artículos & Textos */}
            <div className="lg:pr-8">
              <ColumnaPeriodistica
                titulo="Artículos & Textos"
                icono={<FileText className="w-5 h-5 text-[#E63946]" />}
                colorBadge="bg-[#E63946]"
                posts={textos}
              />
            </div>

            {/* Columna 2: Podcasts */}
            <div className="lg:px-8">
              <ColumnaPeriodistica
                titulo="Podcasts"
                icono={<Headphones className="w-5 h-5 text-blue-600" />}
                colorBadge="bg-blue-600"
                posts={podcasts}
              />
            </div>

            {/* Columna 3: Videos */}
            <div className="lg:pl-8">
              <ColumnaPeriodistica
                titulo="Videos"
                icono={<Video className="w-5 h-5 text-black" />}
                colorBadge="bg-black"
                posts={videos}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
