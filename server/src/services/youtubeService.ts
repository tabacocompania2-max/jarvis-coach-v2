import axios from 'axios';

interface YouTubeSearchResult {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  url: string;
}

class YouTubeService {
  private apiKey: string;
  private apiUrl = 'https://www.googleapis.com/youtube/v3/search';

  constructor() {
    this.apiKey = process.env.GOOGLE_YOUTUBE_API_KEY || '';

    if (!this.apiKey) {
      console.error('⚠️ YouTube API Key missing in environment');
    }
  }

  // Buscar música en YouTube
  async searchMusic(query: string = 'english music'): Promise<YouTubeSearchResult> {
    try {
      console.log('🎵 Buscando música en YouTube:', query);

      const response = await axios.get(this.apiUrl, {
        params: {
          part: 'snippet',
          q: `${query} music`,
          type: 'video',
          maxResults: 5,
          videoCategoryId: '10', // Música
          order: 'relevance',
          key: this.apiKey,
          relevanceLanguage: 'en',
        },
        timeout: 10000,
      });

      const items = response.data.items;

      if (!items || items.length === 0) {
        throw new Error('No music found');
      }

      // Seleccionar el primer resultado
      const video = items[0];

      const result: YouTubeSearchResult = {
        id: video.id.videoId,
        title: video.snippet.title,
        channelTitle: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails.default.url,
        url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
      };

      console.log('✅ Canción encontrada:', result.title);
      return result;
    } catch (error) {
      console.error('❌ Error buscando música en YouTube:', error);
      throw error;
    }
  }

  // Buscar podcasts en YouTube
  async searchPodcast(query: string = 'english learning podcast'): Promise<YouTubeSearchResult> {
    try {
      console.log('📻 Buscando podcast en YouTube:', query);

      const response = await axios.get(this.apiUrl, {
        params: {
          part: 'snippet',
          q: `${query} english`,
          type: 'video',
          maxResults: 5,
          order: 'relevance',
          key: this.apiKey,
          relevanceLanguage: 'en',
        },
        timeout: 10000,
      });

      const items = response.data.items;

      if (!items || items.length === 0) {
        throw new Error('No podcast found');
      }

      // Seleccionar el primer resultado
      const video = items[0];

      const result: YouTubeSearchResult = {
        id: video.id.videoId,
        title: video.snippet.title,
        channelTitle: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails.default.url,
        url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
      };

      console.log('✅ Podcast encontrado:', result.title);
      return result;
    } catch (error) {
      console.error('❌ Error buscando podcast en YouTube:', error);
      throw error;
    }
  }

  // Generar URL para abrir en YouTube
  generateYouTubeLink(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  // Generar URL para YouTube Shorts (opcional)
  generateYouTubeShortsLink(videoId: string): string {
    return `https://www.youtube.com/shorts/${videoId}`;
  }
}

export const youtubeService = new YouTubeService();
