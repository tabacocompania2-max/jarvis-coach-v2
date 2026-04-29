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
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    jarvisResponseRef.current = jarvisResponse;
  }, [jarvisResponse]);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Inicializar detección de volumen (VAD)
  const initializeVoiceDetection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false // Importante: no auto-gain para detección acurada
        } 
      });
      
      streamRef.current = stream;
      audioContextRef.current = new (window as any).AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      source.connect(analyserRef.current);
      
      console.log('✅ Voice detection (VAD) initialized');
    } catch (error) {
      console.error('❌ Error initializing voice detection:', error);
    }
  };

  // Detectar si es voz humana real o síntesis de Jarvis
  const isHumanVoice = (): boolean => {
    if (!analyserRef.current) return false;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calcular varianza de frecuencias
    // Voz humana: altamente variable (variance > 500)
    // Síntesis: predecible y estable (variance < 400)
    const mean = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const variance = dataArray.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / dataArray.length;
    
    console.log('📊 Variance (humano >500, síntesis <400):', variance.toFixed(2));
    
    return variance > 500; // Threshold: 500 = voz real
  };

  // Detectar si usuario está hablando basado en el RMS
  const isUserSpeaking = (): boolean => {
    if (!analyserRef.current) return false;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calcular RMS (volumen)
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length);
    
    // ESTRATEGIA TRIPLE:
    // 1. Threshold de volumen dinámico
    // 2. Detección de voz humana (variance)
    // 3. Estado de Jarvis hablando
    
    const THRESHOLD_INTERRUPT = 70;  // Para interrumpir a Jarvis
    const THRESHOLD_NORMAL = 30;     // Conversación normal
    
    const threshold = isJarvisSpeaking ? THRESHOLD_INTERRUPT : THRESHOLD_NORMAL;
    const hasEnoughVolume = rms > threshold;
    const isRealHumanVoice = isHumanVoice();
    
    // Solo retornar true si:
    // - Tiene volumen suficiente Y
    // - Es voz humana real (no síntesis)
    const userSpeaking = hasEnoughVolume && isRealHumanVoice;
    
    if (userSpeaking) {
      console.log(`🎤 Usuario hablando (RMS: ${rms.toFixed(0)}, Humano: true)`);
    }
    
    return userSpeaking;
  };

  // Monitoreo continuo de voz (opcional para logs/UI o disparos rápidos)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isListening && !isJarvisSpeaking) {
        const speaking = isUserSpeaking();
        if (!speaking) {
          // Usuario paró de hablar, procesar audio
          // Esto ayuda a mantener estados, la lógica real se hace en onresult
        }
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [isListening, isJarvisSpeaking]);

  useEffect(() => {
    initializeVoiceDetection();
    
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
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
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
    // No iniciar si Jarvis está hablando
    if (isJarvisSpeaking) {
      console.log('⏸️  Esperando a que Jarvis termine...');
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
    // Mantenemos continue para permitir la charla sin apretar el botón constantemente,
    // pero manejando la finalización en onresult
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
        
        if (isFinal) {
          // ✅ LÓGICA FINAL Y DEFINITIVA:
          if (isUserSpeaking()) {
            // Usuario está hablando: SIEMPRE procesar
            console.log('🎤 ✅ Usuario detectado, procesando:', text);
            
            // Si Jarvis estaba hablando, INTERRUMPIRLO INMEDIATAMENTE
            if (isJarvisSpeaking) {
              console.log('⏹️  INTERRUMPIENDO A JARVIS');
              window.speechSynthesis.cancel();
              setIsJarvisSpeaking(false);
            }
            
            await handleUserMessage(text);
          } else {
            // NO es usuario: ignorar completamente
            // (Es echo, síntesis de Jarvis, o ruido)
            console.log('🔇 ❌ Rechazado: No es voz humana o volumen insuficiente');
          }
        } else {
          // Transcript provisional: solo si usuario está hablando
          if (isUserSpeaking()) {
            interimTranscript += text;
          }
        }
      }

      // Actualizar transcripción visible
      if (interimTranscript) {
        setTranscript(interimTranscript);
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
