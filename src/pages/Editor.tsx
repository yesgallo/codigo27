import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { Formato, Publicacion } from '../types';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';
import { MediaEmulador } from '../components/MediaEmulador';

type FormData = {
  titulo: string;
  formato: Formato;
  cuerpo: string;
  media_url: string;
  imagen_portada: string;
}

// Ejecuta una operación de Supabase con timeout
const withTimeout = <T,>(promise: Promise<T>, ms: number, timeoutMsg: string): Promise<T> =>
  Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMsg)), ms)
    ),
  ]);

export const Editor = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loadingDoc, setLoadingDoc] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);
  const [pub, setPub] = useState<Publicacion | null>(null);

  const { register, handleSubmit, watch, reset } = useForm<FormData>({
    defaultValues: { formato: 'texto', titulo: '', media_url: '', cuerpo: '', imagen_portada: '' }
  });

  const formatoWatch = watch('formato');
  const mediaUrlWatch = watch('media_url');

  useEffect(() => {
    if (!isNew && id) {
      const fetchDoc = async () => {
        try {
          const result = await withTimeout(
            supabase.from('publicaciones').select('*').eq('id', id).single(),
            8000,
            'La carga del documento tardó demasiado.'
          );

          const { data, error } = result as any;

          if (error || !data) {
            navigate('/dashboard');
            return;
          }

          if (data.estudiante_id !== user?.id && profile?.rol !== 'admin') {
            navigate('/dashboard');
            return;
          }

          setPub(data as Publicacion);
          reset({
            titulo: data.titulo,
            formato: data.formato,
            cuerpo: data.cuerpo || '',
            media_url: data.media_url || '',
            imagen_portada: data.imagen_portada || ''
          });
        } catch (e: any) {
          console.error('Error loading doc:', e);
          setSaveError('No se pudo cargar el documento: ' + (e?.message || ''));
        } finally {
          setLoadingDoc(false);
        }
      };
      fetchDoc();
    }
  }, [id, isNew, navigate, reset, user, profile]);

  const onSubmit = async (data: FormData) => {
    if (!user) {
      setSaveError('No estás autenticado. Cerrá sesión, volvé a ingresar e intentá de nuevo.');
      return;
    }
    if (!data.titulo.trim()) {
      setSaveError('El título es obligatorio.');
      return;
    }

    setSaving(true);
    setSaveError('');
    setSaved(false);

    try {
      let operation;

      if (isNew) {
        operation = supabase.from('publicaciones').insert({
          titulo: data.titulo.trim(),
          formato: data.formato,
          cuerpo: data.formato === 'texto' ? data.cuerpo : '',
          media_url: (data.formato === 'video' || data.formato === 'audio') ? data.media_url : '',
          imagen_portada: data.imagen_portada,
          estado: 'borrador',
          estudiante_id: user.id,
        });
      } else {
        operation = supabase
          .from('publicaciones')
          .update({
            titulo: data.titulo.trim(),
            formato: data.formato,
            cuerpo: data.formato === 'texto' ? data.cuerpo : '',
            media_url: (data.formato === 'video' || data.formato === 'audio') ? data.media_url : '',
            imagen_portada: data.imagen_portada,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id!);
      }

      const { error } = await withTimeout(
        operation,
        10000,
        'La conexión tardó demasiado. Verificá tu red e intentá de nuevo.'
      ) as any;

      if (error) throw error;

      setSaved(true);
      // Pequeña pausa para que el usuario vea el check de confirmación
      setTimeout(() => navigate('/dashboard'), 800);

    } catch (e: any) {
      console.error('Error saving:', e);
      setSaveError(e?.message || 'Error desconocido al guardar. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingDoc) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#E63946] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-500 font-medium uppercase tracking-widest">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <Link to="/dashboard" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black mb-8 transition">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver al Dashboard
      </Link>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white border border-gray-200 p-6 md:p-10">
          <h1 className="text-3xl font-black tracking-tighter uppercase italic mb-8 border-b-2 border-black pb-4 text-[#1A1A1A]">
            {isNew ? 'Nueva Publicación' : 'Editar Publicación'}
          </h1>

          {pub?.estado === 'observado' && pub.comentario_docente && (
            <div className="mb-8 p-6 bg-red-50 border border-[#E63946] text-[#E63946]">
              <p className="font-black uppercase tracking-widest text-xs mb-2">Comentario de la Docente:</p>
              <p className="font-medium">{pub.comentario_docente}</p>
            </div>
          )}

          {saveError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 text-sm font-medium">
              ⚠️ {saveError}
            </div>
          )}

          {saved && (
            <div className="mb-6 p-4 bg-green-50 border border-green-300 text-green-700 text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              ¡Guardado correctamente! Volviendo al dashboard...
            </div>
          )}

          <div className="space-y-8">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Formato</label>
              <div className="flex gap-4">
                {(['texto', 'video', 'audio'] as Formato[]).map((f) => (
                  <label key={f} className={`flex-1 flex text-center justify-center cursor-pointer border-2 py-4 font-black uppercase tracking-widest text-xs transition-colors ${formatoWatch === f ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'border-gray-200 hover:border-black text-gray-400'}`}>
                    <input type="radio" value={f} className="sr-only" {...register('formato')} />
                    {f}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Título *</label>
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
                  placeholder="Escribí tu artículo aquí..."
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

        <div className="flex justify-between items-center gap-4 mt-8">
          <Link
            to="/dashboard"
            className="border border-gray-300 hover:border-black text-gray-600 hover:text-black px-6 py-4 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={saving || saved}
            className="bg-[#E63946] hover:bg-black disabled:bg-gray-400 text-white px-8 py-4 font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-colors"
          >
            {saved
              ? <><CheckCircle className="w-5 h-5" /> ¡Guardado!</>
              : saving
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
                : <><Save className="w-5 h-5" /> {isNew ? 'Guardar Borrador' : 'Guardar Cambios'}</>
            }
          </button>
        </div>
      </form>
    </div>
  );
};
