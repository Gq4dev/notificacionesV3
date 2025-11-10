import express from 'express';
import notifyRoutes from './routes/notify.routes.js';

export function buildApp() {
  const app = express();
  app.use(express.json());
  app.get('/health', (_req, res) => res.json({ ok: true, service: 'notificaciones' }));
  app.use('/notify', notifyRoutes);
  return app;
}
