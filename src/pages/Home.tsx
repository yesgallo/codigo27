import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Publicacion, OperationType } from '../types';
import { handleFirestoreError } from '../lib/errorHandler';
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

  useEffect(() => {
    let q = query(
      collection(db, 'publicaciones'),
      where('estado', '==', 'publicado'),
      // orderBy requires index if combining equality and sort, wait: where('estado', '==') and orderBy('fecha_publicacion', 'desc') needs a composite index. 
      // I will skip orderBy and sort client-side to avoid index creation requirement out of the box, or use created_at without filters.
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const posts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Publicacion));
        
        let validPosts = posts;
        if (formatoFiltro) {
          validPosts = validPosts.filter(p => p.formato === formatoFiltro);
        }

        // Sort manually by date
        validPosts.sort((a, b) => (b.fecha_publicacion || b.created_at) - (a.fecha_publicacion || a.created_at));

        // Fetch authors - normally cache this but will do per render for simplicity
        const userIds = [...new Set(validPosts.map(p => p.estudiante_id))];
        
        // chunk fetch users if many
        const authorMap: Record<string, {nombre: string, handle: string}> = {};
        for(const uId of userIds) {
          const uDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', uId)));
          if(!uDoc.empty) {
            authorMap[uId] = { nombre: uDoc.docs[0].data().nombre + ' ' + uDoc.docs[0].data().apellido, handle: uDoc.docs[0].data().instagram_handle };
          }
        }

        setPublicaciones(validPosts.map(p => ({
          ...p,
          autorNombre: p.autorNombre_demo || authorMap[p.estudiante_id]?.nombre || 'Autor Anónimo',
          autorHandle: authorMap[p.estudiante_id]?.handle
        })));
        setLoading(false);
      } catch (e) {
        setLoading(false);
        handleFirestoreError(e, OperationType.LIST, 'publicaciones');
      }
    }, (error) => {
      setLoading(false);
      console.error(error);
    });

    return () => unsubscribe();
  }, [formatoFiltro]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando publicaciones...</div>;
  }

  const [destacada, ...resto] = publicaciones;

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-1 p-1 bg-gray-200 h-full overflow-hidden">
      {publicaciones.length === 0 ? (
        <div className="flex-1 text-center py-20 bg-[#F8F9FA] flex flex-col items-center justify-center">
          <h2 className="text-2xl font-black tracking-tight uppercase italic">No hay publicaciones disponibles</h2>
          <p className="text-gray-500 mt-2 font-medium">Explora los diferentes formatos o regresa más tarde.</p>
        </div>
      ) : (
        <>
          {/* LEFT: Featured Story */}
          <div className="md:w-2/3 flex flex-col bg-white overflow-hidden relative group cursor-pointer h-[50vh] md:h-full">
            {destacada ? (
              <Link to={`/publicacion/${destacada.id}`} className="block h-full w-full bg-gray-300 relative">
                {destacada.imagen_portada ? (
                  <img 
                    src={destacada.imagen_portada} 
                    alt={destacada.titulo}
                    className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-105 opacity-90"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-black/80" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90"></div>
                <div className="absolute top-6 left-6">
                  <span className="bg-[#E63946] text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest">En Portada</span>
                </div>
                <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 right-6 md:right-10">
                  <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.1] mb-4 tracking-tight uppercase italic group-hover:text-red-400 transition-colors">
                    {destacada.titulo}
                  </h2>
                  <div className="flex items-center gap-4 text-white">
                    <p className="text-xs md:text-sm font-bold opacity-80 uppercase">Por {destacada.autorNombre}</p>
                    <span className="h-1 w-1 bg-[#E63946] rounded-full hidden md:block"></span>
                    <p className="text-xs md:text-sm opacity-60 uppercase tracking-widest hidden md:block">
                      {formatDistanceToNow(destacada.fecha_publicacion || destacada.created_at, { addSuffix: true, locale: es })}
                    </p>
                  </div>
                  <div className="mt-6 flex gap-2">
                    <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 flex items-center gap-3">
                      <span className="text-lg leading-none flex items-center gap-2">
                         <FormatoIcon formato={destacada.formato} /> 
                         <span className="text-xs text-white font-bold uppercase tracking-wider">{destacada.formato}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="w-full h-full bg-gray-200"></div>
            )}
          </div>

          {/* RIGHT: Side Feed */}
          <div className="md:w-1/3 flex flex-col gap-1 overflow-y-auto">
            {resto.map(pub => (
              <Link key={pub.id} to={`/publicacion/${pub.id}`} className="flex-1 bg-white p-6 flex flex-col justify-between group min-h-[200px]">
                <div>
                  <span className={`inline-block text-white px-2 py-0.5 text-[9px] font-bold uppercase mb-3 tracking-tighter italic ${pub.formato === 'video' ? 'bg-black' : pub.formato === 'audio' ? 'bg-blue-600' : 'bg-[#E63946]'}`}>
                    {pub.formato}
                  </span>
                  <h3 className="text-xl font-bold leading-tight group-hover:text-[#E63946] transition-colors text-[#1A1A1A] line-clamp-3">
                    {pub.titulo}
                  </h3>
                </div>
                <div className="flex justify-between items-center mt-4 border-t border-gray-100 pt-4">
                  <p className="text-[10px] font-bold uppercase text-gray-400">Por {pub.autorNombre}</p>
                  <p className="text-[10px] font-bold uppercase text-gray-400">
                     {formatDistanceToNow(pub.fecha_publicacion || pub.created_at, { addSuffix: false, locale: es })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
