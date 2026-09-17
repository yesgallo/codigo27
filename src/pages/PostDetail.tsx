import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Publicacion, UserProfile } from '../types';
import { MediaEmulador } from '../components/MediaEmulador';
import { BarraReacciones } from '../components/BarraReacciones';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Users } from 'lucide-react';

export const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [pub, setPub] = useState<Publicacion & { autorNombre?: string; autorHandle?: string } | null>(null);
  const [colaboradoresInfo, setColaboradoresInfo] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchPost = async () => {
      try {
        const { data, error } = await supabase
          .from('publicaciones')
          .select('*, perfiles(nombre, apellido, instagram_handle)')
          .eq('id', id)
          .single();

        if (error) { console.error('Error fetching post:', error); setLoading(false); return; }

        if (data) {
          const autorNombre = data.autor_nombre_demo ||
            (data.perfiles ? `${data.perfiles.nombre} ${data.perfiles.apellido}` : 'Autor Anónimo');
          const autorHandle = data.perfiles?.instagram_handle || '';
          setPub({ ...data, autorNombre, autorHandle });

          // Cargar datos de colaboradores si existen
          if (data.colaboradores && data.colaboradores.length > 0) {
            const { data: colabs } = await supabase
              .from('perfiles')
              .select('id, nombre, apellido, instagram_handle')
              .in('id', data.colaboradores);
            if (colabs) setColaboradoresInfo(colabs as UserProfile[]);
          }
        }
      } catch (e) {
        console.error('Unexpected error fetching post:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando...</div>;
  if (!pub) return <div className="p-8 text-center text-gray-500">Publicación no encontrada</div>;

  // Detectar si el cuerpo es HTML o texto plano
  const isHtml = pub.cuerpo ? /<[a-z][\s\S]*>/i.test(pub.cuerpo) : false;

  return (
    <article className="max-w-3xl mx-auto px-4 py-8 md:py-16">
      <Link to="/" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-[#E63946] hover:text-black mb-8 transition">
        <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Inicio
      </Link>

      <header className="mb-10 text-center">
        <div className="flex justify-center mb-6">
          <span className={`inline-block text-white px-3 py-1 text-xs font-bold uppercase tracking-widest italic ${pub.formato === 'video' ? 'bg-black' : pub.formato === 'audio' ? 'bg-blue-600' : 'bg-[#E63946]'}`}>
            {pub.formato}
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-[#1A1A1A] leading-[1.1] mb-8 tracking-tighter uppercase italic">
          {pub.titulo}
        </h1>

        <div className="border-y border-gray-200 py-4 mb-10">
          {/* Autor principal */}
          <div className="flex items-center justify-center gap-4 flex-wrap text-sm uppercase font-bold tracking-widest">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">POR</span>
              <span className="text-[#1A1A1A]">{pub.autorNombre}</span>
            </div>
            {pub.fecha_publicacion && (
              <div className="flex items-center gap-2">
                <span className="h-1 w-1 bg-[#E63946] rounded-full"></span>
                <time className="text-gray-400">
                  {format(new Date(pub.fecha_publicacion), "d MMM yyyy", { locale: es })}
                </time>
              </div>
            )}
          </div>

          {/* Co-autores */}
          {colaboradoresInfo.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-3 text-xs uppercase font-bold tracking-widest text-gray-500 flex-wrap">
              <Users className="w-3 h-3" />
              <span>Con la colaboración de:</span>
              {colaboradoresInfo.map((c, i) => (
                <span key={c.id} className="text-[#1A1A1A]">
                  {c.nombre} {c.apellido}{i < colaboradoresInfo.length - 1 ? ',' : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {pub.imagen_portada && pub.formato === 'texto' && (
        <figure className="mb-12">
          <img src={pub.imagen_portada} alt={pub.titulo} className="w-full object-cover max-h-[600px]" />
        </figure>
      )}

      {pub.media_url && (
        <div className="mb-12">
          <MediaEmulador url={pub.media_url} formato={pub.formato} />
        </div>
      )}

      {pub.cuerpo && (
        isHtml
          ? <div
              className="max-w-2xl mx-auto mb-16 text-lg text-[#1A1A1A] leading-relaxed font-medium prose max-w-none"
              dangerouslySetInnerHTML={{ __html: pub.cuerpo }}
            />
          : <div className="max-w-2xl mx-auto mb-16 text-lg text-[#1A1A1A] leading-relaxed font-medium">
              {pub.cuerpo.split('\n').map((line, i) => (
                <p key={i} className={line === '' ? 'mt-4' : 'mb-3'}>{line}</p>
              ))}
            </div>
      )}

      <footer className="mt-16 pt-10 border-t-2 border-black flex flex-col items-center">
        <h3 className="font-black text-2xl uppercase italic tracking-tighter text-[#1A1A1A] mb-6">REACCIONES</h3>
        <div className="flex justify-center">
          <BarraReacciones publicacionId={pub.id} />
        </div>
      </footer>
    </article>
  );
};
