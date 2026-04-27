import { db } from '../config/database';

interface Word {
  id: string;
  english: string;
  spanish: string;
  pronunciation: string;
  phonetic: string;
  part_of_speech: string;
  difficulty_level: number;
  category: string;
  example_sentences: any[];
}

export async function generateDailyLesson(userId: string) {
  try {
    // 1. Obtener nivel actual del usuario y su progreso reciente
    const userQuery = await db.query(
      'SELECT level, id FROM users WHERE id = $1',
      [userId]
    );
    const user = userQuery.rows[0];
    
    // Mapear nivel de texto a número (1-10)
    const levelMap: Record<string, number> = {
      'beginner': 1,
      'elementary': 3,
      'intermediate': 5,
      'upper-intermediate': 7,
      'advanced': 9
    };
    
    let baseLevel = levelMap[user?.level?.toLowerCase()] || 5;

    // 2. Adaptación de dificultad basada en score promedio (Últimos 7 días)
    const historyQuery = await db.query(
      `SELECT AVG(score) as avg_score FROM daily_lessons 
       WHERE user_id = $1 AND date > CURRENT_DATE - INTERVAL '7 days'`,
      [userId]
    );
    const avgScore = parseFloat(historyQuery.rows[0]?.avg_score || '0');

    if (avgScore >= 85) {
      baseLevel = Math.min(baseLevel + 1, 10);
    } else if (avgScore < 60 && avgScore > 0) {
      baseLevel = Math.max(baseLevel - 1, 1);
    }

    // 3. Seleccionar 20 palabras que no haya aprendido aún
    // Lógica: 15 palabras de su nivel actual/superior + 5 repasos o variadas
    const wordsQuery = await db.query(
      `SELECT * FROM words 
       WHERE id NOT IN (
         SELECT word_id FROM user_word_progress 
         WHERE user_id = $1 AND mastered = true
       )
       AND difficulty_level BETWEEN $2 AND $3
       ORDER BY RANDOM()
       LIMIT 20`,
      [userId, baseLevel, baseLevel + 2]
    );

    const words = wordsQuery.rows;

    // 4. Guardar en tabla daily_lessons
    const lessonInsert = await db.query(
      `INSERT INTO daily_lessons (user_id, date, words, completed)
       VALUES ($1, CURRENT_DATE, $2, false)
       RETURNING *`,
      [userId, JSON.stringify(words)]
    );

    return {
      lessonId: lessonInsert.rows[0].id,
      date: lessonInsert.rows[0].date,
      words: words,
      totalWords: words.length,
      estimatedDuration: 45
    };
  } catch (error) {
    console.error('Error generating daily lesson:', error);
    throw error;
  }
}

export async function getTodayLesson(userId: string) {
  try {
    const todayQuery = await db.query(
      `SELECT * FROM daily_lessons 
       WHERE user_id = $1 AND date = CURRENT_DATE`,
      [userId]
    );

    if (todayQuery.rows.length > 0) {
      const lesson = todayQuery.rows[0];
      return {
        lessonId: lesson.id,
        date: lesson.date,
        words: typeof lesson.words === 'string' ? JSON.parse(lesson.words) : lesson.words,
        totalWords: 20,
        estimatedDuration: 45
      };
    }

    // Si no existe, generar una nueva
    return await generateDailyLesson(userId);
  } catch (error) {
    console.error('Error fetching today lesson:', error);
    throw error;
  }
}
