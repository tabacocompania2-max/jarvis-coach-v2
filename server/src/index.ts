import express, { Request, Response } from 'express';
import cors from 'cors';
import aiRoutes from './routes/ai.routes';
import lessonRoutes from './routes/lessons.routes';
import analyticsRoutes from './routes/analytics.routes';
import authRoutes from './routes/auth.routes';
import spotifyRoutes from './routes/spotify';
import youtubeRoutes from './routes/youtube';
import callingRoutes from './routes/calling';
import progressRoutes from './routes/progress';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Middleware: Logging incoming requests
app.use((req, res, next) => {
  console.log(`📥 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/student', progressRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/user', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.use(spotifyRoutes);
app.use(youtubeRoutes);
app.use(callingRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'ELC Server is running' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 ELC Server running on http://0.0.0.0:${PORT}`);
});
