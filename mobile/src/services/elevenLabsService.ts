import * as FileSystem from 'expo-file-system';

// CONFIGURACIÓN DE ELEVENLABS
const API_KEY = 'sk_7c555891aa493d2a9853acc87ef6e0a0a659cbef9d2e5dc3'.trim();
const VOICE_ID = 'b2htR0pMe28pYwCY9gnP'; // Voz de Medellín

export const elevenLabsService = {
  async textToSpeech(text: string): Promise<string | null> {
    if (!API_KEY) return null;

    try {
      console.log('💎 Intentando ElevenLabs (Voz de Medellín)...');
      
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': API_KEY,
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (response.status === 401) {
        console.error('❌ Error 401: La API Key sigue siendo rechazada o bloqueada por actividad inusual.');
        return null;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error ElevenLabs:', response.status, errorText);
        return null;
      }

      const blob = await response.blob();
      const fileUri = `${FileSystem.cacheDirectory}jarvis_eleven_voice.mp3`;
      
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

      console.log('✅ Voz humana generada con éxito');
      return fileUri;
    } catch (error) {
      console.error('❌ Error fatal en ElevenLabs:', error);
      return null;
    }
  },
};
