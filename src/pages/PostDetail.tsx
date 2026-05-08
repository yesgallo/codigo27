import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Publicacion, OperationType } from '../types';
import { handleFirestoreError } from '../lib/errorHandler';
import { MediaEmulador } from '../components/MediaEmulador';
import { BarraReacciones } from '../components/BarraReacciones';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { ArrowLeft } from 'lucide-react';

export const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [pub, setPub] = useState<Publicacion & { autorNombre?: string, autorHandle?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchPost = async () => {
      try {
        const d = await getDoc(doc(db, 'publicaciones', id));
        if (d.exists()) {
          const data = d.data() as Publicacion;
          
          let autorNombre = data.autorNombre_demo || 'Autor Anónimo';
          let autorHandle = '';
          const uDoc = await getDoc(doc(db, 'users', data.estudiante_id));
          if(uDoc.exists()) {
            if (!data.autorNombre_demo) autorNombre = `${uDoc.data().nombre} ${uDoc.data().apellido}`;
            autorHandle = uDoc.data().instagram_handle || '';
          }

          setPub({ id: d.id, ...data, autorNombre, autorHandle });
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, `publicaciones/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando...</div>;
  if (!pub) return <div className="p-8 text-center text-gray-500">Publicación no encontrada</div>;

  return (
    <article className="max-w-3xl mx-auto px-4 py-8 md:py-16">
      <Link to="/" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-[#E63946] hover:text-black mb-8 transition">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver al Inicio
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
        
        <div className="flex items-center justify-center gap-6 border-y border-gray-200 py-4 mb-10 text-sm uppercase font-bold tracking-widest">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">POR</span>
            <span className="text-[#1A1A1A]">{pub.autorNombre}</span>
          </div>
          {pub.fecha_publicacion && (
             <div className="flex items-center gap-2">
               <span className="h-1 w-1 bg-[#E63946] rounded-full"></span>
               <time className="text-gray-400">
                 {format(pub.fecha_publicacion, "d MMM yyyy", { locale: es })}
               </time>
             </div>
          )}
        </div>
      </header>

      {pub.imagen_portada && pub.formato === 'texto' && (
        <figure className="mb-12">
          <img 
            src={pub.imagen_portada} 
            alt={pub.titulo} 
            className="w-full object-cover max-h-[600px]"
          />
        </figure>
      )}

      {pub.media_url && (
        <div className="mb-12">
          <MediaEmulador url={pub.media_url} formato={pub.formato} />
        </div>
      )}

      {pub.cuerpo && (
        <div className="max-w-2xl mx-auto mb-16 text-lg text-[#1A1A1A] leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: pub.cuerpo.replace(/\n      /g, '<br/>') }} />
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
