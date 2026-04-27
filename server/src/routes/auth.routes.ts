import express, { Request, Response } from 'express';
import { db } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Crear usuario en BD cuando se registra en Firebase
router.post('/register', authenticateToken, async (req: Request, res: Response) => {
  try {
    const firebaseUid = (req as any).firebaseUid;
    const userEmail = (req as any).userEmail;
    const { name } = req.body;

    // Verificar si ya existe
    const existing = await db.query('SELECT id FROM users WHERE firebase_uid = $1', [firebaseUid]);
    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]);
    }

    // Crear usuario en BD con ID automático (UUID)
    const result = await db.query(
      `INSERT INTO users (name, email, firebase_uid, level) 
       VALUES ($1, $2, $3, 'beginner') 
       RETURNING *`,
      [name, userEmail, firebaseUid]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Register user in DB error:', error);
    res.status(500).json({ error: 'Failed to create user in database' });
  }
});

export default router;
