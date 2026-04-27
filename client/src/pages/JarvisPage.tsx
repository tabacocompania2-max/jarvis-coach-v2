import { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeech } from '../hooks/useSpeech';

export const JarvisPage = () => {
  const [jarvisStatus, setJarvisStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('Hola Carlos, soy Jarvis. ¿En qué puedo ayudarte hoy con tu inglés?');

  const { 
    isListening, 
    isThinking, 
    startListening, 
    stopListening,
    conversationHistory, 
    jarvisResponse 
  } = useSpeech();

  useEffect(() => {
    if (isThinking) setJarvisStatus('thinking');
    else if (isListening) setJarvisStatus('listening');
    else setJarvisStatus('idle');
  }, [isListening, isThinking]);

  useEffect(() => {
    if (jarvisResponse) {
      setResponse(jarvisResponse);
      setJarvisStatus('speaking');
      setTimeout(() => setJarvisStatus('idle'), 4000);
    }
  }, [jarvisResponse]);

  useEffect(() => {
    if (conversationHistory.length > 0) {
      const lastMsg = conversationHistory[conversationHistory.length - 1];
      if (lastMsg.role === 'user') {
        setTranscript(lastMsg.content);
      }
    }
  }, [conversationHistory]);

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md gap-12 relative px-6">
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
              className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-xl"
            >
              {jarvisStatus === 'speaking' ? (
                <Volume2 className="w-12 h-12 text-white animate-pulse" />
              ) : (
                <div className="w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full" />
                </div>
              )}
            </motion.div>
          </div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-4 h-4 bg-cyan-300 rounded-full blur-sm" />
        </motion.div>

        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
          <span className="text-cyan-300 font-medium tracking-widest uppercase text-xs">
            {jarvisStatus}
          </span>
        </div>
      </div>

      {/* Interaction Text */}
      <div className="w-full text-center space-y-4">
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
        
        {transcript && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-slate-400 italic"
          >
            Carlos: {transcript}...
          </motion.p>
        )}
      </div>

      {/* Voice Control Button */}
      <div className="mt-8">
        <button 
          onClick={toggleMic}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${
            isListening 
              ? 'bg-red-500 shadow-lg shadow-red-500/50 scale-110' 
              : 'bg-cyan-500 shadow-lg shadow-cyan-500/50'
          }`}
        >
          {isListening ? (
            <MicOff className="w-8 h-8 text-white" />
          ) : (
            <Mic className="w-8 h-8 text-white" />
          )}
        </button>
      </div>
    </div>
  );
};
