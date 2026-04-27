import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { db } from '../config/database';

const router = express.Router();

// GET /api/user/stats
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const userQuery = await db.query(
      'SELECT total_words_learned, daily_streak, level FROM users WHERE id = $1',
      [userId]
    );
    
    const lessonsQuery = await db.query(
      'SELECT COUNT(*) as count, AVG(score) as avg_score, SUM(duration_minutes) as total_minutes FROM daily_lessons WHERE user_id = $1 AND completed = true',
      [userId]
    );

    const stats = {
      palabras_totales: userQuery.rows[0]?.total_words_learned || 0,
      dias_racha: userQuery.rows[0]?.daily_streak || 0,
      tiempo_total_horas: Math.round((lessonsQuery.rows[0]?.total_minutes || 0) / 60),
      tasa_retencion: 92, // Placeholder for now
      promedio_score: Math.round(lessonsQuery.rows[0]?.avg_score || 0),
      sesiones_completadas: parseInt(lessonsQuery.rows[0]?.count || '0'),
      nivel_actual: userQuery.rows[0]?.level || 'beginner'
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// GET /api/analytics/weekly
router.get('/weekly', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const weeklyData = await db.query(
      `SELECT date, SUM(score)/COUNT(*) as score 
       FROM daily_lessons 
       WHERE user_id = $1 AND date > CURRENT_DATE - INTERVAL '7 days'
       GROUP BY date ORDER BY date ASC`,
      [userId]
    );
    
    // Transform data for chart
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const formattedData = weeklyData.rows.map(row => ({
      day: days[new Date(row.date).getDay()],
      score: Math.round(row.score)
    }));

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weekly analytics' });
  }
});

// GET /api/analytics/categories
router.get('/categories', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const categoriesData = await db.query(
      `SELECT w.category, COUNT(*) as count 
       FROM user_word_progress uwp
       JOIN words w ON uwp.word_id = w.id
       WHERE uwp.user_id = $1 AND uwp.mastered = true
       GROUP BY w.category`,
      [userId]
    );

    const total = categoriesData.rows.reduce((acc, row) => acc + parseInt(row.count), 0);
    const formattedData = categoriesData.rows.map(row => ({
      name: row.category,
      value: parseInt(row.count),
      percentage: Math.round((parseInt(row.count) / total) * 100)
    }));

    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch category analytics' });
  }
});

// GET /api/user/achievements
router.get('/achievements', authenticateToken, async (req: Request, res: Response) => {
  // Placeholder achievements
  const achievements = [
    { name: "100 palabras aprendidas", unlocked: true, progress: 100 },
    { name: "7 días en racha", unlocked: true, progress: 100 },
    { name: "85% de retención", unlocked: false, progress: 80 }
  ];
  res.json(achievements);
});

// GET /api/analytics/pronunciation
router.get('/pronunciation', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const pronQuery = await db.query(
      'SELECT AVG(pronunciation_score) as avg_score FROM voice_recordings WHERE user_id = $1',
      [userId]
    );
    
    res.json({
      accuracy_average: Math.round(pronQuery.rows[0]?.avg_score || 0),
      improvements: "Better intonation on vowels",
      weak_areas: "Consonant clusters"
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pronunciation stats' });
  }
});

export default router;
