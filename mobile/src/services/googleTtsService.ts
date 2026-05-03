import * as FileSystem from 'expo-file-system';

// CONFIGURACIÓN DE GOOGLE CLOUD (Reemplaza con tu API Key)
const GOOGLE_API_KEY = 'TU_GOOGLE_API_KEY';
const VOICE_NAME = 'es-CO-Wavenet-A'; // Voz colombiana de alta calidad (Wavenet)

export const googleTtsService = {
  async textToSpeech(text: string): Promise<string | null> {
    if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'TU_GOOGLE_API_KEY') {
      return null;
    }

    try {
      console.log('☁️ Conectando con Google Cloud TTS (Colombia)...');
      
      const endpoint = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text: text },
          voice: {
            languageCode: 'es-CO',
            name: VOICE_NAME,
          },
          audioConfig: {
            audioEncoding: 'MP3',
            pitch: 0,
            speakingRate: 1,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error Google TTS:', response.status, errorData);
        return null;
      }

      const data = await response.json();
      const audioContent = data.audioContent; // Google ya devuelve Base64
      
      const fileUri = `${FileSystem.cacheDirectory}jarvis_google_voice.mp3`;
      
      await FileSystem.writeAsStringAsync(fileUri, audioContent, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('✅ Voz colombiana generada con Google Cloud');
      return fileUri;
    } catch (error) {
      console.error('❌ Error fatal en Google TTS:', error);
      return null;
    }
  },
};
