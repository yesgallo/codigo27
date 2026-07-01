import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, profile: null, loading: true,
});

const clearStaleAuth = () => {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) localStorage.removeItem(key);
    });
  } catch (_) {}
};

// Ejecuta una promesa con timeout; si se pasa del tiempo, resuelve con null
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race([
    promise,
    new Promise<null>(resolve => setTimeout(() => resolve(null), ms)),
  ]);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrCreateProfile = async (supabaseUser: User): Promise<void> => {
    try {
      const result = await withTimeout(
        supabase.from('perfiles').select('*').eq('id', supabaseUser.id).single(),
        5000
      );

      if (!result) {
        // Timeout: armamos un perfil mínimo para no bloquear la UI
        console.warn('fetchProfile timeout — usando perfil mínimo');
        const isAdmin = supabaseUser.email === 'yesicalp@gmail.com';
        setProfile({
          id: supabaseUser.id,
          nombre: supabaseUser.user_metadata?.nombre || supabaseUser.email?.split('@')[0] || 'Usuario',
          apellido: supabaseUser.user_metadata?.apellido || '-',
          rol: isAdmin ? 'admin' : 'staff',
          estado_cuenta: isAdmin ? 'aprobado' : 'pendiente',
        });
        return;
      }

      const { data, error } = result;

      if (data) {
        const p = data as UserProfile;
        if (supabaseUser.email === 'yesicalp@gmail.com') {
          p.rol = 'admin';
          p.estado_cuenta = 'aprobado';
        }
        setProfile(p);
        return;
      }

      // Perfil no existe (PGRST116 = not found) → crear uno nuevo
      if (error?.code === 'PGRST116') {
        const isAdmin = supabaseUser.email === 'yesicalp@gmail.com';
        const meta = supabaseUser.user_metadata || {};
        const emailPrefix = supabaseUser.email?.split('@')[0] || 'Usuario';

        const newProfile = {
          id: supabaseUser.id,
          nombre: meta.nombre || emailPrefix,
          apellido: meta.apellido || '-',
          rol: isAdmin ? 'admin' : 'staff',
          estado_cuenta: isAdmin ? 'aprobado' : 'pendiente',
        };

        // También con timeout para que el INSERT no bloquee
        const insertResult = await withTimeout(
          supabase.from('perfiles').insert(newProfile).select().single(),
          5000
        );

        if (insertResult?.data) {
          setProfile(insertResult.data as UserProfile);
        } else {
          // INSERT falló o timeout — usamos el objeto local igual
          setProfile(newProfile as UserProfile);
        }
        return;
      }

      // Otro error de Supabase
      console.error('Error fetching profile:', error);
      setProfile(null);
    } catch (err) {
      console.error('fetchOrCreateProfile exception:', err);
      setProfile(null);
    }
  };

  useEffect(() => {
    // Timeout absoluto: loading SIEMPRE se libera en 8 segundos como máximo
    let done = false;
    const finish = () => {
      if (!done) { done = true; setLoading(false); }
    };

    const absoluteTimeout = setTimeout(() => {
      if (!done) {
        console.warn('Auth absolute timeout — liberando loading');
        clearStaleAuth();
        finish();
      }
    }, 8000);

    // Carga inicial de sesión
    supabase.auth.getSession()
      .then(async ({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await fetchOrCreateProfile(s.user); // ya tiene timeout interno
        }
        clearTimeout(absoluteTimeout);
        finish();
      })
      .catch(err => {
        console.error('getSession error:', err);
        clearStaleAuth();
        clearTimeout(absoluteTimeout);
        setSession(null);
        setUser(null);
        setProfile(null);
        finish();
      });

    // Escucha cambios de sesión (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await fetchOrCreateProfile(s.user);
        } else {
          setProfile(null);
        }
        clearTimeout(absoluteTimeout);
        finish();
      }
    );

    return () => {
      clearTimeout(absoluteTimeout);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
