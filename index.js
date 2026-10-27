import express from 'express';
import api from './backend/server.js';

const app = express();
app.use(api);

export default app;
