import { useState, useRef, useEffect } from 'react';
import { getAuthToken } from '../services/firebase';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function useSpeech() {
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isJarvisSpeaking, setIsJarvisSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [volume, setVolume] = useState(0);
  
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const manualStopRef = useRef(true);
  const processingRef = useRef(false);
  
  const accumulatedTextRef = useRef('');
  const speechTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearAccumulatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Verificar soporte
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  useEffect(() => {
    const handleUnload = () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // Pre-cargar voces con fallback para móvil
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);
  const silenceTimerRef = useRef<number>(0);
  const isSpeakingRef = useRef<boolean>(false);

  // Lógica de VAD (Voice Activity Detection) basada en volumen real
  useEffect(() => {
    if (!isListening || processingRef.current) return;

    const VAD_THRESHOLD = 15; // Umbral de volumen para detectar voz
    const SILENCE_GAP = 700; // ms de silencio para considerar que terminó de hablar

    const checkVAD = () => {
      if (volume > VAD_THRESHOLD) {
        silenceTimerRef.current = 0;
        isSpeakingRef.current = true;
      } else if (isSpeakingRef.current) {
        silenceTimerRef.current += 50; // Aproximado por el intervalo de ejecución
        
        // Si hay silencio suficiente y tenemos contenido, procesar
        if (silenceTimerRef.current >= SILENCE_GAP) {
          const fullText = (accumulatedTextRef.current + ' ' + transcript).toLowerCase();
          const hasJarvis = /jarvis|harvis|llarvis|yarbiz|service|charvis/i.test(fullText);

          if (hasJarvis && !processingRef.current) {
            const message = (accumulatedTextRef.current + ' ' + transcript).trim();
            if (message.length > 5) {
              handleUserMessage(message);
              isSpeakingRef.current = false;
              silenceTimerRef.current = 0;
            }
          }
        }
      }
    };

    const interval = setInterval(checkVAD, 50);
    return () => clearInterval(interval);
  }, [volume, isListening, transcript]);

  const handleUserMessage = async (userMessage: string) => {
    if (!userMessage || userMessage.trim().length === 0 || processingRef.current) return;

    processingRef.current = true;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsJarvisSpeaking(false);

    const updatedHistory: ConversationMessage[] = [
      ...conversationHistory,
      { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
    ];
    setConversationHistory(updatedHistory);
    setIsThinking(true);
    
    // Resetear estados de escucha inmediatamente
    setTranscript('');
    accumulatedTextRef.current = '';
    isSpeakingRef.current = false;
    silenceTimerRef.current = 0;

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
        { role: 'assistant', content: jarvisMsg, timestamp: new Date().toISOString() },
      ]);

      setIsJarvisSpeaking(true);
      await speakResponse(jarvisMsg);
      setIsJarvisSpeaking(false);
      
    } catch (error) {
      console.error('Error calling Jarvis:', error);
      setIsJarvisSpeaking(false);
    } finally {
      setIsThinking(false);
      processingRef.current = false;
    }
  };

  const startVolumeAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      analyzerRef.current = analyzer;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyzer);
      
      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateVolume = () => {
        if (!analyzerRef.current) return;
        analyzerRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setVolume(average);
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      
      updateVolume();
    } catch (e) {
      console.error('Error starting volume analysis:', e);
    }
  };

  const stopVolumeAnalysis = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    setVolume(0);
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    startVolumeAnalysis();

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    manualStopRef.current = false;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'es-ES';
    recognitionRef.current.continuous = false; // MODO MOBILE-SAFE: Falso para evitar cuelgues
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event: any) => {
      if (processingRef.current) return;

      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          accumulatedTextRef.current += ' ' + text;
        } else {
          interimTranscript += text;
        }
      }

      const currentText = (accumulatedTextRef.current + ' ' + interimTranscript).trim();
      setTranscript(currentText);

      // Limpieza automática si no hay Jarvis (Buffer Circular mental)
      if (!/jarvis|harvis|llarvis|yarbiz|service|charvis/i.test(currentText)) {
        if (clearAccumulatorTimeoutRef.current) clearTimeout(clearAccumulatorTimeoutRef.current);
        clearAccumulatorTimeoutRef.current = setTimeout(() => {
          if (!isSpeakingRef.current) {
            accumulatedTextRef.current = '';
            setTranscript('');
          }
        }, 3000);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert('Activa el micrófono en los ajustes del sitio.');
        manualStopRef.current = true;
      }
    };

    recognitionRef.current.onend = () => {
      if (!manualStopRef.current) {
        // Reinicio casi instantáneo para no perder el inicio de frases
        setTimeout(() => {
          try {
            if (!manualStopRef.current) recognitionRef.current.start();
          } catch (e) {}
        }, 50);
      } else {
        setIsListening(false);
      }
    };

    try {
      recognitionRef.current.start();
    } catch(e) {}
  };

  const stopListening = () => {
    manualStopRef.current = true;
    setIsListening(false);
    stopVolumeAnalysis();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
  };

  const speakResponse = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        resolve();
        return;
      }
      
      window.speechSynthesis.cancel();

      const segments = text.split(/([.!?]+)/).filter(s => s.trim().length > 0);
      const combinedSegments: string[] = [];
      for (let i = 0; i < segments.length; i += 2) {
        combinedSegments.push((segments[i] + (segments[i+1] || '')).trim());
      }

      const availableVoices = window.speechSynthesis.getVoices();
      const esVoice = availableVoices.find(v => v.lang.startsWith('es') && (v.name.includes('Google') || v.name.includes('Natural'))) || availableVoices.find(v => v.lang.startsWith('es'));
      const enVoice = availableVoices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural'))) || availableVoices.find(v => v.lang.startsWith('en'));

      let idx = 0;
      const speakNext = () => {
        if (idx >= combinedSegments.length) {
          resolve();
          return;
        }

        const segment = combinedSegments[idx];
        const utterance = new SpeechSynthesisUtterance(segment);
        const isEnglish = /\b(the|is|are|you|it|to|and|have)\b/i.test(segment) && !/[áéíóúñ]/i.test(segment);

        utterance.voice = isEnglish ? (enVoice || null) : (esVoice || null);
        utterance.lang = isEnglish ? 'en-US' : 'es-ES';
        utterance.rate = isEnglish ? 0.9 : 1.0;

        utterance.onend = () => { idx++; speakNext(); };
        utterance.onerror = () => { idx++; speakNext(); };

        window.speechSynthesis.speak(utterance);
      };

      speakNext();
    });
  };

  return {
    isSupported,
    isListening,
    isThinking,
    isJarvisSpeaking,
    volume,
    transcript,
    jarvisResponse,
    conversationHistory,
    startListening,
    stopListening,
    handleUserMessage,
    stopSpeaking: () => { window.speechSynthesis.cancel(); setIsJarvisSpeaking(false); }
  };
}

