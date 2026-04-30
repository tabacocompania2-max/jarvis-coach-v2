import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, resetPassword } from '../services/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mail, Lock, ArrowRight, User as UserIcon, AlertCircle, CheckCircle2 } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // 'login', 'register', 'reset'
  const [view, setView] = useState<'login' | 'register' | 'reset'>('login');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (view === 'reset') {
        if (!email) throw new Error('Por favor ingresa tu correo electrónico');
        await resetPassword(email);
        setSuccess('Te hemos enviado un correo con instrucciones para restablecer tu contraseña.');
      } else if (view === 'register') {
        const user = await registerUser(email, password);
        const token = await user.getIdToken();
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        await fetch(`${apiUrl}/api/auth/register`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name: name || email.split('@')[0] })
        });
        navigate('/dashboard');
      } else {
        await loginUser(email, password);
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('Usuario no encontrado. Verifica tu correo electrónico.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Contraseña incorrecta.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('El correo ya está en uso por otra cuenta.');
      } else {
        setError(err.message || 'Error de autenticación. Verifica tus datos.');
      }
    } finally {
      setLoading(false);
    }
  };



  const getSubtitle = () => {
    if (view === 'login') return 'Inicia sesión para continuar con tu aprendizaje';
    if (view === 'register') return 'Crea tu cuenta gratis hoy mismo';
    return 'Ingresa tu correo para restablecer tu contraseña';
  };

  return (
    <div className="min-h-screen bg-[#05050A] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-[#0D0D16]/80 backdrop-blur-2xl p-8 sm:p-10 rounded-[2rem] border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          
          {/* Subtle top reflection */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Header */}
          <div className="flex flex-col items-center mb-10">
            <motion.div 
              initial={{ rotate: -10 }}
              animate={{ rotate: 0 }}
              className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6"
            >
              <Sparkles className="text-white w-8 h-8" />
            </motion.div>
            <h1 className="text-3xl font-extrabold text-white text-center tracking-tight">Jarvis Coach</h1>
            <p className="text-gray-400 text-center mt-3 text-sm font-medium">
              {getSubtitle()}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <AnimatePresence mode="popLayout">
              {view === 'register' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="relative overflow-hidden"
                >
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Tu nombre o apodo"
                    className="w-full bg-[#151520] border border-white/5 rounded-xl px-4 py-3.5 pl-12 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={view === 'register'}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
              <input
                type="email"
                placeholder="Correo electrónico"
                className="w-full bg-[#151520] border border-white/5 rounded-xl px-4 py-3.5 pl-12 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <AnimatePresence mode="popLayout">
              {view !== 'reset' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative overflow-hidden"
                >
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
                  <input
                    type="password"
                    placeholder="Contraseña"
                    className="w-full bg-[#151520] border border-white/5 rounded-xl px-4 py-3.5 pl-12 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {view === 'login' && (
              <div className="flex justify-end mt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setView('reset');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-400 text-sm"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </motion.div>
              )}
              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-start gap-2 bg-green-500/10 border border-green-500/20 p-3 rounded-lg text-green-400 text-sm"
                >
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>{success}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {view === 'reset' ? 'Enviar correo de recuperación' : (view === 'register' ? 'Crear Cuenta' : 'Iniciar Sesión')}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-2">
            {view === 'reset' ? (
              <button 
                type="button" 
                onClick={() => setView('login')}
                className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2"
              >
                Volver a Iniciar Sesión
              </button>
            ) : (
              <p className="text-gray-400 text-sm">
                {view === 'register' ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
                <button 
                  type="button" 
                  onClick={() => {
                    setView(view === 'register' ? 'login' : 'register');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-blue-400 font-semibold ml-2 hover:text-blue-300 transition-colors"
                >
                  {view === 'register' ? 'Inicia sesión' : 'Regístrate gratis'}
                </button>
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
