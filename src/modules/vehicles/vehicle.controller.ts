import { Request, Response } from 'express';
import { vehicleService } from './vehicle.service';

const createVehicle = async (req: Request, res: Response) => {
	try {
		const payload = req.body;
		const result = await vehicleService.createVehicle(payload);
		res.status(201).json({
			success: true,
			message: 'Vehicle created successfully',
			data: result.rows[0],
		});
	} catch (err: any) {
		res.status(500).json({ success: false, message: err.message });
	}
};

const getAllVehicles = async (_req: Request, res: Response) => {
	try {
		const result = await vehicleService.getAllVehicles();
		if (result.rows.length === 0)
			return res
				.status(200)
				.json({ success: true, message: 'No vehicles found', data: [] });
		res.status(200).json({
			success: true,
			message: 'Vehicles retrieved successfully',
			data: result.rows,
		});
	} catch (err: any) {
		res.status(500).json({ success: false, message: err.message });
	}
};

const getVehicleById = async (req: Request, res: Response) => {
	const id = Number(req.params.vehicleId || req.params.id);
	if (!id)
		return res
			.status(400)
			.json({ success: false, message: 'vehicleId required' });
	try {
		const result = await vehicleService.getVehicleById(id);
		if (result.rows.length === 0)
			return res
				.status(404)
				.json({ success: false, message: 'Vehicle not found' });
		res.status(200).json({
			success: true,
			message: 'Vehicle retrieved successfully',
			data: result.rows[0],
		});
	} catch (err: any) {
		res.status(500).json({ success: false, message: err.message });
	}
};

const updateVehicle = async (req: Request, res: Response) => {
	const id = Number(req.params.vehicleId || req.params.id);
	if (!id)
		return res
			.status(400)
			.json({ success: false, message: 'vehicleId required' });
	try {
		const result = await vehicleService.updateVehicle(id, req.body);
		if (result.rowCount === 0)
			return res.status(404).json({
				success: false,
				message: 'Vehicle not found or no fields to update',
			});
		res.status(200).json({
			success: true,
			message: 'Vehicle updated successfully',
			data: result.rows[0],
		});
	} catch (err: any) {
		res.status(500).json({ success: false, message: err.message });
	}
};

const deleteVehicle = async (req: Request, res: Response) => {
	const id = Number(req.params.vehicleId || req.params.id);
	if (!id)
		return res
			.status(400)
			.json({ success: false, message: 'vehicleId required' });
	try {
		// TODO : check active bookings BEFORE delete: assume bookingsService has checkActiveBookingsForVehicle
		// TODO :  Controller should call that  or use bookingService to check rowCount > 0
		const result = await vehicleService.deleteVehicle(id);
		if (result.rowCount === 0)
			return res
				.status(404)
				.json({ success: false, message: 'Vehicle not found' });
		res
			.status(200)
			.json({ success: true, message: 'Vehicle deleted successfully' });
	} catch (err: any) {
		res.status(500).json({ success: false, message: err.message });
	}
};

export const vehicleController = {
	createVehicle,
	getAllVehicles,
	getVehicleById,
	updateVehicle,
	deleteVehicle,
};
