import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { labsRouter } from './routes/labs';
import { coursesRouter } from './routes/courses';
import { progressRouter } from './routes/progress';
import { phasesRouter } from './routes/phases';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/labs', labsRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/progress', progressRouter);
app.use('/api', phasesRouter); // Rutas de fases: /api/phases/* y /api/labs/:labId/phases

// Error handler
app.use(errorHandler);

export default app;
