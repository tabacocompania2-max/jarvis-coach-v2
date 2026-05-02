import express, { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

interface SpotifySearchResult {
  type: 'music' | 'podcast';
  name: string;
  artist?: string;
  publisher?: string;
  url: string;
  spotifyUri: string;
}

// Clase para manejar Spotify
class SpotifyBackend {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpires: number = 0;

  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID || '';
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';

    if (!this.clientId || !this.clientSecret) {
      console.error('⚠️ Spotify credentials missing in environment');
    }
  }

  // Obtener token de acceso
  async getAccessToken(): Promise<string> {
    // Si el token sigue siendo válido, retornarlo
    if (this.accessToken && Date.now() < this.tokenExpires) {
      return this.accessToken;
    }

    try {
      console.log('🔐 Obteniendo token de Spotify desde Railway...');
      
      const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpires = Date.now() + response.data.expires_in * 1000 - 60000;

      if (!this.accessToken) {
        throw new Error('No access token received from Spotify');
      }

      console.log('✅ Token de Spotify obtenido en Railway');
      return this.accessToken;
    } catch (error: any) {
      const errorMsg = error.response?.data?.error_description || error.response?.data?.error || error.message;
      console.error('❌ Error obteniendo token de Spotify:', errorMsg);
      throw new Error(`Spotify Auth Error: ${errorMsg}`);
    }
  }

  // Buscar música en inglés
  async searchMusic(query: string = 'english music'): Promise<SpotifySearchResult[]> {
    try {
      const token = await this.getAccessToken();

      console.log('🔍 Buscando música en Spotify desde Railway...');

      const response = await axios.get('https://api.spotify.com/v1/search', {
        params: {
          q: `${query} language:en`,
          type: 'track',
          limit: 10,
          market: 'US',
        },
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const results = response.data.tracks.items.map((track: any) => ({
        type: 'music' as const,
        name: track.name,
        artist: track.artists[0]?.name,
        url: `https://open.spotify.com/track/${track.id}`,
        spotifyUri: track.uri,
      }));

      console.log(`✅ ${results.length} canciones encontradas`);
      return results;
    } catch (error) {
      console.error('❌ Error buscando música:', error);
      throw error;
    }
  }

  // Buscar podcasts en inglés
  async searchPodcasts(query: string = 'english learning'): Promise<SpotifySearchResult[]> {
    try {
      const token = await this.getAccessToken();

      console.log('🎙️ Buscando podcasts en Spotify desde Railway...');

      const response = await axios.get('https://api.spotify.com/v1/search', {
        params: {
          q: `${query} language:en`,
          type: 'show',
          limit: 10,
          market: 'US',
        },
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const results = response.data.shows.items.map((show: any) => ({
        type: 'podcast' as const,
        name: show.name,
        publisher: show.publisher,
        url: `https://open.spotify.com/show/${show.id}`,
        spotifyUri: show.uri,
      }));

      console.log(`✅ ${results.length} podcasts encontrados`);
      return results;
    } catch (error) {
      console.error('❌ Error buscando podcasts:', error);
      throw error;
    }
  }
}

const spotify = new SpotifyBackend();

// Endpoint: Buscar música
router.get('/api/spotify/search-music', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string || 'english music';
    const results = await spotify.searchMusic(query);

    res.json({
      success: true,
      type: 'music',
      results: results.slice(0, 1), // Devolver solo el primero
    });
  } catch (error: any) {
    const errorMsg = error.message || 'Failed to search music';
    console.error('Error en endpoint music:', errorMsg);
    res.status(500).json({
      success: false,
      error: errorMsg,
    });
  }
});

// Endpoint: Buscar podcasts
router.get('/api/spotify/search-podcast', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string || 'english learning';
    const results = await spotify.searchPodcasts(query);

    res.json({
      success: true,
      type: 'podcast',
      results: results.slice(0, 1), // Devolver solo el primero
    });
  } catch (error: any) {
    const errorMsg = error.message || 'Failed to search podcast';
    console.error('Error en endpoint podcast:', errorMsg);
    res.status(500).json({
      success: false,
      error: errorMsg,
    });
  }
});

export default router;
