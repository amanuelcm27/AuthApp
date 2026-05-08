import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import todoRoutes from './routes/todoRoutes.js';
import { errorHandler } from './utils/errorHandler.js';
import { config } from './config.js';

export function createApp() {
  const app = express();

  app.use(cors({
    origin: config.clientUrl,
    credentials: true
  }));
  app.use(express.json());
  app.use(cookieParser());
  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  app.get('/health', (_, response) => response.json({ status: 'ok' }));
  app.use('/auth', authRoutes);
  app.use('/api/todos', todoRoutes);

  app.use(errorHandler);

  return app;
}
