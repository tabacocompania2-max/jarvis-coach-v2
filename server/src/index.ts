import express, { Request, Response } from 'express';
import cors from 'cors';
import aiRoutes from './routes/ai.routes';
import lessonRoutes from './routes/lessons.routes';
import analyticsRoutes from './routes/analytics.routes';
import authRoutes from './routes/auth.routes';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/ai', aiRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/user', analyticsRoutes);
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'ELC Server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 ELC Server running on http://localhost:${PORT}`);
});
