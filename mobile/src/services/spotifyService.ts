import axios from 'axios';
import { Linking } from 'react-native';

interface SpotifySearchResult {
  type: 'music' | 'podcast';
  name: string;
  artist?: string;
  publisher?: string;
  url: string;
}

class SpotifyService {
  private apiUrl = process.env.EXPO_PUBLIC_API_URL || '';

  async searchMusic(): Promise<SpotifySearchResult | null> {
    try {
      const url = `${this.apiUrl}/api/spotify/search-music`;
      console.log(`🎵 Llamando a Railway (Music): ${url}`);

      const response = await axios.get(
        url,
        {
          params: {
            q: 'english music',
          },
          timeout: 15000, // Aumentado a 15s
        }
      );

      const result = response.data.results?.[0];

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

  async searchPodcast(): Promise<SpotifySearchResult | null> {
    try {
      const url = `${this.apiUrl}/api/spotify/search-podcast`;
      console.log(`📻 Llamando a Railway (Podcast): ${url}`);

      const response = await axios.get(
        url,
        {
          params: {
            q: 'english learning',
          },
          timeout: 15000,
        }
      );

      const result = response.data.results?.[0];

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

  async openInSpotify(url: string): Promise<void> {
    try {
      console.log('🔗 Preparando enlace para Spotify:', url);
      
      // Intentar convertir URL web a URI nativo para forzar reproducción
      // Ejemplo: https://open.spotify.com/playlist/37i9dQZF1DWWQRwUI0ExYJ -> spotify:playlist:37i9dQZF1DWWQRwUI0ExYJ
      let targetUrl = url;
      if (url.includes('open.spotify.com')) {
        const parts = url.split('/');
        let id = parts[parts.length - 1];
        // Limpiar el ID de parámetros como ?si=...
        if (id.includes('?')) {
          id = id.split('?')[0];
        }
        const type = url.includes('playlist') ? 'playlist' : url.includes('show') ? 'show' : 'track';
        targetUrl = `spotify:${type}:${id}`;
      }

      console.log('🚀 Abriendo URI nativo:', targetUrl);
      const canOpen = await Linking.canOpenURL(targetUrl);
      
      if (canOpen) {
        await Linking.openURL(targetUrl);
      } else {
        await Linking.openURL(url); // Fallback a web si no puede abrir el URI
      }
    } catch (error) {
      console.error('❌ Error abriendo Spotify:', error);
      // Fallback final
      await Linking.openURL(url).catch(() => {});
    }
  }

  // Mantener compatibilidad con playSearch si es necesario
  async playSearch(query: string): Promise<void> {
    const isPodcast = query.toLowerCase().includes('podcast') || query.toLowerCase().includes('show');
    let result;
    if (isPodcast) {
      result = await this.searchPodcast();
    } else {
      result = await this.searchMusic();
    }

    if (result) {
      await this.openInSpotify(result.url);
    }
  }
}

export const spotifyService = new SpotifyService();
