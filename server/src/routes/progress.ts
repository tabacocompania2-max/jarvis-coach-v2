import { Router, Request, Response } from 'express';

const router = Router();

// Mock de base de datos de progreso (En producción esto iría a MongoDB/PostgreSQL)
const userProgress = {
  fluency: [65, 68, 72, 70, 78, 82, 85], // Datos para el gráfico
  skills: {
    grammar: 75,
    vocabulary: 88,
    speaking: 62,
    listening: 80
  },
  strengths: ['Vocabulario técnico', 'Velocidad de respuesta'],
  weaknesses: ['Uso de condicionales', 'Pronunciación de "th"'],
  totalSessions: 24,
  streak: 5
};

// Endpoint para obtener el perfil del estudiante
router.get('/progress', (req: Request, res: Response) => {
  res.json(userProgress);
});

// Endpoint para obtener el historial de chats
router.get('/history', (req: Request, res: Response) => {
  // Simulando historial guardado
  res.json([
    { id: '1', title: 'Práctica de condicionales', date: '2026-05-01', summary: 'Repasamos el IF y el WOULD.' },
    { id: '2', title: 'Charla sobre tecnología', date: '2026-04-30', summary: 'Conversación fluida sobre IA.' },
    { id: '3', title: 'Vocabulario de negocios', date: '2026-04-29', summary: 'Términos para reuniones.' }
  ]);
});

export default router;
