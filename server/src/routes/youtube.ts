import express, { Router, Request, Response } from 'express';
import { youtubeService } from '../services/youtubeService';

const router = Router();

// Endpoint: Buscar música
router.get('/api/youtube/search-music', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || 'english music';
    const result = await youtubeService.searchMusic(query);

    res.json({
      success: true,
      type: 'music',
      result: {
        type: 'music',
        name: result.title,
        channel: result.channelTitle,
        url: result.url,
        thumbnail: result.thumbnail,
      },
    });
  } catch (error) {
    console.error('Error en endpoint de música:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search music on YouTube',
    });
  }
});

// Endpoint: Buscar podcast
router.get('/api/youtube/search-podcast', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || 'english learning podcast';
    const result = await youtubeService.searchPodcast(query);

    res.json({
      success: true,
      type: 'podcast',
      result: {
        type: 'podcast',
        name: result.title,
        channel: result.channelTitle,
        url: result.url,
        thumbnail: result.thumbnail,
      },
    });
  } catch (error) {
    console.error('Error en endpoint de podcast:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search podcast on YouTube',
    });
  }
});

// Endpoint: Buscar lección
router.get('/api/youtube/search-lesson', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || 'english lesson';
    const result = await youtubeService.searchLesson(query);

    res.json({
      success: true,
      type: 'lesson',
      result: {
        type: 'lesson',
        name: result.title,
        channel: result.channelTitle,
        url: result.url,
        thumbnail: result.thumbnail,
      },
    });
  } catch (error) {
    console.error('Error en endpoint de lección:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search lesson on YouTube',
    });
  }
});

export default router;
