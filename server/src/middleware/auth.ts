import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { db } from '../config/database';

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      // Si no hay token, podemos permitir un usuario de prueba en desarrollo si lo deseas,
      // pero por seguridad ahora requeriremos token real de Firebase.
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const firebaseUid = decodedToken.uid;
    const userEmail = decodedToken.email;

    // Buscar el ID interno (UUID) en nuestra base de datos de Railway
    const userRes = await db.query('SELECT id FROM users WHERE firebase_uid = $1', [firebaseUid]);
    
    if (userRes.rows.length > 0) {
      (req as any).userId = userRes.rows[0].id;
    } else {
      // Si no existe aún en la BD, pasamos el firebase_uid para que el endpoint /register lo use
      (req as any).userId = firebaseUid; 
    }
    
    (req as any).firebaseUid = firebaseUid;
    (req as any).userEmail = userEmail;
    
    next();
  } catch (error: any) {
    console.error('--- Error de Autenticación ---');
    console.error('Código:', error.code);
    console.error('Mensaje:', error.message);
    if (error.code === 'auth/id-token-expired') {
      console.warn('El token ha expirado. Asegúrate de que el reloj de tu PC esté en hora automática.');
    }
    res.status(401).json({ error: 'Invalid or expired token', code: error.code });
  }
}
