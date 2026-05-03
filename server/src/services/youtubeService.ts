import axios from 'axios';
import { rankYouTubeResults } from './ai.service';

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

  // Buscar música en YouTube con ranking por IA
  async searchMusic(query: string = 'english music'): Promise<YouTubeSearchResult> {
    try {
      console.log('🎵 Buscando música en YouTube:', query);

      const response = await axios.get(this.apiUrl, {
        params: {
          part: 'snippet',
          q: `${query} official audio music`,
          type: 'video',
          maxResults: 5,
          videoCategoryId: '10', // Música
          order: 'relevance',
          key: this.apiKey,
        },
        timeout: 10000,
      });

      const items = response.data.items;
      if (!items || items.length === 0) throw new Error('No music found');

      // Ranking por IA
      const candidates = items.map((item: any) => ({
        title: item.snippet.title,
        description: item.snippet.description,
        channelTitle: item.snippet.channelTitle,
      }));

      const bestIndex = await rankYouTubeResults(query, candidates, 'music');
      const video = items[bestIndex] || items[0];

      return {
        id: video.id.videoId,
        title: video.snippet.title,
        channelTitle: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails.default.url,
        url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
      };
    } catch (error) {
      console.error('❌ Error buscando música:', error);
      throw error;
    }
  }

  // Buscar podcasts en YouTube con ranking por IA
  async searchPodcast(query: string = 'english learning podcast'): Promise<YouTubeSearchResult> {
    try {
      console.log('📻 Buscando podcast en YouTube:', query);

      const response = await axios.get(this.apiUrl, {
        params: {
          part: 'snippet',
          q: `${query} podcast episode`,
          type: 'video',
          maxResults: 5,
          order: 'relevance',
          key: this.apiKey,
        },
        timeout: 10000,
      });

      const items = response.data.items;
      if (!items || items.length === 0) throw new Error('No podcast found');

      const candidates = items.map((item: any) => ({
        title: item.snippet.title,
        description: item.snippet.description,
        channelTitle: item.snippet.channelTitle,
      }));

      const bestIndex = await rankYouTubeResults(query, candidates, 'podcast');
      const video = items[bestIndex] || items[0];

      return {
        id: video.id.videoId,
        title: video.snippet.title,
        channelTitle: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails.default.url,
        url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
      };
    } catch (error) {
      console.error('❌ Error buscando podcast:', error);
      throw error;
    }
  }

  // Buscar lecciones educativas con ranking por IA
  async searchLesson(query: string): Promise<YouTubeSearchResult> {
    try {
      console.log('🎓 Buscando lección educativa en YouTube:', query);

      const response = await axios.get(this.apiUrl, {
        params: {
          part: 'snippet',
          q: `${query} english lesson tutorial`,
          type: 'video',
          maxResults: 5,
          videoCategoryId: '27', // Educación
          order: 'relevance',
          key: this.apiKey,
        },
        timeout: 10000,
      });

      const items = response.data.items;
      if (!items || items.length === 0) throw new Error('No lesson found');

      const candidates = items.map((item: any) => ({
        title: item.snippet.title,
        description: item.snippet.description,
        channelTitle: item.snippet.channelTitle,
      }));

      const bestIndex = await rankYouTubeResults(query, candidates, 'lesson');
      const video = items[bestIndex] || items[0];

      return {
        id: video.id.videoId,
        title: video.snippet.title,
        channelTitle: video.snippet.channelTitle,
        thumbnail: video.snippet.thumbnails.default.url,
        url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
      };
    } catch (error) {
      console.error('❌ Error buscando lección:', error);
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
