import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { TipoReaccion } from '../types';
import { cn } from '../lib/utils';

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

  const fetchCounts = async () => {
    const { data, error } = await supabase
      .from('reacciones')
      .select('tipo')
      .eq('publicacion_id', publicacionId);

    if (error) {
      console.error(error);
      return;
    }

    const newCounts: Record<TipoReaccion, number> = { interesa: 0, enoja: 0, alegra: 0, entristece: 0, piensa: 0 };
    (data || []).forEach((r: any) => {
      const tipo = r.tipo as TipoReaccion;
      if (newCounts[tipo] !== undefined) {
        newCounts[tipo]++;
      }
    });
    setCounts(newCounts);
  };

  React.useEffect(() => {
    fetchCounts();

    // Realtime subscription for reactions
    const channel = supabase
      .channel(`reacciones_${publicacionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reacciones', filter: `publicacion_id=eq.${publicacionId}` },
        () => fetchCounts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [publicacionId]);

  const handleVote = async (tipo: TipoReaccion) => {
    // Only 1 pseudo-vote per session
    if (votedType && votedType === tipo) return;
    
    setVotedType(tipo);

    try {
      const { error: insertError } = await supabase
        .from('reacciones')
        .insert({ publicacion_id: publicacionId, tipo });

      if (insertError) throw insertError;

      // Increment counter via RPC
      await supabase.rpc('incrementar_reaccion', { pub_id: publicacionId });
    } catch (e) {
      console.error('Error adding reaction:', e);
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
