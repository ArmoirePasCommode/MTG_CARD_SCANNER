import { Router } from 'express';
import { login, signup, refresh, getProfile } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/signup', signup);
authRouter.post('/login', login);
authRouter.post('/refresh', refresh);
authRouter.get('/me', authMiddleware, getProfile);
