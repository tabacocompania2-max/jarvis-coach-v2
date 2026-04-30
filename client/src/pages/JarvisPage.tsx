import { useState, useEffect } from 'react';
import { Mic, Volume2, Send, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeech } from '../hooks/useSpeech';

export const JarvisPage = () => {
  const [jarvisStatus, setJarvisStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [response, setResponse] = useState('Hola Carlos, soy Jarvis. ¿En qué puedo ayudarte hoy con tu inglés?');
  const [textInput, setTextInput] = useState('');

  const { 
    isSupported,
    isListening, 
    isThinking, 
    isJarvisSpeaking,
    transcript,
    startListening, 
    stopListening,
    handleUserMessage,
    stopSpeaking,
    jarvisResponse 
  } = useSpeech();

  useEffect(() => {
    if (isThinking) setJarvisStatus('thinking');
    else if (isListening) setJarvisStatus('listening');
    else if (isJarvisSpeaking) setJarvisStatus('speaking');
    else setJarvisStatus('idle');
  }, [isListening, isThinking, isJarvisSpeaking]);

  useEffect(() => {
    if (jarvisResponse) {
      setResponse(jarvisResponse);
    }
  }, [jarvisResponse]);


  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() || isThinking) return;
    
    handleUserMessage(textInput.trim());
    setTextInput('');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-between w-full max-w-md mx-auto py-8 px-6 relative h-full">
      {!isSupported && (
        <div className="absolute top-4 bg-red-500/80 text-white text-[10px] px-3 py-1 rounded-full z-50">
          Navegador no compatible con voz
        </div>
      )}
      
      {/* Top Spacer */}
      <div className="flex-1 flex flex-col items-center justify-center w-full gap-8">
        
        {/* Jarvis Core Visualizer */}
        <div className="relative">
          <motion.div 
            animate={{ 
              scale: jarvisStatus === 'listening' ? [1, 1.1, 1] : 1,
              rotate: 360 
            }}
            transition={{ 
              scale: { repeat: Infinity, duration: 1.5 },
              rotate: { repeat: Infinity, duration: 20, ease: "linear" }
            }}
            className="w-48 h-48 rounded-full border-2 border-cyan-500/30 flex items-center justify-center relative"
          >
            <div className="w-40 h-40 rounded-full border border-cyan-400/50 flex items-center justify-center">
              <motion.div 
                animate={{ 
                  boxShadow: jarvisStatus === 'listening' 
                    ? ["0 0 20px rgba(6, 182, 212, 0.5)", "0 0 60px rgba(6, 182, 212, 0.8)", "0 0 20px rgba(6, 182, 212, 0.5)"]
                    : "0 0 20px rgba(6, 182, 212, 0.3)"
                }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-xl relative"
              >
                {jarvisStatus === 'speaking' ? (
                  <Volume2 className="w-12 h-12 text-white animate-pulse" />
                ) : jarvisStatus === 'listening' ? (
                  <Mic className="w-12 h-12 text-white animate-pulse" />
                ) : (
                  <div className="w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </div>
                )}
              </motion.div>
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-4 h-4 bg-cyan-300 rounded-full blur-sm" />
          </motion.div>

          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="text-cyan-300 font-medium tracking-widest uppercase text-xs">
              {jarvisStatus === 'thinking' ? 'Pensando...' : jarvisStatus === 'listening' ? 'Escuchando...' : jarvisStatus === 'speaking' ? 'Hablando' : 'En espera'}
            </span>
          </div>
        </div>

        {/* Interaction Text */}
        <div className="w-full text-center space-y-4 mt-6">
          <AnimatePresence mode="wait">
            <motion.p 
              key={response}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-lg text-slate-100 font-medium leading-relaxed"
            >
              "{response}"
            </motion.p>
          </AnimatePresence>
          
          <AnimatePresence>
            {transcript && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-slate-400 italic bg-white/5 p-3 rounded-lg inline-block"
              >
                Tú: {transcript}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Input Area (Mic + Text) */}
      <div className="w-full mt-8 flex flex-col items-center gap-4">
        
        {/* Stop Speaking Button (Visible only when Jarvis is speaking) */}
        <AnimatePresence>
          {isJarvisSpeaking && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={stopSpeaking}
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-white px-4 py-2 rounded-full text-sm font-medium border border-white/10 mb-2 transition-colors"
            >
              <Square className="w-4 h-4" />
              Detener Audio
            </motion.button>
          )}
        </AnimatePresence>

        <form onSubmit={handleTextSubmit} className="w-full relative flex items-center gap-3 bg-[#151520] p-2 rounded-2xl border border-white/5 shadow-lg">
          
          {/* Mic Toggle Button */}
          <button 
            type="button"
            onClick={toggleMic}
            disabled={isThinking}
            className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
              isListening 
                ? 'bg-red-500 shadow-lg shadow-red-500/30' 
                : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 disabled:opacity-50'
            }`}
          >
            {isListening ? (
              <Square className="w-5 h-5 text-white fill-current" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            disabled={isThinking || isListening}
            placeholder={isListening ? "Escuchando..." : "Escribe un mensaje..."}
            className="flex-1 bg-transparent border-none text-white placeholder:text-gray-500 focus:outline-none focus:ring-0 px-2"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!textInput.trim() || isThinking || isListening}
            className="shrink-0 w-12 h-12 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:bg-slate-800 text-white rounded-xl flex items-center justify-center transition-colors"
          >
            {isThinking ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5 ml-1" />
            )}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Toca el micrófono para hablar, vuelve a tocar para enviar.
        </p>
      </div>

    </div>
  );
};

