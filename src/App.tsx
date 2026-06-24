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

// Ticker dinámico: muestra los títulos de las últimas publicaciones
const TrendingTicker = () => {
  const [titulos, setTitulos] = useState<string[]>([]);

  useEffect(() => {
    const fetchTitulos = async () => {
      try {
        const { data } = await supabase
          .from('publicaciones')
          .select('titulo')
          .eq('estado', 'publicado')
          .order('fecha_publicacion', { ascending: false })
          .limit(10);
        if (data && data.length > 0) {
          setTitulos(data.map((p: any) => p.titulo));
        }
      } catch (_) {}
    };
    fetchTitulos();
  }, []);

  // Si todavía no hay publicaciones, muestra los hashtags por defecto
  const items = titulos.length > 0 ? titulos : [
    '#MeEncantaBolivar',
    '#ClubCiudadDeBolivar',
    '#CineAvenida',
    '#Ruta226',
    '#ParqueLasAcollaradas',
    '#MaratonBolivar',
  ];

  return (
    <div className="flex gap-6 whitespace-nowrap overflow-x-auto no-scrollbar mask-gradient text-gray-500">
      {items.map((item, i) => (
        <span
          key={i}
          className="text-xs font-medium hover:underline cursor-pointer hover:text-gray-900 transition-colors shrink-0"
        >
          {item}
        </span>
      ))}
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
            <div className="py-3 flex gap-4 md:gap-6 items-center overflow-hidden w-full px-4 md:px-8">
              <span className="text-[10px] font-black uppercase text-[#E63946] whitespace-nowrap hidden sm:inline-block">
                Últimas notas:
              </span>
              <TrendingTicker />
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
