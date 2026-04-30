import { useState, useRef, useEffect } from 'react';
import { getAuthToken } from '../services/firebase';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isJarvisSpeaking, setIsJarvisSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [jarvisResponse, setJarvisResponse] = useState('');
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const manualStopRef = useRef(true); // Empieza en true para no iniciar solo, el usuario decide si enciende el mic. Si quieres auto-start, ponlo en false
  const processingRef = useRef(false);
  
  const accumulatedTextRef = useRef('');
  const speechTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearAccumulatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleUnload = () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
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

  const handleUserMessage = async (userMessage: string) => {
    if (!userMessage || userMessage.trim().length === 0) return;

    processingRef.current = true;

    // Si Jarvis estaba hablando, lo interrumpimos
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsJarvisSpeaking(false);
    }

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
    setTranscript(''); // Limpiar transcripción actual
    accumulatedTextRef.current = '';

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

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser');
      alert('Tu navegador no soporta reconocimiento de voz.');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    manualStopRef.current = false;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'es-ES';
    
    // IMPORTANTE: continuous en true para escuchar todo el tiempo (hasta que se pare manualmente)
    recognitionRef.current.continuous = true; 
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setTranscript('');
      accumulatedTextRef.current = '';
    };

    recognitionRef.current.onresult = (event: any) => {
      if (processingRef.current) return; // Ignorar si ya estamos procesando un mensaje

      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          accumulatedTextRef.current += ' ' + text;
        } else {
          interimTranscript += text;
        }
      }

      const totalTextLower = (accumulatedTextRef.current + ' ' + interimTranscript).toLowerCase();
      const hasJarvis = totalTextLower.includes('jarvis') || 
                        totalTextLower.includes('harvis') || 
                        totalTextLower.includes('yarbiz') || 
                        totalTextLower.includes('llarvis') ||
                        totalTextLower.includes('service') ||
                        totalTextLower.includes('charvis');

      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      if (clearAccumulatorTimeoutRef.current) clearTimeout(clearAccumulatorTimeoutRef.current);

      if (hasJarvis) {
        // Interrumpir si Jarvis estaba hablando
        if (isJarvisSpeaking) {
          window.speechSynthesis.cancel();
          setIsJarvisSpeaking(false);
        }

        // Esperar 1.0 segundos de silencio antes de mandar
        speechTimeoutRef.current = setTimeout(() => {
          if (processingRef.current) return;
          
          const messageToSend = (accumulatedTextRef.current + ' ' + interimTranscript).trim();
          if (messageToSend.length > 3) {
            handleUserMessage(messageToSend);
          }
        }, 1000); 
      } else {
        // Si no ha dicho Jarvis, borrar la basura acumulada tras 4 segundos de silencio
        clearAccumulatorTimeoutRef.current = setTimeout(() => {
          accumulatedTextRef.current = '';
          setTranscript('');
        }, 4000);
      }

      setTranscript((accumulatedTextRef.current + ' ' + interimTranscript).trim());
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert('Por favor, permite el acceso al micrófono en los ajustes de tu navegador para que Jarvis pueda escucharte.');
        manualStopRef.current = true;
        setIsListening(false);
      }
      if (event.error !== 'no-speech' && manualStopRef.current) {
        setIsListening(false);
      }
    };

    recognitionRef.current.onend = () => {
      // Reinicio con delay para evitar bloqueos del navegador móvil o spam
      if (!manualStopRef.current) {
        setTimeout(() => {
          try {
            if (!manualStopRef.current) {
              recognitionRef.current.start();
            }
          } catch (e) {
            console.error('Error restarting recognition:', e);
          }
        }, 400); 
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
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsJarvisSpeaking(false);
    }
  };

  const speakResponse = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }
      
      stopSpeaking();

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

  return {
    isListening,
    isThinking,
    isJarvisSpeaking,
    transcript,
    jarvisResponse,
    conversationHistory,
    startListening,
    stopListening,
    handleUserMessage, // Exportado para permitir input de texto manual
    stopSpeaking
  };
}

