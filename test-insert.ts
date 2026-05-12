import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('Logging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'yesicalp@gmail.com',
    password: '123456'
  });

  if (authError) {
    console.error('Login failed:', authError);
    return;
  }

  console.log('Logged in as:', authData.user?.id);

  console.log('Attempting insert...');
  const { data, error } = await supabase.from('publicaciones').insert({
    titulo: 'Test Post from Script',
    formato: 'texto',
    cuerpo: 'Test body',
    media_url: '',
    imagen_portada: '',
    estado: 'borrador',
    estudiante_id: authData.user?.id
  });

  if (error) {
    console.error('INSERT ERROR:');
    console.error(JSON.stringify(error, null, 2));
  } else {
    console.log('INSERT SUCCESS:', data);
  }
}

testInsert();
