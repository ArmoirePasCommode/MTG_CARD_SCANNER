import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';
import { addCard, listCards, deleteCard, syncCards, recognizeCard } from '../controllers/cardController.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const cardRouter = Router();

cardRouter.use(authMiddleware);
cardRouter.post('/recognize', (upload.single('image') as unknown as import('express').RequestHandler), recognizeCard);
cardRouter.post('/', (upload.single('image') as unknown as import('express').RequestHandler), addCard);
cardRouter.get('/', listCards);
cardRouter.delete('/:id', deleteCard);
cardRouter.get('/sync', syncCards);


