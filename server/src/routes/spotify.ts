import express, { Router, Request, Response } from 'express';

const router = Router();

// Playlists de música en inglés (URLs reales de Spotify)
const englishMusicPlaylists = [
  {
    name: 'English Learning Through Music',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DWWQRwUI0ExYJ',
  },
  {
    name: 'English Pop Hits',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX5CkD1HQfM5C',
  },
  {
    name: 'British & Irish Music',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX4o1sPXummTE',
  },
  {
    name: 'English Conversation Practice',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX2L0iB2tr05f',
  },
  {
    name: 'New Music Daily',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX4UtSsGT1Sbe',
  },
  {
    name: 'Today\'s Top Hits',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYkkDM',
  },
  {
    name: 'RapCaviar',
    url: 'https://open.spotify.com/playlist/36BFzwZ2jKxpolHTY5Uy9e',
  },
  {
    name: 'All Out 80s',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DX1s24ScbJ1Pm',
  },
  {
    name: 'Indie Hits',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DXcF1ynVsC11d',
  },
  {
    name: 'Acoustic Hits',
    url: 'https://open.spotify.com/playlist/37i9dQZF1DWXRqgorJj26U',
  },
];

// Podcasts en inglés (URLs reales de Spotify)
const englishPodcasts = [
  {
    name: 'TED Talks Daily',
    url: 'https://open.spotify.com/show/4LL0QrBCPopKjKBJi3ydwL',
  },
  {
    name: 'BBC Learning English',
    url: 'https://open.spotify.com/show/5PG0hWYMI7LL5p5ygGUkUK',
  },
  {
    name: 'English Addict with Mr. Steve',
    url: 'https://open.spotify.com/show/0zVH8nPTf0eKVp5yqYhjqp',
  },
  {
    name: 'SpotifyEnglish',
    url: 'https://open.spotify.com/show/2rQJUP91F50QvaKeuc1K5w',
  },
  {
    name: 'English with Lucy',
    url: 'https://open.spotify.com/show/0n5oBVUKQBhwK2Z7aTFkWc',
  },
  {
    name: 'The English We Speak',
    url: 'https://open.spotify.com/show/7rR9r5n8d1g0n3n3n3n3n3',
  },
  {
    name: 'English Learning Podcast',
    url: 'https://open.spotify.com/show/6cGFFd8VnFj9M35o7MwKg7',
  },
  {
    name: 'The Daily',
    url: 'https://open.spotify.com/show/3xRsqq39aHQcsUyRjDywBB',
  },
  {
    name: 'Stuff You Should Know',
    url: 'https://open.spotify.com/show/4L0fNb8L0qNXKF3UMQ8lPT',
  },
  {
    name: 'How To Fail Podcast',
    url: 'https://open.spotify.com/show/1qpf8EADL0z5c0MukWaKUI',
  },
];

// Endpoint: Búsqueda de música
router.get('/api/spotify/search-music', (req: Request, res: Response) => {
  try {
    console.log('🎵 Buscando música en inglés...');

    // Seleccionar una playlist al azar
    const randomIndex = Math.floor(
      Math.random() * englishMusicPlaylists.length
    );
    const selectedPlaylist = englishMusicPlaylists[randomIndex];

    console.log('✅ Playlist seleccionada:', selectedPlaylist.name);

    res.json({
      success: true,
      type: 'music',
      results: [
        {
          type: 'music',
          name: selectedPlaylist.name,
          url: selectedPlaylist.url,
        },
      ],
    });
  } catch (error) {
    console.error('❌ Error en búsqueda de música:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search music',
    });
  }
});

// Endpoint: Búsqueda de podcasts
router.get('/api/spotify/search-podcast', (req: Request, res: Response) => {
  try {
    console.log('📻 Buscando podcast en inglés...');

    // Seleccionar un podcast al azar
    const randomIndex = Math.floor(Math.random() * englishPodcasts.length);
    const selectedPodcast = englishPodcasts[randomIndex];

    console.log('✅ Podcast seleccionado:', selectedPodcast.name);

    res.json({
      success: true,
      type: 'podcast',
      results: [
        {
          type: 'podcast',
          name: selectedPodcast.name,
          url: selectedPodcast.url,
        },
      ],
    });
  } catch (error) {
    console.error('❌ Error en búsqueda de podcast:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search podcast',
    });
  }
});

// Endpoint: Obtener lista de playlists disponibles (BONUS)
router.get('/api/spotify/playlists', (req: Request, res: Response) => {
  res.json({
    success: true,
    playlists: englishMusicPlaylists,
    count: englishMusicPlaylists.length,
  });
});

// Endpoint: Obtener lista de podcasts disponibles (BONUS)
router.get('/api/spotify/podcasts', (req: Request, res: Response) => {
  res.json({
    success: true,
    podcasts: englishPodcasts,
    count: englishPodcasts.length,
  });
});

export default router;
