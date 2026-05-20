import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/authRoutes.js';
import { cardRouter } from './routes/cardRoutes.js';
import { tagRouter } from './routes/tagRoutes.js';

export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));

app.get('/test', (_req, res) => res.status(200).json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/cards', cardRouter);
app.use('/api/tags', tagRouter);


