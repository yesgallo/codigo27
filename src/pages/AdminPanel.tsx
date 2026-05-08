import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Publicacion, OperationType } from '../types';
import { handleFirestoreError } from '../lib/errorHandler';
import { Link, Navigate } from 'react-router-dom';
import { Check, MessageSquare, AlertCircle, Eye, Database, ArrowLeft, UserCheck, UserX, Trash2 } from 'lucide-react';

const SEED_DATA = [
  {
    titulo: "El Renacimiento de los Huertos Urbanos: Cultivando Sostenibilidad",
    cuerpo: "En las grandes metrópolis del mundo, una tendencia está transformando los balcones y azoteas en oasis productivos. Los huertos urbanos no solo ofrecen alimentos frescos, sino que actúan como reguladores térmicos naturales y promueven la biodiversidad en entornos de concreto. Esta práctica ha fortalecido los lazos comunitarios en barrios donde los vecinos comparten semillas y técnicas de cultivo ecológico. Expertos sugieren que esta 'revolución verde' es fundamental para combatir el estrés urbano y fomentar una mayor conciencia sobre la seguridad alimentaria.",
    imagen_portada: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=1000&auto=format&fit=crop",
    autorNombre: "Lucía Méndez"
  },
  {
    titulo: "La Inteligencia Artificial en el Arte: ¿Colaboradora o Competidora?",
    cuerpo: "El auge de las herramientas de generación de imágenes mediante IA ha desatado un debate sin precedentes en la comunidad creativa. Mientras algunos artistas ven en estos algoritmos una extensión de su pincel para explorar horizontes visuales antes imposibles, otros temen por la devaluación del esfuerzo humano y los derechos de autor. Museos internacionales ya han comenzado a curar exposiciones donde la autoría se comparte entre el silicio y el carbono, planteando preguntas profundas sobre qué define realmente a la creatividad en el siglo XXI.",
    imagen_portada: "https://images.unsplash.com/photo-1675271591211-126ad94e495d?q=80&w=1000&auto=format&fit=crop",
    autorNombre: "Julián Estrada"
  },
  {
    titulo: "Turismo de Estrellas: El Auge de los Destinos Starlight",
    cuerpo: "La búsqueda de cielos limpios y libres de contaminación lumínica se ha convertido en el nuevo motor del turismo astronómico. Regiones remotas están recibiendo a viajeros equipados con telescopios que buscan conectar con el cosmos. Este fenómeno ha impulsado a diversos gobiernos a proteger zonas rurales mediante leyes de protección del cielo nocturno, beneficiando tanto a la ciencia como al desarrollo económico local a través de hoteles boutique y guías especializados en mitología estelar.",
    imagen_portada: "https://images.unsplash.com/photo-1506318137071-a8e063b4bcc0?q=80&w=1000&auto=format&fit=crop",
    autorNombre: "Mariana Casal"
  },
  {
    titulo: "El Método 'JOMO': La Alegría de Perderse de Algo",
    cuerpo: "Frente a la ansiedad generada por la hiperconectividad (FOMO), surge el movimiento JOMO (Joy Of Missing Out). Esta filosofía invita a las personas a desconectarse de las redes sociales para reconectar con el presente, la lectura física y el silencio. Psicólogos indican que establecer límites digitales no es un acto de aislamiento, sino de autocuidado esencial. La tendencia está ganando terreno entre jóvenes que deciden apagar sus notificaciones para disfrutar de cenas sin pantallas y caminatas conscientes.",
    imagen_portada: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop",
    autorNombre: "Roberto Varela"
  },
  {
    titulo: "Avances en la Energía de Fusión: El Sol en la Tierra",
    cuerpo: "Científicos han alcanzado hitos históricos en la contención de plasma para generar energía mediante fusión nuclear, una fuente limpia y virtualmente ilimitada. A diferencia de la fisión actual, este proceso no produce residuos radioactivos de larga duración. Aunque todavía faltan décadas para su implementación comercial, los recientes éxitos en laboratorios de alta tecnología brindan una esperanza tangible para resolver la crisis energética global y alcanzar los objetivos de emisiones netas cero antes de lo previsto.",
    imagen_portada: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop",
    autorNombre: "Elena Torres"
  }
];

