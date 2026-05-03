import axios from 'axios';
import { Linking } from 'react-native';

interface YouTubeSearchResult {
  type: 'music' | 'podcast';
  name: string;
  channel: string;
  url: string;
  thumbnail: string;
}

class YouTubeClientService {
  private apiUrl = process.env.EXPO_PUBLIC_API_URL || '';

  async searchMusic(query: string = 'english music'): Promise<YouTubeSearchResult | null> {
    try {
      console.log('🎵 Buscando música en YouTube desde Railway...');

      const response = await axios.get(
        `${this.apiUrl}/api/youtube/search-music`,
        {
          params: {
            q: query,
          },
          timeout: 10000,
        }
      );

      const result = response.data.result;

      if (result) {
        console.log('✅ Música encontrada:', result.name);
        return result;
      }

      return null;
    } catch (error) {
      console.error('❌ Error buscando música:', error);
      throw error;
    }
  }

  async searchPodcast(query: string = 'english learning'): Promise<YouTubeSearchResult | null> {
    try {
      console.log('📻 Buscando podcast en YouTube desde Railway...');

      const response = await axios.get(
        `${this.apiUrl}/api/youtube/search-podcast`,
        {
          params: {
            q: query,
          },
          timeout: 10000,
        }
      );

      const result = response.data.result;

      if (result) {
        console.log('✅ Podcast encontrado:', result.name);
        return result;
      }

      return null;
    } catch (error) {
      console.error('❌ Error buscando podcast:', error);
      throw error;
    }
  }

  async openInYouTube(url: string): Promise<void> {
    try {
      console.log('🔗 Intentando abrir YouTube de forma agresiva:', url);
      
      // Extraer el ID del video
      const videoIdMatch = url.match(/(?:v=|\/embed\/|shorts\/|youtu\.be\/)([^?&]+)/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;

      if (videoId) {
        // Esquemas nativos que suelen forzar el "Play" mejor que una URL web
        const androidScheme = `vnd.youtube:${videoId}`;
        const iosScheme = `youtube://watch?v=${videoId}`;
        
        const canOpenAndroid = await Linking.canOpenURL(androidScheme);
        if (canOpenAndroid) {
          console.log('🤖 Abriendo via Android Deep Link');
          await Linking.openURL(`${androidScheme}?autoplay=1&t=0s`);
          return;
        }

        const canOpenIos = await Linking.canOpenURL(iosScheme);
        if (canOpenIos) {
          console.log('🍎 Abriendo via iOS Deep Link');
          await Linking.openURL(`${iosScheme}&autoplay=1`);
          return;
        }
      }

      // Fallback a URL normal con autoplay
      const autoplayUrl = url.includes('?') ? `${url}&autoplay=1` : `${url}?autoplay=1`;
      console.log('🌐 Usando fallback URL:', autoplayUrl);
      await Linking.openURL(autoplayUrl);
      
    } catch (error) {
      console.error('❌ Error abriendo YouTube:', error);
      // Último intento con la URL original si todo falla
      await Linking.openURL(url);
    }
  }
}

export const youtubeClientService = new YouTubeClientService();
