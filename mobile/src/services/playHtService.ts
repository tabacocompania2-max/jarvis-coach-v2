import * as FileSystem from 'expo-file-system';

// CONFIGURACIÓN DE PLAY.HT (Reemplaza con tus datos de la sección API Access)
const PLAYHT_USER_ID = 'TU_USER_ID';
const PLAYHT_API_KEY = 'TU_SECRET_KEY';
const VOICE_ID = 'es-CO-SalomeNeural'; // Una de las mejores voces colombianas

export const playHtService = {
  async textToSpeech(text: string): Promise<string | null> {
    if (!PLAYHT_USER_ID || PLAYHT_USER_ID === 'TU_USER_ID') {
      return null;
    }

    try {
      console.log('🎭 Conectando con Play.ht (Colombia)...');
      
      const response = await fetch('https://api.play.ht/api/v2/tts/stream', {
        method: 'POST',
        headers: {
          'X-User-ID': PLAYHT_USER_ID,
          'Authorization': PLAYHT_API_KEY,
          'Content-Type': 'application/json',
          'accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: text,
          voice: VOICE_ID,
          output_format: 'mp3',
          speed: 1,
          sample_rate: 24000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error Play.ht:', response.status, errorText);
        return null;
      }

      const blob = await response.blob();
      const fileUri = `${FileSystem.cacheDirectory}jarvis_playht_voice.mp3`;
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64data = (reader.result as string).split(',')[1];
          resolve(base64data);
        };
      });
      reader.readAsDataURL(blob);
      const base64 = await base64Promise;

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('✅ Voz colombiana generada con Play.ht');
      return fileUri;
    } catch (error) {
      console.error('❌ Error fatal en Play.ht:', error);
      return null;
    }
  },
};
