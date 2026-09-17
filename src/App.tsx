/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Home } from './pages/Home';
import { PostDetail } from './pages/PostDetail';
import { Dashboard } from './pages/Dashboard';
import { Editor } from './pages/Editor';
import { AdminPanel } from './pages/AdminPanel';
import { supabase } from './lib/supabase';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(t);
  }, [loading]);

  if (loading && !timedOut) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#E63946] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-gray-500 font-medium uppercase tracking-widest">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" />;
  return <>{children}</>;
}

const WeatherFooter = () => {
  const [weather, setWeather] = useState<{ temp: number; desc: string } | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-36.23&longitude=-61.11&current_weather=true');
        const data = await res.json();
        if (data.current_weather) {
          const w = data.current_weather;
          setWeather({ temp: w.temperature, desc: 'San Carlos de Bolívar' });
        }
      } catch (e) { }
    };
    fetchWeather();
  }, []);

  const today = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 items-center justify-between w-full text-gray-500">
      <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#1A1A1A] capitalize">
        {today}
      </span>
      {weather && (
        <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#E63946]">
          {weather.desc}: {weather.temp}°C
        </span>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans flex flex-col">
          <Navbar />
          <main className="flex-1 flex flex-col overflow-hidden">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/publicacion/:id" element={<PostDetail />} />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/editor/:id" element={
                <ProtectedRoute>
                  <Editor />
                </ProtectedRoute>
              } />
              
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
          
          <footer className="bg-white border-t border-gray-200 flex flex-col shrink-0">
            <div className="py-3 flex overflow-hidden w-full px-4 md:px-8 border-b border-gray-100 bg-[#F8F9FA]">
              <WeatherFooter />
            </div>
            <div className="py-2 bg-neutral-900 text-center w-full px-4 md:px-8">
               <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block">
                Repositorio Académico Digital - Lenguaje Periodístico 2 - Tecnicatura Superior en Periodismo - ISFDyT n27
               </span>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
