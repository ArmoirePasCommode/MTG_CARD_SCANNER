import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth';
import { addCard, listCards, deleteCard, syncCards } from '../controllers/cardController';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

export const cardRouter = Router();

cardRouter.use(authMiddleware);
cardRouter.post('/', (upload.single('image') as unknown as import('express').RequestHandler), addCard);
cardRouter.get('/', listCards);
cardRouter.delete('/:id', deleteCard);
cardRouter.get('/sync', syncCards);


