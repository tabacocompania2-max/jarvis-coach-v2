import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { JarvisPage } from './pages/JarvisPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { BookOpen, Sparkles, BarChart3, LogOut, Settings } from 'lucide-react';
import { logoutUser } from './services/firebase';

// Layout component to share the bottom navigation
const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[#0f0f1e] overflow-hidden relative">
      {/* Header (Shared) */}
      <header className="w-full max-w-4xl flex justify-between items-center p-6 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">English Coach</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full glass hover:bg-white/10 transition-colors">
            <Settings className="w-5 h-5 text-slate-300" />
          </button>
          <button 
            onClick={logoutUser}
            className="p-2 rounded-full glass hover:bg-red-500/20 group transition-colors"
          >
            <LogOut className="w-5 h-5 text-slate-300 group-hover:text-red-400" />
          </button>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 w-full flex flex-col items-center overflow-y-auto">
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="w-full max-w-md px-6 pb-8 pt-4 z-50">
        <div className="w-full flex justify-between px-4 py-3 glass rounded-2xl shadow-2xl">
          <Link to="/lessons" className="flex flex-col items-center gap-1 group">
            <BookOpen className={`w-6 h-6 transition-colors ${path === '/lessons' ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'}`} />
            <span className={`text-[10px] transition-colors ${path === '/lessons' ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-300'}`}>Lessons</span>
          </Link>
          <Link to="/dashboard" className="flex flex-col items-center gap-1 group">
            <Sparkles className={`w-6 h-6 transition-colors ${path === '/dashboard' ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'}`} />
            <span className={`text-[10px] transition-colors ${path === '/dashboard' ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-300'}`}>Jarvis</span>
          </Link>
          <Link to="/stats" className="flex flex-col items-center gap-1 group">
            <BarChart3 className={`w-6 h-6 transition-colors ${path === '/stats' ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'}`} />
            <span className={`text-[10px] transition-colors ${path === '/stats' ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-300'}`}>Stats</span>
          </Link>
        </div>
      </nav>

      {/* Global Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[10%] -left-20 w-64 h-64 bg-cyan-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[10%] -right-20 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px]" />
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MainLayout>
              <JarvisPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/stats" element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/lessons" element={
          <ProtectedRoute>
            <MainLayout>
              <div className="flex-1 flex items-center justify-center text-gray-500 italic">
                Próximamente: Lecciones Diarias Personalizadas
              </div>
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
