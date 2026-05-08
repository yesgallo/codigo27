import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { loginWithGoogle, logout } from '../../lib/firebase';
import { LogIn, LogOut, Sun, Cloud, CloudRain, CloudLightning, CloudSnow, CloudFog } from 'lucide-react';

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

export const Navbar = () => {
  const { user, profile } = useAuth();

  return (
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
              onClick={loginWithGoogle}
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
  );
};
