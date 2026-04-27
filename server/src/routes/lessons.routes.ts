import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getTodayLesson, generateDailyLesson } from '../services/daily-lesson.service';
import { db } from '../config/database';

const router = express.Router();

// GET /api/lessons/today
router.get('/today', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const lesson = await getTodayLesson(userId);
    res.json(lesson);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch today\'s lesson' });
  }
});

// POST /api/lessons/complete
router.post('/complete', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { lessonId, wordsAttempted, sentencesFormed, completionTime } = req.body;

    const wordsCorrect = wordsAttempted.filter((w: any) => w.correct).length;
    const wordsTotal = wordsAttempted.length;
    const score = Math.round((wordsCorrect / wordsTotal) * 100);

    // Actualizar lección
    await db.query(
      `UPDATE daily_lessons 
       SET completed = true, score = $1, duration_minutes = $2
       WHERE id = $3 AND user_id = $4`,
      [score, Math.round(completionTime / 60), lessonId, userId]
    );

    // Actualizar progreso de palabras individualmente
    for (const attempt of wordsAttempted) {
      await db.query(
        `INSERT INTO user_word_progress (user_id, word_id, times_practiced, times_correct, mastered, last_practiced)
         VALUES ($1, $2, 1, $3, $4, NOW())
         ON CONFLICT (user_id, word_id) DO UPDATE SET
         times_practiced = user_word_progress.times_practiced + 1,
         times_correct = user_word_progress.times_correct + $3,
         mastered = CASE WHEN (user_word_progress.times_correct + $3) >= 5 THEN true ELSE false END,
         last_practiced = NOW()`,
        [userId, attempt.wordId, attempt.correct ? 1 : 0, false]
      );
    }

    res.json({
      lessonId,
      date: new Date().toISOString().split('T')[0],
      wordsCorrect,
      wordsTotal,
      score,
      completionTime,
      feedback: {
        strengths: ["Great job completing today's challenge!"],
        areasToImprove: score < 80 ? ["Focus on pronunciation in the next session"] : ["Excellent! You are ready for more complex words"],
        wordsToReview: wordsAttempted.filter((w: any) => !w.correct).map((w: any) => w.wordId)
      }
    });
  } catch (error) {
    console.error('Complete lesson error:', error);
    res.status(500).json({ error: 'Failed to complete lesson' });
  }
});

// GET /api/lessons/history
router.get('/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    const history = await db.query(
      `SELECT id as "lessonId", date, score, duration_minutes as "completionTime"
       FROM daily_lessons
       WHERE user_id = $1 AND completed = true
       ORDER BY date DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const total = await db.query(
      'SELECT COUNT(*) FROM daily_lessons WHERE user_id = $1 AND completed = true',
      [userId]
    );

    res.json({
      lessons: history.rows,
      total: parseInt(total.rows[0].count),
      limit,
      offset
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
