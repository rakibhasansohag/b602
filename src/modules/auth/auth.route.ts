import { Router } from 'express';
import { authController } from './auth.controller';
import validate from '../../middleware/validate';
import { z } from 'zod';

const router = Router();

const signupSchema = z.object({
	body: z.object({
		name: z.string().min(1),
		email: z.email(),
		password: z.string().min(6),
		phone: z.string().min(6),
		role: z.enum(['admin', 'customer']).optional(),
	}),
});

const signinSchema = z.object({
	body: z.object({
		email: z.email(),
		password: z.string().min(6),
	}),
});

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/signin', validate(signinSchema), authController.signin);

export default router;
