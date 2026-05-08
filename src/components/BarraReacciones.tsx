import React, { useState } from 'react';
import { doc, collection, setDoc, query, onSnapshot, increment, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TipoReaccion, OperationType } from '../types';
import { handleFirestoreError } from '../lib/errorHandler';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const REACCIONES: { tipo: TipoReaccion; emoji: string; label: string }[] = [
  { tipo: 'interesa', emoji: '💡', label: 'Me interesa' },
  { tipo: 'enoja', emoji: '😡', label: 'Me enoja' },
  { tipo: 'alegra', emoji: '😄', label: 'Me alegra' },
  { tipo: 'entristece', emoji: '😢', label: 'Me entristece' },
  { tipo: 'piensa', emoji: '🤔', label: 'Me hace pensar' },
];

export const BarraReacciones: React.FC<{ publicacionId: string }> = ({ publicacionId }) => {
  const [counts, setCounts] = useState<Record<TipoReaccion, number>>({
    interesa: 0, enoja: 0, alegra: 0, entristece: 0, piensa: 0,
  });
  const [votedType, setVotedType] = useState<TipoReaccion | null>(null);

  React.useEffect(() => {
    // Escucha real time reactions para agregar la cuenta. (For simple app, just count total client-side, limit is 100 on snapshots maybe, but for this scale it's ok. Actually we should use aggregations or counter).
    // Using simple snapshot for this MVP scope. In prod, use an aggregated field via Edge Function or sum.
    const q = query(collection(db, 'publicaciones', publicacionId, 'reacciones'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newCounts = { interesa: 0, enoja: 0, alegra: 0, entristece: 0, piensa: 0 };
      snapshot.docs.forEach(d => {
        const tipo = d.data().tipo as TipoReaccion;
        if (newCounts[tipo] !== undefined) {
          newCounts[tipo]++;
        }
      });
      setCounts(newCounts);
    }, (error) => {
      // In case they read unauth without proper rules, but read is public so it's fine.
      console.error(error);
    });

    return () => unsubscribe();
  }, [publicacionId]);

  const handleVote = async (tipo: TipoReaccion) => {
    // Only 1 pseudo-vote per session
    if (votedType && votedType === tipo) return;
    
    setVotedType(tipo);

    try {
      const newRef = doc(collection(db, 'publicaciones', publicacionId, 'reacciones'));
      await setDoc(newRef, {
        tipo,
        created_at: Date.now()
      });
      await updateDoc(doc(db, 'publicaciones', publicacionId), {
        total_reacciones: increment(1)
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `publicaciones/${publicacionId}/reacciones`);
      setVotedType(null); // Revert
    }
  };

  return (
    <div className="flex flex-wrap gap-2 py-4 border-t border-gray-100">
      {REACCIONES.map(r => (
        <button
          key={r.tipo}
          onClick={() => handleVote(r.tipo)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-sm font-medium transition hover:bg-gray-50 shadow-sm",
            votedType === r.tipo && "border-red-600 bg-red-50 text-red-700"
          )}
        >
          <span className="text-lg leading-none">{r.emoji}</span>
          <span>{counts[r.tipo] || 0}</span>
        </button>
      ))}
    </div>
  );
};
