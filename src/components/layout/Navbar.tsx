import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { loginWithEmail, registerWithEmail, logout } from '../../lib/supabase';
import { LogIn, LogOut, Sun, Cloud, CloudRain, CloudLightning, CloudSnow, CloudFog, X } from 'lucide-react';

const WeatherWidget = () => {
  const [temp, setTemp] = useState<number | null>(null);
  const [code, setCode] = useState<number>(0);

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=-36.2333&longitude=-61.1167&current_weather=true')
      .then(res => res.json())
      .then(data => {
        if(data?.current_weather) {
          setTemp(Math.round(data.current_weather.temperature));
          setCode(data.current_weather.weathercode);
        }
      })
      .catch(console.error);
  }, []);

  if (temp === null) return null;

  const getWeatherIcon = () => {
    if (code === 0) return <Sun className="w-4 h-4 text-yellow-500" />;
    if ([1, 2, 3].includes(code)) return <Cloud className="w-4 h-4 text-gray-300" />;
    if ([45, 48].includes(code)) return <CloudFog className="w-4 h-4 text-gray-400" />;
    if ([51, 53, 55, 56, 57].includes(code)) return <CloudRain className="w-4 h-4 text-blue-300" />;
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return <CloudRain className="w-4 h-4 text-blue-400" />;
    if ([71, 73, 75, 77, 85, 86].includes(code)) return <CloudSnow className="w-4 h-4 text-white" />;
    if ([95, 96, 99].includes(code)) return <CloudLightning className="w-4 h-4 text-yellow-500" />;
    return <Sun className="w-4 h-4 text-yellow-500" />;
  };

  return (
    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white" title="Clima en Bolívar, Buenos Aires">
      <span className="text-[10px] text-gray-400">Bolívar</span>
      {getWeatherIcon()}
      <span>{temp}°C</span>
    </div>
  );
};

// --- Login Modal ---
const LoginModal = ({ onClose }: { onClose: () => void }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      onClose();
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('email not confirmed') || msg.toLowerCase().includes('confirmation')) {
        setError('Debés confirmar tu email antes de ingresar. Revisá tu bandeja de entrada, o pedile al admin que desactive la confirmación en el panel de Supabase.');
      } else if (msg.toLowerCase().includes('invalid login') || msg.toLowerCase().includes('invalid credentials')) {
        setError('Email o contraseña incorrectos.');
      } else {
        setError(msg || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await registerWithEmail(email, password, nombre, apellido);
      setSuccess('¡Cuenta creada! Si ves un email de confirmación, confirmalo. Si no, podés intentar iniciar sesión directamente.');
      setIsRegistering(false);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered')) {
        setError('Este email ya está registrado. Intentá iniciar sesión.');
      } else {
        setError(msg || 'Error al registrarse');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-black text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black uppercase italic tracking-tight">
              {isRegistering ? 'Registro Staff' : 'Acceso Staff'}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {isRegistering ? 'Crea tu cuenta de periodista' : 'Ingresa con tu cuenta'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 text-sm rounded font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 text-sm rounded font-medium">
              {success}
            </div>
          )}

          {isRegistering && (
            <>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                  className="w-full border-2 border-gray-200 px-4 py-3 outline-none focus:border-black transition-colors font-medium"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Apellido</label>
                <input
                  type="text"
                  value={apellido}
                  onChange={e => setApellido(e.target.value)}
                  required
                  className="w-full border-2 border-gray-200 px-4 py-3 outline-none focus:border-black transition-colors font-medium"
                  placeholder="Tu apellido"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border-2 border-gray-200 px-4 py-3 outline-none focus:border-black transition-colors font-medium"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border-2 border-gray-200 px-4 py-3 outline-none focus:border-black transition-colors font-medium"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E63946] hover:bg-red-700 disabled:bg-gray-300 text-white py-3 font-black text-xs uppercase tracking-widest transition-colors"
          >
            {loading ? 'Procesando...' : (isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión')}
          </button>

          <button
            type="button"
            onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccess(''); }}
            className="w-full text-center text-xs font-bold text-gray-500 hover:text-black transition-colors uppercase tracking-wider"
          >
            {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </form>
      </div>
    </div>
  );
};

export const Navbar = () => {
  const { user, profile } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <nav className="h-16 bg-black text-white flex items-center justify-between px-4 md:px-8 shrink-0 sticky top-0 z-50">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex flex-col hover:scale-[1.02] transition-transform">
                <span className="text-2xl font-black tracking-tighter uppercase italic leading-none">
                  CÓDIGO<span className="text-[#E63946]">27</span>
                </span>
                <span className="text-[10px] text-gray-400 font-medium mt-0.5 tracking-wide">Periodismo con criterio</span>
              </Link>
              <WeatherWidget />
            </div>
            <div className="hidden md:flex gap-6 text-sm font-bold uppercase tracking-wider text-gray-400">
              <Link to="/" className="hover:text-[#E63946] transition-colors">Inicio</Link>
              <Link to="/?formato=texto" className="hover:text-[#E63946] transition-colors">Texto</Link>
              <Link to="/?formato=audio" className="hover:text-[#E63946] transition-colors">Audio</Link>
              <Link to="/?formato=video" className="hover:text-[#E63946] transition-colors">Video</Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {!user ? (
              <button 
                onClick={() => setShowLogin(true)}
                className="bg-[#E63946] px-5 py-2 text-xs font-bold uppercase rounded-sm hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Staff
              </button>
            ) : (
              <div className="flex items-center gap-4 text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider hidden md:inline ml-2 text-white">
                  {profile?.nombre}
                </span>
                
                {profile?.rol !== 'admin' && (
                   <Link 
                      to="/dashboard"
                      className="hover:text-[#E63946] transition-colors text-xs font-bold uppercase tracking-wider"
                      title="Panel Staff"
                    >
                      Staff
                    </Link>
                )}

                {profile?.rol === 'admin' && (
                  <Link 
                    to="/admin"
                    className="hover:text-[#E63946] transition-colors text-xs font-bold uppercase tracking-wider text-red-400"
                    title="Acceso Admin"
                  >
                    Acceso Admin
                  </Link>
                )}
               
                <button 
                  onClick={logout}
                  className="hover:text-[#E63946] transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
};
