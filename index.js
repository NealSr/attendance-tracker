import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import api from './backend/server.js';

const app = express();
const publicDirectory = fileURLToPath(new URL('./public/', import.meta.url));
const frontendIndex = path.join(publicDirectory, 'index.html');

app.get('/assets/:asset', (req, res, next) => {
  const assetName = path.basename(req.params.asset);
  if (assetName !== req.params.asset) {
    return res.sendStatus(404);
  }

  res.sendFile(path.join(publicDirectory, 'assets', assetName), (error) => {
    if (error) next(error);
  });
});

app.get(['/', '/index.html'], (_req, res, next) => {
  res.sendFile(frontendIndex, (error) => {
    if (error) next(error);
  });
});

app.use(api);

export default app;