export const AdminPanel = () => {
  const { user, profile } = useAuth();
  const [publicaciones, setPublicaciones] = useState<(Publicacion & { autorNombre?: string })[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [comentarioActivo, setComentarioActivo] = useState<{ id: string, texto: string } | null>(null);

  useEffect(() => {
    if (!user || profile?.rol !== 'admin') return;

    const q = query(collection(db, 'publicaciones'));
    const unsubscribePubs = onSnapshot(q, async (snapshot) => {
      try {
        const posts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Publicacion));
        posts.sort((a,b) => b.created_at - a.created_at);

        const userIds = [...new Set(posts.map(p => p.estudiante_id))];
        const authorMap: Record<string, string> = {};
        for(const uId of userIds) {
          const uDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', uId)));
          if(!uDoc.empty) {
            authorMap[uId] = uDoc.docs[0].data().nombre + ' ' + uDoc.docs[0].data().apellido;
          }
        }

        setPublicaciones(posts.map(p => ({
          ...p,
          autorNombre: p.autorNombre_demo || authorMap[p.estudiante_id] || 'Autor Anónimo',
        })));
        setLoading(false);
      } catch (e) {
        setLoading(false);
        handleFirestoreError(e, OperationType.LIST, 'publicaciones');
      }
    });

    const qUsers = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(qUsers, (snap) => {
       setUsuarios(snap.docs.map(d => ({id: d.id, ...d.data()})));
    });

    return () => {
      unsubscribePubs();
      unsubscribeUsers();
    };
  }, [user, profile]);

  if (profile && profile.rol !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  if (loading) return <div className="p-8 text-center">Cargando panel...</div>;

  const pendientes = publicaciones.filter(p => p.estado === 'borrador');
  const publicados = publicaciones.filter(p => p.estado === 'publicado');
  const observados = publicaciones.filter(p => p.estado === 'observado');
  
  const usuariosPendientes = usuarios.filter(u => u.estado_cuenta === 'pendiente');

  const handleUpdateUserStatus = async (userId: string, nuevoEstado: 'aprobado' | 'rechazado') => {
    try {
      await updateDoc(doc(db, 'users', userId), { estado_cuenta: nuevoEstado });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleUpdateEstado = async (id: string, nuevoEstado: 'publicado' | 'observado' | 'borrador', comentario?: string) => {
    try {
      const updateData: any = { 
        estado: nuevoEstado 
      };
      
      if (nuevoEstado === 'publicado') {
        updateData.fecha_publicacion = Date.now();
      }
      
      if (comentario !== undefined) {
        updateData.comentario_docente = comentario;
      }

      const docRef = doc(db, 'publicaciones', id);
      await updateDoc(docRef, updateData);
      
      if (comentarioActivo?.id === id) {
        setComentarioActivo(null);
      }
    } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `publicaciones/${id}`);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta publicación permanentemente?')) {
      try {
        await deleteDoc(doc(db, 'publicaciones', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `publicaciones/${id}`);
      }
    }
  };

  const handleSeedData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      for (const item of SEED_DATA) {
        const docId = crypto.randomUUID();
        const docRef = doc(db, 'publicaciones', docId);
        await setDoc(docRef, {
          titulo: item.titulo,
          cuerpo: item.cuerpo,
          imagen_portada: item.imagen_portada,
          formato: 'texto',
          estado: 'borrador',
          estudiante_id: user.uid,
          autorNombre_demo: item.autorNombre,
          created_at: Date.now()
        });
        await updateDoc(docRef, {
          estado: 'publicado',
          fecha_publicacion: Date.now()
        });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'publicaciones');
    } finally {
      setLoading(false);
    }
  };

  const renderFila = (pub: Publicacion & { autorNombre?: string }) => (
    <div key={pub.id} className="bg-white border text-gray-800 border-gray-200 rounded-lg p-5 mb-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between md:items-center">
      <div>
        <div className="flex items-center gap-2 mb-2">
           <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{pub.formato}</span>
           <span className="text-sm font-medium text-gray-900">{pub.autorNombre}</span>
        </div>
        <h3 className="font-bold text-lg mb-1">{pub.titulo}</h3>
        <Link to={`/publicacion/${pub.id}`} className="text-sm text-red-600 hover:underline flex items-center gap-1">
          <Eye className="w-4 h-4"/> Ver Previsualización
        </Link>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {pub.estado !== 'publicado' && (
           <button 
             onClick={() => handleUpdateEstado(pub.id, 'publicado')}
             className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition flex items-center gap-1"
           >
             <Check className="w-4 h-4"/> Aprobar
           </button>
        )}
        
        {pub.estado !== 'observado' && (
          <button 
             onClick={() => setComentarioActivo(comentarioActivo?.id === pub.id ? null : { id: pub.id, texto: pub.comentario_docente || '' })}
             className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition flex items-center gap-1"
           >
             <AlertCircle className="w-4 h-4"/> Observar
           </button>
        )}
        <button 
           onClick={() => handleDeletePost(pub.id)}
           className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition ml-2 flex items-center gap-1"
         >
           <Trash2 className="w-4 h-4"/> Eliminar
         </button>
      </div>

      {comentarioActivo?.id === pub.id && (
         <div className="w-full mt-4 bg-amber-50 p-4 rounded-md border border-amber-200">
            <label className="block text-sm font-semibold text-amber-900 mb-2">Comentario de Revisión:</label>
            <textarea 
               value={comentarioActivo.texto}
               onChange={(e) => setComentarioActivo({ ...comentarioActivo, texto: e.target.value })}
               className="w-full rounded border border-amber-300 p-2 mb-3 bg-white outline-none"
               rows={3}
            />
            <button 
              onClick={() => handleUpdateEstado(pub.id, 'observado', comentarioActivo.texto)}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded font-medium text-sm transition"
            >
              Enviar Observación
            </button>
         </div>
      )}
    </div>
  );

  const topPublicaciones = [...publicados].sort((a,b) => (b.total_reacciones || 0) - (a.total_reacciones || 0)).slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
      <Link to="/" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-[#E63946] hover:text-black mb-8 transition">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver al Inicio
      </Link>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 pb-6 border-b-2 border-black gap-4">
        <h1 className="text-4xl font-black tracking-tighter uppercase italic text-[#1A1A1A]">Panel de Edición (Admin)</h1>
        
        {publicaciones.length === 0 && (
          <button 
            onClick={handleSeedData}
            className="flex items-center gap-2 bg-black hover:bg-gray-900 text-white px-5 py-2.5 font-bold uppercase tracking-widest text-xs transition-colors"
          >
            <Database className="w-4 h-4" />
            Cargar Notas Demo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="md:col-span-2 space-y-10">
            
            {usuariosPendientes.length > 0 && (
              <section className="bg-red-50 p-6 border border-red-200">
                <h2 className="text-xl font-bold text-[#E63946] mb-4 flex items-center gap-2">
                  Periodistas Pendientes <span className="bg-[#E63946] text-white text-xs py-0.5 px-2 font-black">{usuariosPendientes.length}</span>
                </h2>
                <div className="space-y-3">
                  {usuariosPendientes.map(u => (
                    <div key={u.id} className="bg-white p-4 border border-red-100 flex items-center justify-between">
                       <div>
                          <p className="font-bold text-gray-900 leading-tight">{u.nombre} {u.apellido}</p>
                          <p className="text-xs text-gray-500">{u.instagram_handle ? `@${u.instagram_handle}` : 'Sin handle'}</p>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => handleUpdateUserStatus(u.id, 'aprobado')} className="text-green-600 hover:bg-green-50 p-2 rounded" title="Aprobar">
                            <UserCheck className="w-5 h-5"/>
                          </button>
                          <button onClick={() => handleUpdateUserStatus(u.id, 'rechazado')} className="text-red-600 hover:bg-red-50 p-2 rounded" title="Rechazar">
                            <UserX className="w-5 h-5"/>
                          </button>
                       </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                Pendientes de Revisión <span className="bg-red-100 text-red-800 text-sm py-0.5 px-2 rounded-full">{pendientes.length}</span>
              </h2>
              {pendientes.length === 0 ? (
                <p className="text-gray-500 bg-white border border-gray-200 rounded-lg p-6 text-center">No hay borradores pendientes.</p>
              ) : pendientes.map(renderFila)}
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                Observados (Esperando edición) <span className="bg-amber-100 text-amber-800 text-sm py-0.5 px-2 rounded-full">{observados.length}</span>
              </h2>
              {observados.length === 0 ? (
                <p className="text-gray-500 bg-white border border-gray-200 rounded-lg p-6 text-center">No hay publicaciones observadas.</p>
              ) : observados.map(renderFila)}
            </section>
            
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                Publicados <span className="bg-green-100 text-green-800 text-sm py-0.5 px-2 rounded-full">{publicados.length}</span>
              </h2>
              {publicados.map(renderFila)}
            </section>

         </div>

         <div>
           <div className="bg-gray-900 text-white rounded-xl p-6 sticky top-24">
              <h3 className="text-lg font-bold mb-4">Métricas Globales</h3>
              <div className="space-y-4">
                 <div>
                   <p className="text-gray-400 text-sm">Total Producciones</p>
                   <p className="text-3xl font-bold">{publicaciones.length}</p>
                 </div>
                 <div className="pt-4 border-t border-gray-800">
                    <p className="text-gray-400 text-sm mb-2">Por Formato</p>
                    <div className="flex justify-between items-center text-sm">
                      <span>Texto</span>
                      <span className="font-bold">{publicaciones.filter(p => p.formato === 'texto').length}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span>Video</span>
                      <span className="font-bold">{publicaciones.filter(p => p.formato === 'video').length}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span>Audio</span>
                      <span className="font-bold">{publicaciones.filter(p => p.formato === 'audio').length}</span>
                    </div>
                 </div>

                 <div className="pt-4 border-t border-gray-800">
                    <p className="text-gray-400 text-sm mb-3">Producciones más populares</p>
                    {topPublicaciones.length === 0 ? (
                      <p className="text-xs text-gray-600">Aún no hay suficientes datos.</p>
                    ) : (
                      <div className="space-y-3">
                        {topPublicaciones.map(t => (
                          <div key={t.id} className="flex flex-col gap-1">
                            <Link to={`/publicacion/${t.id}`} className="text-xs hover:text-[#E63946] transition-colors leading-snug line-clamp-2">
                              {t.titulo}
                            </Link>
                            <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 flex items-center gap-1">
                               💡 {t.total_reacciones || 0} reacciones
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
              </div>
           </div>
         </div>
      </div>
    </div>
  );
};
