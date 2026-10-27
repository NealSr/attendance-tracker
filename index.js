import express from 'express';
import api from './backend/server.js';

const app = express();

app.get('/', (_req, res) => {
  res.redirect(307, '/index.html');
});

app.use(api);

export default app;
