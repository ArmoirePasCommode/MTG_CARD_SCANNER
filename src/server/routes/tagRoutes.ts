import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { listTags, renameTag, deleteTag } from '../controllers/cardController.js';

export const tagRouter = Router();

tagRouter.use(authMiddleware);
tagRouter.get('/', listTags);
tagRouter.post('/rename', renameTag);
tagRouter.delete('/:name', deleteTag);
