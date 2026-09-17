import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Formato, Publicacion, UserProfile } from '../types';
import { ArrowLeft, Save, CheckCircle, Bold, Italic, Highlighter, Upload, X, Users } from 'lucide-react';
import { MediaEmulador } from '../components/MediaEmulador';

// ─── Barra de formato simple sobre contenteditable ───────────────────────
const ToolbarButton = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    title={title}
    className="px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-100 text-sm font-bold transition-colors"
  >
    {children}
  </button>
);

const RichTextEditor = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const initialSet = useRef(false);

  useEffect(() => {
    if (editorRef.current && !initialSet.current) {
      editorRef.current.innerHTML = value;
      initialSet.current = true;
    }
  }, [value]);

  const execCmd = (cmd: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  return (
    <div className="border-2 border-gray-200 focus-within:border-black transition-colors">
      <div className="flex items-center gap-2 p-2 border-b border-gray-200 bg-gray-50 flex-wrap">
        <ToolbarButton onClick={() => execCmd('bold')} title="Negrita">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCmd('italic')} title="Cursiva">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCmd('underline')} title="Subrayado">
          <span className="underline text-sm">S</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => execCmd('hiliteColor', '#FEF08A')} title="Destacar texto">
          <Highlighter className="w-4 h-4 text-yellow-500" />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCmd('hiliteColor', 'transparent')} title="Quitar destacado">
          <span className="text-xs font-normal text-gray-500">Limpiar</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => execCmd('removeFormat')} title="Quitar todo el formato">
          <span className="text-xs font-normal">Sin formato</span>
        </ToolbarButton>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => { if (editorRef.current) onChange(editorRef.current.innerHTML); }}
        className="min-h-[300px] p-4 outline-none font-medium leading-relaxed text-lg"
        placeholder="Escribí tu artículo aquí..."
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

  const [titulo, setTitulo] = useState('');
  const [formato, setFormato] = useState<Formato>('texto');
  const [cuerpo, setCuerpo] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [imagenPortada, setImagenPortada] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [todosPerfiles, setTodosPerfiles] = useState<UserProfile[]>([]);
  const [colaboradores, setColaboradores] = useState<string[]>([]);

  useEffect(() => {
    const fetchPerfiles = async () => {
      const { data } = await supabase.from('perfiles').select('*').eq('estado_cuenta', 'aprobado');
      if (data) setTodosPerfiles(data as UserProfile[]);
    };
    fetchPerfiles();
  }, []);

  useEffect(() => {
    if (!isNew && id) {
      const fetchDoc = async () => {
        try {
          const { data, error } = await supabase.from('publicaciones').select('*').eq('id', id).single();
          if (error || !data) { navigate('/dashboard'); return; }
          if (data.estudiante_id !== user?.id && profile?.rol !== 'admin') { navigate('/dashboard'); return; }

          setPub(data as Publicacion);
          setTitulo(data.titulo || '');
          setFormato(data.formato || 'texto');
          setCuerpo(data.cuerpo || '');
          setMediaUrl(data.media_url || '');
          setImagenPortada(data.imagen_portada || '');
          setColaboradores(data.colaboradores || []);
        } catch (e: any) {
          setSaveError('No se pudo cargar el documento.');
        } finally {
          setLoadingDoc(false);
        }
      };
      fetchDoc();
    }
  }, [id, isNew, navigate, user, profile]);

  const handleImageUpload = async (file: File) => {
    if (!user) return;
    setUploadingImage(true);
    setSaveError('');
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('imagenes_publicaciones').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('imagenes_publicaciones').getPublicUrl(path);
      setImagenPortada(urlData.publicUrl);
    } catch (e: any) {
      setSaveError('Error al subir imagen: ' + (e?.message || ''));
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setSaveError('No estás autenticado.'); return; }
    if (!titulo.trim()) { setSaveError('El título es obligatorio.'); return; }

    setSaving(true); setSaveError(''); setSaved(false);

    const payload: any = {
      titulo: titulo.trim(),
      formato,
      cuerpo: formato === 'texto' ? cuerpo : '',
      media_url: (formato === 'video' || formato === 'audio') ? mediaUrl : '',
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
      setSaveError(e?.message || 'Error al guardar. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
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

      <form onSubmit={onSubmit} className="space-y-8">
        <div className="bg-white border border-gray-200 p-6 md:p-10">
          <h1 className="text-3xl font-black tracking-tighter uppercase italic mb-8 border-b-2 border-black pb-4 text-[#1A1A1A]">
            {isNew ? 'Nueva Publicación' : 'Editar Publicación'}
          </h1>

          {/* Historial de observaciones */}
          {pub?.historial_observaciones && pub.historial_observaciones.length > 0 && (
            <div className="mb-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#E63946] mb-3">Historial de Correcciones</p>
              <div className="space-y-3">
                {[...pub.historial_observaciones].reverse().map((obs, i) => (
                  <div key={i} className="p-4 bg-red-50 border-l-4 border-[#E63946]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-black text-[#E63946] uppercase">{obs.docente_nombre}</span>
                      <span className="text-[10px] text-gray-400">{new Date(obs.fecha).toLocaleString('es-AR')}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800">{obs.comentario}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {saveError && <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 text-sm font-medium">⚠️ {saveError}</div>}
          {saved && (
            <div className="mb-6 p-4 bg-green-50 border border-green-300 text-green-700 text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> ¡Guardado! Volviendo al dashboard...
            </div>
          )}

          <div className="space-y-8">
            {/* Formato */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Formato</label>
              <div className="flex gap-4">
                {(['texto', 'video', 'audio'] as Formato[]).map((f) => (
                  <label key={f} className={`flex-1 flex text-center justify-center cursor-pointer border-2 py-4 font-black uppercase tracking-widest text-xs transition-colors ${formato === f ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'border-gray-200 hover:border-black text-gray-400'}`}>
                    <input type="radio" value={f} className="sr-only" checked={formato === f} onChange={() => setFormato(f)} />
                    {f}
                  </label>
                ))}
              </div>
            </div>

            {/* Título */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Título *</label>
              <input
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                required
                className="w-full border-b-2 border-gray-200 bg-transparent px-0 py-3 text-2xl font-black tracking-tight placeholder-gray-300 outline-none focus:border-black transition-colors"
                placeholder="Titular impactante..."
              />
            </div>

            {/* Cuerpo con editor rico */}
            {formato === 'texto' && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Cuerpo del Artículo</label>
                <p className="text-[10px] text-gray-400 mb-3">Seleccioná texto para aplicar negrita, cursiva o destacado</p>
                <RichTextEditor value={cuerpo} onChange={setCuerpo} />
              </div>
            )}

            {/* URL de video/audio */}
            {(formato === 'video' || formato === 'audio') && (
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
                  URL del Medio ({formato === 'video' ? 'YouTube' : 'Spotify'})
                </label>
                <input
                  value={mediaUrl}
                  onChange={e => setMediaUrl(e.target.value)}
                  className="w-full border-b-2 border-gray-200 bg-transparent px-0 py-3 text-lg font-medium placeholder-gray-300 outline-none focus:border-black transition-colors mb-6"
                  placeholder={`https://${formato === 'video' ? 'youtube.com/watch?v=...' : 'open.spotify.com/...'}`}
                />
                {mediaUrl && (
                  <div className="p-6 bg-gray-50 border border-gray-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Previsualización</p>
                    <MediaEmulador url={mediaUrl} formato={formato} />
                  </div>
                )}
              </div>
            )}

            {/* Imagen de portada */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Imagen de Portada (Opcional)</label>
              <div className="space-y-3">
                <div className="flex gap-3 items-center flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="flex items-center gap-2 bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    {uploadingImage ? 'Subiendo...' : 'Subir archivo'}
                  </button>
                  <span className="text-gray-400 text-xs font-bold uppercase">o</span>
                  <input
                    value={imagenPortada}
                    onChange={e => setImagenPortada(e.target.value)}
                    className="flex-1 min-w-[200px] border-b-2 border-gray-200 bg-transparent px-0 py-2 text-sm font-medium placeholder-gray-300 outline-none focus:border-black transition-colors"
                    placeholder="Pegar URL de imagen..."
                  />
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const file = e.target.files?.[0]; if (file) handleImageUpload(file); }} />
                {imagenPortada && (
                  <div className="relative w-full h-40 bg-gray-100 overflow-hidden">
                    <img src={imagenPortada} alt="Portada" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setImagenPortada('')}
                      className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1 rounded-full transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Co-autores */}
            {colaboradoresSinYo.length > 0 && (
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
                  <Users className="w-4 h-4" /> Colaboradores (Co-autores)
                </label>
                <div className="flex flex-wrap gap-2">
                  {colaboradoresSinYo.map(p => {
                    const sel = colaboradores.includes(p.id);
                    return (
                      <button key={p.id} type="button"
                        onClick={() => setColaboradores(prev => sel ? prev.filter(id => id !== p.id) : [...prev, p.id])}
                        className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 transition-all ${sel ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' : 'border-gray-200 text-gray-600 hover:border-black'}`}>
                        {sel ? '✓ ' : ''}{p.nombre} {p.apellido}
                      </button>
                    );
                  })}
                </div>
                {colaboradores.length > 0 && (
                  <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest font-bold">
                    {colaboradores.length} colaborador{colaboradores.length > 1 ? 'es' : ''} seleccionado{colaboradores.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center gap-4 mt-8">
          <Link to="/dashboard" className="border border-gray-300 hover:border-black text-gray-600 hover:text-black px-6 py-4 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Cancelar
          </Link>
          <button type="submit" disabled={saving || saved}
            className="bg-[#E63946] hover:bg-black disabled:bg-gray-400 text-white px-8 py-4 font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-colors">
            {saved ? <><CheckCircle className="w-5 h-5" /> ¡Guardado!</>
              : saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
                : <><Save className="w-5 h-5" /> {isNew ? 'Guardar Borrador' : 'Guardar Cambios'}</>}
          </button>
        </div>
      </form>
    </div>
  );
};
