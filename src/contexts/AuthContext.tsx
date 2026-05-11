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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrCreateProfile = async (supabaseUser: User) => {
    try {
      // Try to fetch existing profile
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

      // Profile not found (trigger may have failed) — create it from frontend
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
      // Fallback for admin if DB fails
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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchOrCreateProfile(s.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await fetchOrCreateProfile(s.user);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
