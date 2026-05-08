import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import { config } from './config.js';

export function createApp() {
  const app = express();

  app.use(cors({
    origin: config.clientUrl,
    credentials: true
  }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_, response) => response.json({ status: 'ok' }));
  app.use('/auth', authRoutes);

  app.use((error, _request, response, _next) => {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    response.status(500).json({ message });
  });

  return app;
}
