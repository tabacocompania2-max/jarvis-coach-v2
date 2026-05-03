import * as FileSystem from 'expo-file-system';

// CONFIGURACIÓN DE AZURE (Reemplaza con tus datos cuando los tengas)
const AZURE_KEY = 'TU_AZURE_API_KEY';
const AZURE_REGION = 'eastus'; // Ejemplo: eastus, westus, brazilsouth
const VOICE_NAME = 'es-CO-SalomeNeural'; // Voz colombiana premium

export const azureSpeechService = {
  async textToSpeech(text: string): Promise<string | null> {
    if (!AZURE_KEY || AZURE_KEY === 'TU_AZURE_API_KEY') {
      return null;
    }

    try {
      console.log('☁️ Conectando con Azure Speech (Colombia)...');
      
      const endpoint = `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`;
      
      // Construcción del SSML (Lenguaje de Marcado de Síntesis de Voz)
      const ssml = `
        <speak version='1.0' xml:lang='es-CO'>
          <voice xml:lang='es-CO' xml:gender='Female' name='${VOICE_NAME}'>
            ${text}
          </voice>
        </speak>
      `;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_KEY,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
          'User-Agent': 'JarvisApp',
        },
        body: ssml,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error Azure Speech:', response.status, errorText);
        return null;
      }

      const blob = await response.blob();
      const fileUri = `${FileSystem.cacheDirectory}jarvis_azure_voice.mp3`;
      
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

      console.log('✅ Voz colombiana generada con Azure');
      return fileUri;
    } catch (error) {
      console.error('❌ Error fatal en Azure Speech:', error);
      return null;
    }
  },
};
