/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Home } from './pages/Home';
import { PostDetail } from './pages/PostDetail';
import { Dashboard } from './pages/Dashboard';
import { Editor } from './pages/Editor';
import { AdminPanel } from './pages/AdminPanel';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/" />;
  return <>{children}</>;
}

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
              <span className="text-[10px] font-black uppercase text-[#E63946] whitespace-nowrap hidden sm:inline-block">Lo más buscado en internet:</span>
              <div className="flex gap-6 whitespace-nowrap overflow-x-auto no-scrollbar mask-gradient text-gray-500">
                <span className="text-xs font-medium hover:underline cursor-pointer hover:text-gray-900 transition-colors">#MeEncantaBolivar</span>
                <span className="text-xs font-medium hover:underline cursor-pointer hover:text-gray-900 transition-colors">#ClubCiudadDeBolivar</span>
                <span className="text-xs font-medium hover:underline cursor-pointer hover:text-gray-900 transition-colors">#CineAvenida</span>
                <span className="text-xs font-medium hover:underline cursor-pointer hover:text-gray-900 transition-colors">#Ruta226</span>
                <span className="text-xs font-medium hover:underline cursor-pointer hover:text-gray-900 transition-colors">#ParqueLasAcollaradas</span>
                <span className="text-xs font-medium hover:underline cursor-pointer hover:text-gray-900 transition-colors">#MaratonBolivar</span>
              </div>
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

