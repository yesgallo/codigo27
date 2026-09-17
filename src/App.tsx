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
          
          <footer className="bg-neutral-900 text-center w-full shrink-0 py-2 px-4 md:px-8">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block">
              Repositorio Académico Digital - Lenguaje Periodístico 2 - Tecnicatura Superior en Periodismo - ISFDyT n27
            </span>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
