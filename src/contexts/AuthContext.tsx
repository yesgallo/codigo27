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
  user: null,
  session: null,
  profile: null,
  loading: true,
});

// Limpia tokens viejos/rotos de Supabase del localStorage
const clearStaleAuth = () => {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) localStorage.removeItem(key);
    });
  } catch (_) {}
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrCreateProfile = async (supabaseUser: User) => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (data) {
        const p = data as UserProfile;
        if (supabaseUser.email === 'yesicalp@gmail.com') {
          p.rol = 'admin';
          p.estado_cuenta = 'aprobado';
        }
        setProfile(p);
        return;
      }

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

        const { data: created, error: createError } = await supabase
          .from('perfiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
        } else if (created) {
          setProfile(created as UserProfile);
        }
        return;
      }

      console.error('Error fetching profile:', error);
      if (supabaseUser.email === 'yesicalp@gmail.com') {
        setProfile({
          id: supabaseUser.id,
          nombre: 'Yesica',
          apellido: 'LP',
          rol: 'admin',
          estado_cuenta: 'aprobado'
        });
      }
    } catch (err) {
      console.error('Unexpected error in fetchOrCreateProfile:', err);
    }
  };

  useEffect(() => {
    let settled = false;

    const finishLoading = () => {
      if (!settled) {
        settled = true;
        setLoading(false);
      }
    };

    // Timeout de seguridad: si getSession() no responde en 6 segundos,
    // limpiamos el storage y liberamos la app.
    const timeout = setTimeout(() => {
      if (!settled) {
        console.warn('Auth timeout: limpiando sesión vieja y continuando.');
        clearStaleAuth();
        setSession(null);
        setUser(null);
        setProfile(null);
        finishLoading();
      }
    }, 6000);

    supabase.auth.getSession()
      .then(({ data: { session: s } }) => {
        clearTimeout(timeout);
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          fetchOrCreateProfile(s.user).finally(finishLoading);
        } else {
          finishLoading();
        }
      })
      .catch((err) => {
        clearTimeout(timeout);
        console.error('Error al obtener sesión, limpiando auth:', err);
        clearStaleAuth();
        setSession(null);
        setUser(null);
        setProfile(null);
        finishLoading();
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        clearTimeout(timeout);
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await fetchOrCreateProfile(s.user);
        } else {
          setProfile(null);
        }
        finishLoading();
      }
    );

    return () => {
      clearTimeout(timeout);
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
