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
  const [transcript, setTranscript] = useState('');
  const [jarvisResponse, setJarvisResponse] = useState('');
  const jarvisResponseRef = useRef('');
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const recognitionRef = useRef<any>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // Sincronizar las referencias con el estado para que las funciones de callback (onresult, onend) 
  // siempre vean los valores más recientes y no se queden con "clausuras viejas".
  useEffect(() => {
    jarvisResponseRef.current = jarvisResponse;
  }, [jarvisResponse]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // 1. Inicializar la cancelación de eco por hardware/software del navegador
  useEffect(() => {
    const initAEC = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        audioStreamRef.current = stream;
        console.log('✅ AEC (Acoustic Echo Cancellation) activado');
      } catch (err) {
        console.warn('⚠️ No se pudo activar AEC por hardware:', err);
      }
    };

    initAEC();

    return () => {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Detener voz al cerrar o recargar la página
  useEffect(() => {
    const handleUnload = () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    // Limpieza al montar: por si quedó algo de la sesión anterior
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
    const SpeechRecognition = (window as any).SpeechRecognition || 
                             (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignorar si ya estaba detenido
      }
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'es-ES';
    recognitionRef.current.continuous = true; // ESCUCHA PERMANENTE
    recognitionRef.current.interimResults = true; // Para detectar interrupciones más rápido

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = async (event: any) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        const isFinal = event.results[i].isFinal;
        
        // --- LÓGICA DE FILTRO DE ECO / INTERRUPCIÓN ---
        if (window.speechSynthesis.speaking) {
          // Normalizar ambos textos para una comparación justa (quitar puntos, comas, etc.)
          const cleanText = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()!?¿¡]/g, "").trim();
          const cleanJarvis = jarvisResponseRef.current.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()!?¿¡]/g, "").trim();
          
          // Si el texto capturado está contenido en lo que Jarvis está diciendo, es eco.
          const isProbablyEcho = cleanJarvis.includes(cleanText) || cleanText.length < 3;

          if (isProbablyEcho) {
            console.log('🔇 Eco de Jarvis (normalizado) bloqueado:', cleanText);
            continue; 
          } else {
            console.log('🎙️ Interrupción real detectada:', cleanText);
            stopSpeaking();
          }
        }

        if (isFinal) {
          await handleUserMessage(text);
        } else {
          interimTranscript += text;
        }
      }

      setTranscript(interimTranscript);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') return;
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      // USAR REFERENCIA: Para que onend siempre sepa si el usuario apagó el micro o no
      if (isListeningRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Ya iniciado
        }
      }
    };

    recognitionRef.current.start();
  };

  const handleUserMessage = async (userMessage: string) => {
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
      
      // Usar variable de entorno para la URL del backend, o localhost por defecto
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

      // Agregar respuesta de Jarvis
      setJarvisResponse(jarvisMsg);
      setConversationHistory([
        ...updatedHistory,
        {
          role: 'assistant',
          content: jarvisMsg,
          timestamp: new Date().toISOString(),
        },
      ]);

      // Hablar la respuesta (Jarvis habla en inglés)
      speakResponse(jarvisMsg);
    } catch (error) {
      console.error('Error calling Jarvis:', error);
    } finally {
      setIsThinking(false);
    }
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const speakResponse = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    // Cancelar cualquier discurso previo
    stopSpeaking();

    // Dividir el texto en fragmentos de Inglés y Español
    // Buscamos patrones de frases en inglés o palabras marcadas (usualmente entre comillas o seguidas de traducción)
    // Para simplificar, dividiremos por frases y detectaremos el idioma predominante de cada una
    const segments = text.split(/([.!?]+)/).filter(s => s.trim().length > 0);
    const combinedSegments: string[] = [];
    
    for (let i = 0; i < segments.length; i += 2) {
      const sentence = segments[i] + (segments[i+1] || '');
      combinedSegments.push(sentence.trim());
    }

    const voices = window.speechSynthesis.getVoices();
    
    // Selección de voces con mayor afinidad entre sí
    // Buscamos voces masculinas para Jarvis o femeninas según disponibilidad
    let esVoice = voices.find(v => v.lang.startsWith('es') && v.name.includes('Google')) || 
                  voices.find(v => v.lang.startsWith('es') && v.name.includes('Natural')) ||
                  voices.find(v => v.lang.startsWith('es'));
                    
    let enVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || 
                  voices.find(v => v.lang.startsWith('en') && v.name.includes('Natural')) ||
                  voices.find(v => v.lang.startsWith('en'));

    combinedSegments.forEach((segment) => {
      if (!segment) return;

      const utterance = new SpeechSynthesisUtterance(segment);
      
      // Heurística mejorada: Si contiene comillas o frases comunes de ejemplo
      const hasQuotes = segment.includes('"') || segment.includes("'");
      const hasEnglishWords = /\b(the|is|are|you|it|in|to|and|was|were|have|has|i|am|my|this|that|with)\b/i.test(segment);
      
      // Si el segmento es corto y tiene comillas, es casi seguro inglés
      const isEnglish = (hasQuotes && segment.length < 100) || (hasEnglishWords && !/[áéíóúñ]/i.test(segment));

      if (isEnglish) {
        utterance.voice = enVoice || null;
        utterance.lang = 'en-US';
        utterance.rate = 0.85; // Un poco más pausado para el inglés
        utterance.pitch = 0.95; // Un toque más profundo para sonar a Jarvis
      } else {
        utterance.voice = esVoice || null;
        utterance.lang = 'es-ES';
        utterance.rate = 1.0;
        utterance.pitch = 0.95; // Mantener el mismo tono que en inglés
      }

      window.speechSynthesis.speak(utterance);
    });
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignorar si ya estaba detenido
      }
    }
  };

  return {
    isListening,
    isThinking,
    transcript,
    jarvisResponse,
    conversationHistory,
    startListening,
    stopListening,
  };
}
