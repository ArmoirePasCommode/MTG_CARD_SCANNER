import { Router } from 'express';
import { login, signup, refresh } from '../controllers/authController';

export const authRouter = Router();

authRouter.post('/signup', signup);
authRouter.post('/login', login);
authRouter.post('/refresh', refresh);


