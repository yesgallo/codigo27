import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Auth helpers ---

export const loginWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const registerWithEmail = async (
  email: string,
  password: string,
  nombre: string,
  apellido: string
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre, apellido },
    },
  });
  if (error) throw error;
  return data;
};

// Limpia tokens de Supabase del localStorage
const clearSupabaseAuth = () => {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) localStorage.removeItem(key);
    });
  } catch (_) {}
};

export const logout = async () => {
  // Primero limpiamos el storage local para que la UI responda de inmediato
  clearSupabaseAuth();
  try {
    // scope: 'local' solo limpia la sesión localmente sin requerir red
    await supabase.auth.signOut({ scope: 'local' });
  } catch (err) {
    console.error('Logout error (sesión limpiada localmente):', err);
  }
};
