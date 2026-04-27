import express, { Request, Response } from 'express';
import { callGroqAI } from '../services/ai.service';
import { generateJarvisSystemPrompt } from '../prompts/jarvis.system-prompt';
import { authenticateToken } from '../middleware/auth';
import { db } from '../config/database';

const router = express.Router();

interface ChatRequest {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

interface ChatResponse {
  response: string;
  timestamp: string;
}

router.post(
  '/chat',
  authenticateToken,
  async (req: Request, res: Response) => {
    console.log('>>> Received /api/ai/chat request');
    try {
      const { message, conversationHistory = [] } = req.body as ChatRequest;
      console.log('User message:', message);
      const userId = (req as any).userId;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Obtener información del usuario con manejo de errores si la BD no está conectada
      let user = { name: 'Carlos', level: 'Intermediate' };
      try {
        const userQuery = await db.query(
          'SELECT name, level FROM users WHERE id = $1',
          [userId]
        );
        if (userQuery.rows[0]) {
          user = userQuery.rows[0];
        }
      } catch (err) {
        console.warn('Database connection failed, using default user profile.');
      }

      // Obtener palabras del día con manejo de errores
      let todaysWords = [];
      try {
        const todayQuery = await db.query(
          `SELECT words FROM daily_lessons 
           WHERE user_id = $1 AND date = CURRENT_DATE`,
          [userId]
        );
        todaysWords = todayQuery.rows[0]?.words || [];
      } catch (err) {
        console.warn('Could not fetch daily words from DB.');
      }

      // Obtener palabras para repasar con manejo de errores
      let wordsToReview = [];
      try {
        const reviewQuery = await db.query(
          `SELECT w.english FROM user_word_progress uwp
           JOIN words w ON uwp.word_id = w.id
           WHERE uwp.user_id = $1 AND uwp.mastered = false
           LIMIT 5`,
          [userId]
        );
        wordsToReview = reviewQuery.rows.map((row: any) => row.english);
      } catch (err) {
        console.warn('Could not fetch review words from DB.');
      }

      // Generar system prompt personalizado
      const systemPrompt = generateJarvisSystemPrompt(
        user.name,
        user.level,
        todaysWords.map((w: any) => w.english || w),
        wordsToReview
      );

      // Llamar a Groq (ultra rápido)
      const jarvisResponse = await callGroqAI(
        message,
        conversationHistory,
        systemPrompt
      );

      // Guardar en BD (opcional - para historial)
      try {
        await db.query(
          `INSERT INTO conversation_logs (user_id, user_message, jarvis_response, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [userId, message, jarvisResponse]
        );
      } catch (dbErr: any) {
        console.warn('Could not log conversation to DB (is the table created?):', dbErr.message);
      }

      return res.json({
        response: jarvisResponse,
        timestamp: new Date().toISOString(),
      } as ChatResponse);
    } catch (error) {
      console.error('Chat error:', error);
      return res.status(500).json({
        error: 'Failed to generate response',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export default router;
