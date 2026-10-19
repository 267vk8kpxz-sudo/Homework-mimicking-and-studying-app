import express from 'express';
import { apiRouter } from '../src/server/api.js';

const app = express();
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Mount the api router
app.use('/api', apiRouter);

export default app;
