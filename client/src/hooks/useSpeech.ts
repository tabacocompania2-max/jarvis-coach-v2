import { useState, useRef, useEffect } from 'react';
import { getAuthToken } from '../services/firebase';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isJarvisSpeaking, setIsJarvisSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [jarvisResponse, setJarvisResponse] = useState('');
  const jarvisResponseRef = useRef('');
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const accumulatedTextRef = useRef('');
  const speechTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearAccumulatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    jarvisResponseRef.current = jarvisResponse;
  }, [jarvisResponse]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Funciones VAD eliminadas en favor del sistema Wake Word ("Jarvis")


  useEffect(() => {
    const handleUnload = () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // Pre-cargar voces
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const startListening = () => {
    // No iniciar si Jarvis está pensando
    if (isThinking) {
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || 
                             (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'es-ES';
    recognitionRef.current.continuous = true; 
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognitionRef.current.onresult = async (event: any) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        const isFinal = event.results[i].isFinal;
        
        const textLower = text.toLowerCase();
        const hasJarvis = textLower.includes('jarvis') || textLower.includes('harvis') || textLower.includes('yarbiz') || textLower.includes('llarvis');

        if (isFinal) {
          accumulatedTextRef.current += ' ' + text;
        } else {
          interimTranscript += text;
        }

        // Si escuchamos el wake word mientras Jarvis habla, lo interrumpimos de inmediato
        if (isJarvisSpeaking && hasJarvis) {
          console.log('⏹️  INTERRUMPIENDO A JARVIS (Wake word detectado)');
          window.speechSynthesis.cancel();
          setIsJarvisSpeaking(false);
        }
      }

      const totalTextLower = (accumulatedTextRef.current + ' ' + interimTranscript).toLowerCase();
      const totalHasJarvis = totalTextLower.includes('jarvis') || totalTextLower.includes('harvis') || totalTextLower.includes('yarbiz') || totalTextLower.includes('llarvis');

      // Limpiar timeouts para reiniciar el conteo de silencio
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      if (clearAccumulatorTimeoutRef.current) clearTimeout(clearAccumulatorTimeoutRef.current);

      if (totalHasJarvis) {
        // El usuario ya dijo Jarvis. Esperar 1.8 segundos de silencio absoluto antes de responder.
        speechTimeoutRef.current = setTimeout(async () => {
          console.log('🎤 ✅ Wake word y silencio detectado, procesando:', accumulatedTextRef.current);
          const messageToSend = accumulatedTextRef.current.trim();
          accumulatedTextRef.current = '';
          setTranscript('');
          if (messageToSend) {
            await handleUserMessage(messageToSend);
          }
        }, 1800);
      } else {
        // Si no ha dicho Jarvis, borrar la basura acumulada tras 3 segundos de silencio
        clearAccumulatorTimeoutRef.current = setTimeout(() => {
          accumulatedTextRef.current = '';
          setTranscript('');
        }, 3000);
      }

      // Actualizar transcripción visible en tiempo real
      if (interimTranscript || accumulatedTextRef.current) {
        setTranscript((accumulatedTextRef.current + ' ' + interimTranscript).trim());
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') return;
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      if (isListeningRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
    };

    recognitionRef.current.start();
  };

  const handleUserMessage = async (userMessage: string) => {
    if (!userMessage || userMessage.trim().length === 0) return;

    // Agregar mensaje del usuario al historial
    const updatedHistory: ConversationMessage[] = [
      ...conversationHistory,
      {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      },
    ];
    setConversationHistory(updatedHistory);
    setIsThinking(true);

    try {
      const token = await getAuthToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      const response = await fetch(`${apiUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: updatedHistory.slice(0, -1).map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
          })),
        }),
      });

      const data = await response.json();
      const jarvisMsg = data.response;

      setJarvisResponse(jarvisMsg);
      setConversationHistory([
        ...updatedHistory,
        {
          role: 'assistant',
          content: jarvisMsg,
          timestamp: new Date().toISOString(),
        },
      ]);

      // IMPORTANTE: Marcar que Jarvis está hablando
      setIsJarvisSpeaking(true);
      
      // Hablar la respuesta (espera a que termine)
      await speakResponse(jarvisMsg);
      
      // IMPORTANTE: Marcar que Jarvis terminó
      setIsJarvisSpeaking(false);
      
      // ✅ PAUSA CRÍTICA: Esperar a que el audio de síntesis 
      // termine de propagarse completamente a través del sistema
      // Esto evita que se capture "cola" del audio después
      console.log('⏸️  Pausa post-síntesis (600ms)...');
      await new Promise(resolve => setTimeout(resolve, 600));
      console.log('✅ Reactivando escucha');
      
    } catch (error) {
      console.error('Error calling Jarvis:', error);
      setIsJarvisSpeaking(false);
    } finally {
      setIsThinking(false);
    }
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const speakResponse = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }
      
      // Cancelar discurso previo
      stopSpeaking();

      // Dividir el texto en fragmentos (Bilingüe)
      const segments = text.split(/([.!?]+)/).filter(s => s.trim().length > 0);
      const combinedSegments: string[] = [];
      
      for (let i = 0; i < segments.length; i += 2) {
        const sentence = segments[i] + (segments[i+1] || '');
        combinedSegments.push(sentence.trim());
      }

      if (combinedSegments.length === 0) {
        resolve();
        return;
      }

      const voices = window.speechSynthesis.getVoices();
      
      let esVoice = voices.find(v => v.lang.startsWith('es') && v.name.includes('Google')) || 
                    voices.find(v => v.lang.startsWith('es') && v.name.includes('Natural')) ||
                    voices.find(v => v.lang.startsWith('es'));
                      
      let enVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || 
                    voices.find(v => v.lang.startsWith('en') && v.name.includes('Natural')) ||
                    voices.find(v => v.lang.startsWith('en'));

      let currentIndex = 0;

      // Reproducir segmentos de forma secuencial
      const speakNextSegment = () => {
        if (currentIndex >= combinedSegments.length) {
          resolve();
          return;
        }

        const segment = combinedSegments[currentIndex];
        const utterance = new SpeechSynthesisUtterance(segment);
        
        const hasQuotes = segment.includes('"') || segment.includes("'");
        const hasEnglishWords = /\b(the|is|are|you|it|in|to|and|was|were|have|has|i|am|my|this|that|with)\b/i.test(segment);
        const isEnglish = (hasQuotes && segment.length < 100) || (hasEnglishWords && !/[áéíóúñ]/i.test(segment));

        if (isEnglish) {
          utterance.voice = enVoice || null;
          utterance.lang = 'en-US';
          utterance.rate = 0.85;
          utterance.pitch = 0.95;
        } else {
          utterance.voice = esVoice || null;
          utterance.lang = 'es-ES';
          utterance.rate = 1.0;
          utterance.pitch = 0.95;
        }

        utterance.onend = () => {
          currentIndex++;
          speakNextSegment();
        };

        utterance.onerror = (e) => {
          console.error('Speech synthesis error', e);
          currentIndex++;
          speakNextSegment();
        };

        window.speechSynthesis.speak(utterance);
      };

      speakNextSegment();
    });
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  return {
    isListening,
    isThinking,
    isJarvisSpeaking,
    transcript,
    jarvisResponse,
    conversationHistory,
    startListening,
    stopListening,
  };
}
