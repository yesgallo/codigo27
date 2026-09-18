import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Formato, Publicacion, UserProfile } from '../types';
import { ArrowLeft, Save, CheckCircle, Bold, Italic, Highlighter, Upload, X, Users, Music, Video } from 'lucide-react';
import { MediaEmulador } from '../components/MediaEmulador';

// ─── Rich Text Editor ────────────────────────────────────────────────────
const ToolbarBtn = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    title={title}
    className="px-2.5 py-1.5 border border-gray-300 rounded hover:bg-gray-100 transition-colors flex items-center gap-1 text-sm"
  >
    {children}
  </button>
);

const RichTextEditor = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (ref.current && !initialized.current) {
      ref.current.innerHTML = value;
      initialized.current = true;
    }
  }, [value]);

  const exec = (cmd: string, val?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, val);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  return (
    <div className="border-2 border-gray-200 focus-within:border-black transition-colors">
      <div className="flex items-center gap-1.5 p-2 border-b border-gray-200 bg-gray-50 flex-wrap">
        <ToolbarBtn onClick={() => exec('bold')} title="Negrita"><Bold className="w-3.5 h-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec('italic')} title="Cursiva"><Italic className="w-3.5 h-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec('underline')} title="Subrayado"><span className="underline text-xs font-bold">S</span></ToolbarBtn>
        <ToolbarBtn onClick={() => exec('hiliteColor', '#FEF08A')} title="Destacar"><Highlighter className="w-3.5 h-3.5 text-yellow-500" /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec('removeFormat')} title="Quitar formato"><span className="text-xs text-gray-500">Limpiar</span></ToolbarBtn>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => { if (ref.current) onChange(ref.current.innerHTML); }}
        className="min-h-[280px] p-4 outline-none font-medium leading-relaxed text-base"
      />
    </div>
  );
};

