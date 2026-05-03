import { useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Linking } from 'react-native';
import { audioService } from '../services/audioService';
import { whisperService } from '../services/whisperService';
import { grokService } from '../services/grokService';
import { elevenLabsService } from '../services/elevenLabsService';
import { youtubeClientService } from '../services/youtubeService';
import { useSecureCall } from './useSecureCall';
import * as Speech from 'expo-speech';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function useSpeechAudio() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isJarvisSpeaking, setIsJarvisSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [jarvisResponse, setJarvisResponse] = useState('');
  const { handleSecureCall, isActive: isCallActive } = useSecureCall();
  const isCallActiveRef = useRef(false);

  // Sincronizar el interruptor maestro con el estado de la llamada
  useEffect(() => {
    isCallActiveRef.current = isCallActive;
    console.log(`🛡️ Estado del interruptor de seguridad: ${isCallActive ? 'ON' : 'OFF'}`);
  }, [isCallActive]);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentMedia, setCurrentMedia] = useState<{
    type: 'music' | 'podcast';
    title: string;
    artist?: string;
  } | null>(null);

  const listeningRef = useRef(false);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingRef = useRef(false);
  const voiceDetectedRef = useRef(false);
  
  // LOGICA DE UMBRAL DINÁMICO
  const noiseFloorRef = useRef(0.005);
  const dynamicThresholdRef = useRef(0.012);
  const [visualThreshold, setVisualThreshold] = useState(0.012);

  // GESTIÓN DE VOCES
  const preferredVoiceEN = useRef<string | undefined>(undefined);
  const preferredVoiceES = useRef<string | undefined>(undefined);

  // Configuraciones de tiempo
  const SILENCE_DURATION = 1000; 
  const MAX_RECORDING_TIME = 20000;

  // Inicializar audio y buscar mejores voces
  useEffect(() => {
    const initAudio = async () => {
      try {
        await audioService.initialize();
        
        // Buscar mejores voces disponibles en el dispositivo
        const loadVoices = async () => {
          const availableVoices = await Speech.getAvailableVoicesAsync();
          
          // PRIORIDAD 1: Buscar voces específicas de COLOMBIA
          const voiceCO = availableVoices.find(v => 
            v.language.toLowerCase().includes('es-co') || 
            v.name.toLowerCase().includes('colombia')
          );
          
          // PRIORIDAD 2: Buscar voces de México/Latinoamérica si no hay CO
          const voiceMX = availableVoices.find(v => 
            v.language.toLowerCase().includes('es-mx') || 
            v.language.toLowerCase().includes('es-us')
          );

          if (voiceCO) {
            console.log('🇨🇴 Voz colombiana detectada:', voiceCO.name);
            preferredVoiceES.current = voiceCO.identifier;
          } else if (voiceMX) {
            console.log('🇲🇽 Voz latina detectada:', voiceMX.name);
            preferredVoiceES.current = voiceMX.identifier;
          }

          // Para Inglés (US o AU)
          const voiceEN = availableVoices.find(v => v.language.startsWith('en-US')) || 
                          availableVoices.find(v => v.language.startsWith('en'));
          if (voiceEN) preferredVoiceEN.current = voiceEN.identifier;
        };

        await loadVoices();

        audioService.setOnAudioData((data) => {
          if (data[0] !== undefined) {
            const level = data[0];
            setAudioLevel(Math.min(level * 100, 100));

            // Actualizar Noise Floor dinámicamente
            if (!voiceDetectedRef.current && !isSpeakingRef.current) {
              noiseFloorRef.current = noiseFloorRef.current * 0.98 + level * 0.02;
              const newThreshold = Math.max(0.010, noiseFloorRef.current * 2.5);
              dynamicThresholdRef.current = newThreshold;
              setVisualThreshold(newThreshold);
            }

            // DETECCIÓN DE INTERRUPCIÓN (Barge-in)
            if (isSpeakingRef.current && level > (dynamicThresholdRef.current * 3.8)) {
              console.log('🛑 Interrupción detectada!');
              stopTTS();
              voiceDetectedRef.current = true;
              resetSilenceTimer();
            }

            // DETECCIÓN DE VOZ NORMAL
            if (listeningRef.current && !isSpeakingRef.current) {
              if (level > dynamicThresholdRef.current) {
                if (!voiceDetectedRef.current) {
                  voiceDetectedRef.current = true;
                }
                resetSilenceTimer();
              }
            }
          }
        });
        console.log('✅ Audio system ready');
      } catch (error) {
        console.error('Error inicializando audio:', error);
      }
    };

    initAudio();
    return () => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
  }, []); // Sin dependencias para que el listener sea persistente

  const resetSilenceTimer = () => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    
    silenceTimeoutRef.current = setTimeout(() => {
      if (listeningRef.current && voiceDetectedRef.current) {
        console.log('⏱️ Pausa de 1.5s detectada. Procesando...');
        stopListening();
      }
    }, SILENCE_DURATION);
  };

  const startListening = async () => {
    try {
      if (isJarvisSpeaking) return; // No escuchar mientras Jarvis habla

      setIsListening(true);
      listeningRef.current = true;
      voiceDetectedRef.current = false;
      setTranscript('');
      
      await audioService.startRecording();
      console.log('🎤 Escuchando...');

      // Timer de seguridad: si no habla en 10s, cerramos para no gastar batería
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = setTimeout(() => {
        if (listeningRef.current && !voiceDetectedRef.current) {
          console.log('💤 No se detectó voz en 10s, deteniendo...');
          stopListening();
        }
      }, 10000);

    } catch (error) {
      console.error('Error iniciando escucha:', error);
      setIsListening(false);
      listeningRef.current = false;
    }
  };

  const stopTTS = async () => {
    try {
      await Speech.stop();
      setIsJarvisSpeaking(false);
      isSpeakingRef.current = false;
      console.log('🛑 Jarvis silenciado manualmente');
    } catch (error) {
      console.error('Error deteniendo TTS:', error);
    }
  };

  const stopListening = async (isManual = false) => {
    try {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      
      setIsListening(false);
      listeningRef.current = false;
      
      const audioUri = await audioService.stopRecording();
      
      // Si fue manual, no procesamos ni seguimos el bucle
      if (isManual) {
        console.log('⏹️ Escucha detenida manualmente por el usuario');
        return;
      }

      if (audioUri) {
        await processAudio(audioUri);
      }
    } catch (error) {
      console.error('Error deteniendo escucha:', error);
    }
  };

  const processAudio = async (audioUri: string) => {
    try {
      setIsProcessing(true);
      console.log('🔄 Procesando audio...');

      // Transcribir
      const whisperResult = await whisperService.transcribeAudio(audioUri);
      const text = whisperResult.text || '';
      
      // DETECCIÓN DE WAKE WORD "JARVIS"
      // Si el interruptor maestro está en ON, NO necesitamos decir "Jarvis"
      const hasWakeWord = text.toLowerCase().includes('jarvis');
      const isCallInProgress = isCallActiveRef.current; 

      if (!hasWakeWord && !isCallInProgress) {
        console.log('🔇 No se mencionó "Jarvis" y el Modo Seguridad está OFF. Ignorando...');
        startListening();
        return;
      }

      setTranscript(text);

      // Procesar mensaje
      await handleUserMessage(text);

      // ¡IMPORTANTE! Re-activamos la escucha DESPUÉS de procesar
      // para asegurar que los estados de "Llamada Activa" se hayan actualizado
      startListening();
    } catch (error) {
      console.error('Error procesando audio:', error);
      startListening();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMediaRequest = async (userMessage: string) => {
    const musicKeywords = [
      'música',
      'musica',
      'canción',
      'cancion',
      'song',
      'music',
    ];
    const podcastKeywords = [
      'podcast',
      'podcasts',
      'episode',
      'episodio',
      'show',
    ];

    const isMusic = musicKeywords.some(keyword =>
      userMessage.toLowerCase().includes(keyword)
    );
    const isPodcast = podcastKeywords.some(keyword =>
      userMessage.toLowerCase().includes(keyword)
    );

    if (!isMusic && !isPodcast) {
      return null;
    }

    try {
      console.log('🎬 Solicitud de media YouTube detectada');
      setIsProcessing(true);

      // Extraer la búsqueda real quitando palabras como "pon", "busca", "reproduce"
      let searchQuery = userMessage
        .toLowerCase()
        .replace(/jarvis/g, '')
        .replace(/ponme/g, '')
        .replace(/pon/g, '')
        .replace(/reproduce/g, '')
        .replace(/busca/g, '')
        .replace(/escuchar/g, '')
        .replace(/quiero/g, '')
        .replace(/una/g, '')
        .replace(/un/g, '')
        .replace(/música/g, '')
        .replace(/musica/g, '')
        .replace(/podcast/g, '')
        .replace(/canción/g, '')
        .replace(/cancion/g, '')
        .trim();

      // Si no quedó nada después de limpiar, usar un término por defecto
      if (!searchQuery) {
        searchQuery = isPodcast ? 'english learning podcast' : 'english music hits';
      }

      console.log(`🔍 Buscando en YouTube: "${searchQuery}"`);

      let result = null;

      if (isPodcast) {
        result = await youtubeClientService.searchPodcast(searchQuery);
      } else if (isMusic) {
        result = await youtubeClientService.searchMusic(searchQuery);
      }

      if (result) {
        // Abrir en YouTube
        await youtubeClientService.openInYouTube(result.url);

        const message =
          result.type === 'podcast'
            ? `Te estoy abriendo "${result.name}" en YouTube`
            : `Te estoy poniendo "${result.name}" en YouTube`;

        // COMENTADO TEMPORALMENTE PARA PRUEBAS RÁPIDAS
        /*
        setJarvisResponse(message);
        setIsJarvisSpeaking(true);
        await speakResponse(message);
        setIsJarvisSpeaking(false);
        */

        // Mostrar respuesta visual brevemente
        setJarvisResponse(message);

        return {
          type: result.type as 'music' | 'podcast',
          title: result.name,
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Error procesando solicitud de media:', error);
      setJarvisResponse('Error al buscar en YouTube. Intenta de nuevo.');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUserMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return;

    // PRIMERO: Verificar si es solicitud de llamada segura
    const callHandled = await handleSecureCall(userMessage, setJarvisResponse, speakResponse);
    if (callHandled) return;

    // SEGUNDO: Verificar si es solicitud de media (DESACTIVADO: Ahora lo maneja Grok de forma inteligente)
    // const mediaResult = await handleMediaRequest(userMessage);
    /*
    if (mediaResult) {
      // Si fue una solicitud de media, responder apropiadamente
      const response = mediaResult.type === 'podcast'
        ? `Te estoy abriendo el podcast ${mediaResult.title} en Spotify`
        : `Te estoy poniendo ${mediaResult.title} en Spotify`;

      setJarvisResponse(response);
      return;
    }
    */

    // SI NO: Proceder con conversación normal
    const updatedHistory: ConversationMessage[] = [
      ...conversationHistory,
      {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      },
    ];
    setConversationHistory(updatedHistory);

    try {
      // Obtener respuesta de Grok
      let response = await grokService.chat(
        userMessage,
        updatedHistory.map(m => ({ role: m.role, content: m.content }))
      );

      // EXTRAER COMANDO DE YOUTUBE (NUEVA LÓGICA INTELIGENTE)
      const youtubeMusicMatch = response.match(/\[YOUTUBE_MUSIC:(.+?)\]/);
      const youtubePodcastMatch = response.match(/\[YOUTUBE_PODCAST:(.+?)\]/);
      
      let youtubeQuery: string | null = null;
      let isPodcastSearch = false;

      if (youtubeMusicMatch) {
        youtubeQuery = youtubeMusicMatch[1];
        response = response.replace(/\[YOUTUBE_MUSIC:.+?\]/g, '').trim();
      } else if (youtubePodcastMatch) {
        youtubeQuery = youtubePodcastMatch[1];
        isPodcastSearch = true;
        response = response.replace(/\[YOUTUBE_PODCAST:.+?\]/g, '').trim();
      }

      // EXTRAER COMANDO DE SPOTIFY API (Retrocompatibilidad)
      const spotifyMatch = response.match(/\[SPOTIFY_SEARCH:(.+?)\]/);
      let spotifyQuery: string | null = null;
      if (spotifyMatch) {
        spotifyQuery = spotifyMatch[1];
        console.log('🎵 API Spotify Intent Detectado:', spotifyQuery);
        response = response.replace(/\[SPOTIFY_SEARCH:.+?\]/g, '').trim();
      }

      setJarvisResponse(response);
      setConversationHistory(prev => [...prev, { role: 'assistant', content: response, timestamp: new Date().toISOString() }]);

      // Ejecutar búsqueda de YouTube si se detectó el comando inteligente
      if (youtubeQuery) {
        console.log(`🤖 Jarvis Inteligente: Buscando ${isPodcastSearch ? 'podcast' : 'música'}: ${youtubeQuery}`);
        if (isPodcastSearch) {
          youtubeClientService.searchPodcast(youtubeQuery).then(result => {
            if (result) youtubeClientService.openInYouTube(result.url);
          });
        } else {
          youtubeClientService.searchMusic(youtubeQuery).then(result => {
            if (result) youtubeClientService.openInYouTube(result.url);
          });
        }
      }

      // Reproducir respuesta
      await speakResponse(response, spotifyQuery);
    } catch (error) {
      console.error('Error obteniendo respuesta:', error);
      setIsProcessing(false);
    }
  };

  const speakResponse = async (text: string, spotifyQuery: string | null = null) => {
    try {
      setIsJarvisSpeaking(true);
      isSpeakingRef.current = true;
      
      const spanishChars = /[áéíóúñ¿¡]/i;
      const commonSpanishWords = /\b(el|la|los|las|que|es|un|una|con|por|para|esta|como)\b/i;
      const isSpanish = spanishChars.test(text) || commonSpanishWords.test(text);
      
      const languageCode = isSpanish ? 'es-CO' : 'en-US';
      const voiceId = isSpanish ? preferredVoiceES.current : preferredVoiceEN.current;
      
      await Speech.speak(text, {
        language: languageCode,
        voice: voiceId,
        rate: 0.95, 
        pitch: 1.05,
        onDone: async () => {
          setIsJarvisSpeaking(false);
          isSpeakingRef.current = false;
          // EJECUTAR REPRODUCCIÓN POR API
          if (spotifyQuery) {
            console.log('🚀 Jarvis contactando a Spotify API...');
            await spotifyService.playSearch(spotifyQuery);
          }
        },
        onError: () => {
          setIsJarvisSpeaking(false);
          isSpeakingRef.current = false;
        },
      });
    } catch (error) {
      console.error('Error en speakResponse:', error);
      setIsJarvisSpeaking(false);
      isSpeakingRef.current = false;
    }
  };

  return {
    isListening,
    isProcessing,
    isJarvisSpeaking,
    transcript,
    jarvisResponse,
    conversationHistory,
    audioLevel,
    currentMedia,
    startListening,
    stopListening,
    stopTTS,
    setCurrentMedia,
    handleUserMessage,
  };
}
