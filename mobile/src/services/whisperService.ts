import axios from 'axios';
import * as FileSystem from 'expo-file-system/legacy';

class WhisperService {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    // Usaremos la API de Groq para Whisper porque es gratuita y más rápida
    this.apiKey = process.env.EXPO_PUBLIC_GROK_API_KEY || '';
    this.apiUrl = 'https://api.groq.com/openai/v1/audio/transcriptions';
  }

  async transcribeAudio(fileUri: string): Promise<{ text: string }> {
    try {
      console.log('🎤 Transcribiendo con Groq Whisper...');

      // 1. Leer archivo
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('Archivo de audio no encontrado');
      }

      // 2. Preparar FormData para la API de Groq (compatible con OpenAI)
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: 'recording.wav',
        type: 'audio/wav',
      } as any);
      formData.append('model', 'whisper-large-v3');
      // Eliminamos el hardcode de 'en' para permitir auto-detección de idioma (Español/Inglés)

      // 3. Petición a Groq
      const response = await axios.post(this.apiUrl, formData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      console.log('✅ Transcripción exitosa:', response.data.text);
      return { text: response.data.text };
    } catch (error: any) {
      console.error('❌ Error transcribiendo con Groq Whisper:', error.response?.data || error.message);
      throw error;
    }
  }
}

export const whisperService = new WhisperService();
