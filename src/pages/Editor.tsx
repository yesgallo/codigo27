import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Formato, OperationType, Publicacion } from '../types';
import { handleFirestoreError } from '../lib/errorHandler';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { MediaEmulador } from '../components/MediaEmulador';

type FormData = {
  titulo: string;
  formato: Formato;
  cuerpo: string;
  media_url: string;
  imagen_portada: string;
}

export const Editor = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!isNew);
  const [pub, setPub] = useState<Publicacion | null>(null);

  const { register, handleSubmit, watch, control, reset, setValue } = useForm<FormData>({
    defaultValues: { formato: 'texto', titulo: '', media_url: '', cuerpo: '', imagen_portada: '' }
  });

  const formatoWatch = watch('formato');
  const mediaUrlWatch = watch('media_url');

  useEffect(() => {
    if (!isNew && id) {
      const fetchDoc = async () => {
        try {
          const d = await getDoc(doc(db, 'publicaciones', id));
          if (d.exists()) {
            const data = d.data() as Publicacion;
            if (data.estudiante_id !== user?.uid && user?.email !== 'yesicalp@gmail.com') { // simple client guard
              navigate('/dashboard');
              return;
            }
            setPub({ id: d.id, ...data });
            reset({
              titulo: data.titulo,
              formato: data.formato,
              cuerpo: data.cuerpo || '',
              media_url: data.media_url || '',
              imagen_portada: data.imagen_portada || ''
            });
          } else {
             navigate('/dashboard');
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, `publicaciones/${id}`);
        } finally {
          setLoading(false);
        }
      };
      fetchDoc();
    }
  }, [id, isNew, navigate, reset, user]);

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    try {
      const docId = isNew ? crypto.randomUUID() : id!;
      const docRef = doc(db, 'publicaciones', docId);

      if (isNew) {
        await setDoc(docRef, {
          titulo: data.titulo,
          formato: data.formato,
          cuerpo: data.formato === 'texto' ? data.cuerpo : '',
          media_url: (data.formato === 'video' || data.formato === 'audio') ? data.media_url : '',
          imagen_portada: data.imagen_portada,
          estado: 'borrador',
          estudiante_id: user.uid,
          created_at: Date.now(),
        });
      } else {
        await updateDoc(docRef, {
          titulo: data.titulo,
          formato: data.formato,
          cuerpo: data.formato === 'texto' ? data.cuerpo : '',
          media_url: (data.formato === 'video' || data.formato === 'audio') ? data.media_url : '',
          imagen_portada: data.imagen_portada,
          updated_at: Date.now()
          // estado remains the same, if observed they update the fields, maybe they change it to pending? 
          // The spec says student acts as redactant, admin publishes. If it's observed and edited, does it remain observed until admin checks? Yes.
        });
      }
      navigate('/dashboard');
    } catch (e) {
      handleFirestoreError(e, isNew ? OperationType.CREATE : OperationType.UPDATE, `publicaciones`);
    }
  };

  if (loading) return <div className="p-8">Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <Link to="/dashboard" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black mb-8 transition">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver al Dashboard
      </Link>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white border text-[#1A1A1A] border-gray-200 p-6 md:p-10 shadow-none">
           <h1 className="text-3xl font-black tracking-tighter uppercase italic mb-8 border-b-2 border-black pb-4 text-[#1A1A1A]">
             {isNew ? 'Nueva Publicación' : 'Editar Publicación'}
           </h1>

           {pub?.estado === 'observado' && pub.comentario_docente && (
             <div className="mb-8 p-6 bg-red-50 border border-[#E63946] text-[#E63946]">
                <p className="font-black uppercase tracking-widest text-xs mb-2">Comentario de la Docente:</p>
                <p className="font-medium">{pub.comentario_docente}</p>
             </div>
           )}

           <div className="space-y-8">
              <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Formato</label>
                 <div className="flex gap-4">
                    {['texto', 'video', 'audio'].map((f) => (
                      <label key={f} className={`flex-1 flex text-center justify-center cursor-pointer border-2 py-4 font-black uppercase tracking-widest text-xs transition-colors ${formatoWatch === f ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'border-gray-200 hover:border-black text-gray-400'}`}>
                        <input type="radio" value={f} className="sr-only" {...register('formato')} />
                        {f}
                      </label>
                    ))}
                 </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Título</label>
                <input 
                  {...register('titulo', { required: true })}
                  className="w-full border-b-2 border-gray-200 bg-transparent px-0 py-3 text-2xl font-black tracking-tight placeholder-gray-300 outline-none focus:border-black transition-colors"
                  placeholder="Titular impactante..."
                />
              </div>

              {formatoWatch === 'texto' && (
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Cuerpo del Artículo</label>
                   <textarea 
                     {...register('cuerpo')}
                     rows={15}
                     className="w-full border-2 border-gray-200 p-4 outline-none focus:border-black transition-colors resize-y font-medium leading-relaxed text-lg"
                     placeholder="Escribe tu artículo aquí..."
                   ></textarea>
                </div>
              )}

              {(formatoWatch === 'video' || formatoWatch === 'audio') && (
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
                     URL del Medio ({formatoWatch === 'video' ? 'YouTube' : 'Spotify'})
                   </label>
                   <input 
                     {...register('media_url')}
                     className="w-full border-b-2 border-gray-200 bg-transparent px-0 py-3 text-lg font-medium placeholder-gray-300 outline-none focus:border-black transition-colors mb-6"
                     placeholder={`https://${formatoWatch === 'video' ? 'youtube.com/watch?v=...' : 'open.spotify.com/...'}`}
                   />
                   {mediaUrlWatch && (
                     <div className="p-6 bg-gray-50 border border-gray-200">
                       <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Previsualización</p>
                       <MediaEmulador url={mediaUrlWatch} formato={formatoWatch} />
                     </div>
                   )}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">URL Imagen de Portada (Opcional)</label>
                <input 
                  {...register('imagen_portada')}
                  className="w-full border-b-2 border-gray-200 bg-transparent px-0 py-3 text-lg font-medium placeholder-gray-300 outline-none focus:border-black transition-colors"
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>
           </div>
        </div>

        <div className="flex justify-end gap-4 mt-8 w-full md:w-auto">
           <button 
             type="submit"
             className="bg-[#E63946] hover:bg-black text-white px-8 py-4 font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-colors w-full md:w-auto justify-center"
           >
             <Save className="w-5 h-5" />
             {isNew ? 'Guardar Borrador' : 'Guardar Cambios'}
           </button>
        </div>
      </form>
    </div>
  );
};