// ─── Editor principal ─────────────────────────────────────────────────────
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

  // Campos del formulario
  const [titulo, setTitulo] = useState('');
  const [formato, setFormato] = useState<Formato>('texto');
  const [cuerpo, setCuerpo] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [imagenPortada, setImagenPortada] = useState('');
  const [colaboradores, setColaboradores] = useState<string[]>([]);

  // Uploads
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Perfiles para co-autores
  const [todosPerfiles, setTodosPerfiles] = useState<UserProfile[]>([]);

  useEffect(() => {
    supabase.from('perfiles').select('*').eq('estado_cuenta', 'aprobado')
      .then(({ data }) => { if (data) setTodosPerfiles(data as UserProfile[]); });
  }, []);

  // Cargar documento existente
  useEffect(() => {
    if (!isNew && id) {
      supabase.from('publicaciones').select('*').eq('id', id).single()
        .then(({ data, error }) => {
          if (error || !data) { navigate('/dashboard'); return; }
          if (data.estudiante_id !== user?.id && profile?.rol !== 'admin') { navigate('/dashboard'); return; }
          setPub(data as Publicacion);
          setTitulo(data.titulo || '');
          setFormato(data.formato || 'texto');
          setCuerpo(data.cuerpo || '');
          setMediaUrl(data.media_url || '');
          setImagenPortada(data.imagen_portada || '');
          setColaboradores(data.colaboradores || []);
        })
        .catch(() => setSaveError('No se pudo cargar el documento.'))
        .finally(() => setLoadingDoc(false));
    }
  }, [id, isNew]);

  // Subir imagen de portada
  const handleImageUpload = useCallback(async (file: File) => {
    if (!user) return;
    setUploadingImage(true); setSaveError('');
    try {
      const ext = file.name.split('.').pop();
      const path = `portadas/${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('imagenes_publicaciones').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('imagenes_publicaciones').getPublicUrl(path);
      setImagenPortada(data.publicUrl);
    } catch (e: any) {
      setSaveError('Error al subir imagen: ' + (e?.message || ''));
    } finally { setUploadingImage(false); }
  }, [user]);

  // Subir archivo de audio o video
  const handleMediaUpload = useCallback(async (file: File) => {
    if (!user) return;
    setUploadingMedia(true); setSaveError('');
    try {
      const ext = file.name.split('.').pop();
      const bucket = formato === 'video' ? 'videos_publicaciones' : 'audios_publicaciones';
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      setMediaUrl(data.publicUrl);
    } catch (e: any) {
      setSaveError('Error al subir archivo: ' + (e?.message || ''));
    } finally { setUploadingMedia(false); }
  }, [user, formato]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setSaveError('No estás autenticado.'); return; }
    if (!titulo.trim()) { setSaveError('El título es obligatorio.'); return; }
    setSaving(true); setSaveError(''); setSaved(false);

    const payload: any = {
      titulo: titulo.trim(), formato,
      cuerpo: formato === 'texto' ? cuerpo : '',
      media_url: formato !== 'texto' ? mediaUrl : '',
      imagen_portada: imagenPortada,
      colaboradores,
    };

    try {
      if (isNew) {
        const { error } = await supabase.from('publicaciones').insert({ ...payload, estado: 'borrador', estudiante_id: user.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('publicaciones').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id!);
        if (error) throw error;
      }
      setSaved(true);
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (e: any) {
      setSaveError(e?.message || 'Error al guardar.');
    } finally { setSaving(false); }
  };

  if (loadingDoc) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-[#E63946] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const colaboradoresSinYo = todosPerfiles.filter(p => p.id !== user?.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <Link to="/dashboard" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-black mb-8 transition">
        <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Dashboard
      </Link>

      <form onSubmit={onSubmit}>
        <div className="bg-white border border-gray-200 p-6 md:p-10">
          <h1 className="text-3xl font-black tracking-tighter uppercase italic mb-8 border-b-2 border-black pb-4">
            {isNew ? 'Nueva Publicación' : 'Editar Publicación'}
          </h1>

          {/* Historial de observaciones */}
          {pub?.historial_observaciones && pub.historial_observaciones.length > 0 && (
            <div className="mb-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#E63946] mb-3">Historial de Correcciones ({pub.historial_observaciones.length})</p>
              <div className="space-y-2">
                {[...pub.historial_observaciones].reverse().map((obs, i) => (
                  <div key={i} className="p-3 bg-red-50 border-l-4 border-[#E63946]">
                    <div className="flex justify-between items-center mb-0.5 flex-wrap gap-1">
                      <span className="text-xs font-black text-[#E63946] uppercase">{obs.docente_nombre}</span>
                      <span className="text-[10px] text-gray-400">{new Date(obs.fecha).toLocaleString('es-AR')}</span>
                    </div>
                    <p className="text-sm text-gray-800">{obs.comentario}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {saveError && <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 text-sm font-medium">⚠️ {saveError}</div>}
          {saved && <div className="mb-6 p-4 bg-green-50 border border-green-300 text-green-700 text-sm font-medium flex items-center gap-2"><CheckCircle className="w-4 h-4" /> ¡Guardado!</div>}

          <div className="space-y-7">
            {/* Formato */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Formato</label>
              <div className="flex gap-3">
                {(['texto', 'video', 'audio'] as Formato[]).map(f => (
                  <label key={f} className={`flex-1 flex justify-center cursor-pointer border-2 py-3 font-black uppercase tracking-widest text-xs transition-colors ${formato === f ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'border-gray-200 hover:border-black text-gray-400'}`}>
                    <input type="radio" value={f} className="sr-only" checked={formato === f} onChange={() => { setFormato(f); setMediaUrl(''); }} />
                    {f}
                  </label>
                ))}
              </div>
            </div>

            {/* Título */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Título *</label>
              <input value={titulo} onChange={e => setTitulo(e.target.value)} required
                className="w-full border-b-2 border-gray-200 bg-transparent px-0 py-2 text-2xl font-black placeholder-gray-300 outline-none focus:border-black transition-colors"
                placeholder="Titular impactante..." />
            </div>

            {/* Cuerpo (solo para texto) */}
            {formato === 'texto' && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Cuerpo del Artículo</label>
                <p className="text-[10px] text-gray-400 mb-2">Seleccioná texto y usá la barra para aplicar formato</p>
                <RichTextEditor value={cuerpo} onChange={setCuerpo} />
              </div>
            )}

            {/* Media: video o audio */}
            {(formato === 'video' || formato === 'audio') && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
                  {formato === 'video' ? '🎬 Video' : '🎵 Audio'}
                </label>
                <div className="space-y-3">
                  {/* Subir archivo */}
                  <div className="flex gap-3 items-center flex-wrap">
                    <button type="button" onClick={() => mediaInputRef.current?.click()} disabled={uploadingMedia}
                      className="flex items-center gap-2 bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-colors">
                      {formato === 'video' ? <Video className="w-4 h-4" /> : <Music className="w-4 h-4" />}
                      {uploadingMedia ? 'Subiendo...' : 'Subir archivo'}
                    </button>
                    <span className="text-gray-400 text-xs font-bold uppercase">o</span>
                    <input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)}
                      className="flex-1 min-w-[200px] border-b-2 border-gray-200 bg-transparent px-0 py-2 text-sm font-medium placeholder-gray-300 outline-none focus:border-black transition-colors"
                      placeholder={formato === 'video' ? 'https://youtube.com/watch?v=...' : 'https://open.spotify.com/...'} />
                  </div>
                  <input ref={mediaInputRef} type="file"
                    accept={formato === 'video' ? 'video/*' : 'audio/*'}
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleMediaUpload(f); }} />

                  {/* Vista previa */}
                  {mediaUrl && (
                    <div className="border border-gray-200 p-4 bg-gray-50 relative">
                      <button type="button" onClick={() => setMediaUrl('')}
                        className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1 rounded-full z-10">
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Vista previa</p>
                      <MediaEmulador url={mediaUrl} formato={formato} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Imagen de portada */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Imagen de Portada (Opcional)</label>
              <div className="space-y-3">
                <div className="flex gap-3 items-center flex-wrap">
                  <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage}
                    className="flex items-center gap-2 bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-colors">
                    <Upload className="w-4 h-4" />
                    {uploadingImage ? 'Subiendo...' : 'Subir imagen'}
                  </button>
                  <span className="text-gray-400 text-xs font-bold uppercase">o</span>
                  <input value={imagenPortada} onChange={e => setImagenPortada(e.target.value)}
                    className="flex-1 min-w-[200px] border-b-2 border-gray-200 bg-transparent px-0 py-2 text-sm font-medium placeholder-gray-300 outline-none focus:border-black transition-colors"
                    placeholder="Pegar URL..." />
                </div>
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
                {imagenPortada && (
                  <div className="relative w-full h-36 bg-gray-100 overflow-hidden">
                    <img src={imagenPortada} alt="Portada" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setImagenPortada('')}
                      className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1 rounded-full">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Co-autores */}
            {colaboradoresSinYo.length > 0 && (
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
                  <Users className="w-4 h-4" /> Colaboradores
                </label>
                <div className="flex flex-wrap gap-2">
                  {colaboradoresSinYo.map(p => {
                    const sel = colaboradores.includes(p.id);
                    return (
                      <button key={p.id} type="button"
                        onClick={() => setColaboradores(prev => sel ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                        className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border-2 transition-all ${sel ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'border-gray-200 text-gray-600 hover:border-black'}`}>
                        {sel ? '✓ ' : ''}{p.nombre} {p.apellido}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          <Link to="/dashboard" className="border border-gray-300 hover:border-black text-gray-600 hover:text-black px-6 py-3 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Cancelar
          </Link>
          <button type="submit" disabled={saving || saved}
            className="bg-[#E63946] hover:bg-black disabled:bg-gray-400 text-white px-8 py-3 font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-colors">
            {saved ? <><CheckCircle className="w-5 h-5" /> ¡Guardado!</>
              : saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
                : <><Save className="w-5 h-5" /> {isNew ? 'Guardar Borrador' : 'Guardar Cambios'}</>}
          </button>
        </div>
      </form>
    </div>
  );
};
