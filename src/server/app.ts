import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/authRoutes';
import { cardRouter } from './routes/cardRoutes';

export const app = express();

app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/cards', cardRouter);


