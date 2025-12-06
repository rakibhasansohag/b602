import { Router } from 'express';
import { vehicleController } from './vehicle.controller';
import auth from '../../middleware/auth';
import validate from '../../middleware/validate';
import { z } from 'zod';

const router = Router();

const createSchema = z.object({
	body: z.object({
		vehicle_name: z.string().min(1),
		type: z.union([
			z.literal('car'),
			z.literal('bike'),
			z.literal('van'),
			z.literal('SUV'),
		]),
		registration_number: z.string().min(1),
		daily_rent_price: z.number().positive(),
		availability_status: z
			.union([z.literal('available'), z.literal('booked')])
			.optional(),
	}),
});

const updateSchema = z.object({
	body: z.object({
		vehicle_name: z.string().optional(),
		type: z
			.union([
				z.literal('car'),
				z.literal('bike'),
				z.literal('van'),
				z.literal('SUV'),
			])
			.optional(),
		registration_number: z.string().optional(),
		daily_rent_price: z.number().positive().optional(),
		availability_status: z
			.union([z.literal('available'), z.literal('booked')])
			.optional(),
	}),
});

router.post(
	'/',
	auth('admin'),
	validate(createSchema),
	vehicleController.createVehicle,
);
router.get('/', vehicleController.getAllVehicles);
router.get('/:vehicleId', vehicleController.getVehicleById);
router.put(
	'/:vehicleId',
	auth('admin'),
	validate(updateSchema),
	vehicleController.updateVehicle,
);
router.delete('/:vehicleId', auth('admin'), vehicleController.deleteVehicle);

export default router;
