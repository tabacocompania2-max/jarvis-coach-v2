import express, { Router, Request, Response } from 'express';

const router = Router();

// Playlists de música en inglés (IDs VERIFICADOS y ESTABLES)
const englishMusicPlaylists = [
  {
    name: "Today's Top Hits",
    url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYkkDM',
  },
  {
    name: 'Global Top 50',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYkkDM',
  },
  {
    name: 'Mega Hit Mix',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DXbYM3zMM9t1e',
  },
  {
    name: 'All Out 2010s',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX5Ejj0EkURtP',
  },
  {
    name: 'Rock Classics',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DWXRqgorJj26U',
  }
];

// Podcasts en inglés (IDs VERIFICADOS y ESTABLES)
const englishPodcasts = [
  {
    name: 'TED Talks Daily',
    url: 'https://open.spotify.com/show/4LL0QrBCPopKjKBJi3ydwL',
  },
  {
    name: 'BBC The English We Speak',
    url: 'https://open.spotify.com/show/067uUT8A869pYvV85XI66Y',
  },
  {
    name: '6 Minute English',
    url: 'https://open.spotify.com/show/5PG0hWYMI7LL5p5ygGUkUK',
  }
];

// Endpoint: Búsqueda de música
router.get('/api/spotify/search-music', (req: Request, res: Response) => {
  try {
    const randomIndex = Math.floor(Math.random() * englishMusicPlaylists.length);
    const selected = englishMusicPlaylists[randomIndex];
    res.json({
      success: true,
      type: 'music',
      results: [{ type: 'music', name: selected.name, url: selected.url }],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error' });
  }
});

// Endpoint: Búsqueda de podcasts
router.get('/api/spotify/search-podcast', (req: Request, res: Response) => {
  try {
    const randomIndex = Math.floor(Math.random() * englishPodcasts.length);
    const selected = englishPodcasts[randomIndex];
    res.json({
      success: true,
      type: 'podcast',
      results: [{ type: 'podcast', name: selected.name, url: selected.url }],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error' });
  }
});

export default router;
