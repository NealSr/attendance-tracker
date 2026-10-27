import express from 'express';
import { fileURLToPath } from 'node:url';
import api from './backend/server.js';

const app = express();
const frontendIndex = fileURLToPath(new URL('./public/index.html', import.meta.url));

app.get(['/', '/index.html'], (_req, res, next) => {
  res.sendFile(frontendIndex, (error) => {
    if (error) next(error);
  });
});

app.use(api);

export default app;
