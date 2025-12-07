import { Router } from 'express';
import { bookingController } from './booking.controller';
import auth from '../../middleware/auth';
// import validate from '../../middleware/validate';
// import { z } from 'zod';

const router = Router();

// const createSchema = z.object({
// 	body: z.object({
// 		customer_id: z.number().int(),
// 		vehicle_id: z.number().int(),
// 		rent_start_date: z
// 			.string()
// 			.refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
// 		rent_end_date: z
// 			.string()
// 			.refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
// 	}),
// });

// const updateSchema = z.object({
// 	body: z.object({
// 		status: z.union([z.literal('cancelled'), z.literal('returned')]),
// 	}),
// });

router.post(
	'/',
	auth('admin', 'customer'),
	// validate(createSchema),
	bookingController.createBooking,
);
router.get('/', auth('admin', 'customer'), bookingController.getBookings);

router.put(
	'/:bookingId',
	auth('admin', 'customer'),
	// validate(updateSchema),
	bookingController.updateBooking,
);

export default router;
