import { Router } from 'express';
import { userController } from './user.controller';
import auth from '../../middleware/auth';
// import validate from '../../middleware/validate';
// import { z } from 'zod';

const router = Router();

// admin-only access
router.get('/', auth('admin'), userController.getAllUsers);

// router.get('/:id', auth('admin', 'customer'), userController.getUser);

// admin or owner update: we'll validate body with zod
// const updateSchema = z.object({
// 	body: z.object({
// 		name: z.string().optional(),
// 		email: z.email(),
// 		phone: z.string().optional(),
// 		role: z.enum(['admin', 'customer']).optional(),
// 	}),
// });

router.put(
	'/:id',
	auth('admin', 'customer'),
	// validate(updateSchema),
	userController.updateUser,
);
router.delete('/:id', auth('admin'), userController.deleteUser);


export default router;
