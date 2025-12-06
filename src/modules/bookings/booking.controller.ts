import { Request, Response } from 'express';
import { bookingService } from './booking.service';

const createBooking = async (req: Request, res: Response) => {
	try {
		const { customer_id, vehicle_id, rent_start_date, rent_end_date } =
			req.body;

		// if user is customer, ensure they can only create for themselves
		if (req.user && req.user.role === 'customer') {
			if (Number(req.user.id) !== Number(customer_id)) {
				return res.status(403).json({
					success: false,
					message: 'Cannot create booking for another user',
				});
			}
		}

		const result = await bookingService.createBooking({
			customer_id: Number(customer_id),
			vehicle_id: Number(vehicle_id),
			rent_start_date,
			rent_end_date,
		});

		if (!result)
			return res
				.status(404)
				.json({ success: false, message: 'Vehicle not found' });

		res.status(201).json({
			success: true,
			message: 'Booking created successfully',
			data: {
				...result.booking,
				vehicle: result.vehicle,
			},
		});
	} catch (err: any) {
		res.status(400).json({ success: false, message: err.message });
	}
};

const getBookings = async (req: Request, res: Response) => {
	try {
		if (req.user && req.user.role === 'admin') {
			const result = await bookingService.getBookingsForAdmin();
			res.status(200).json({
				success: true,
				message: 'Bookings retrieved successfully',
				data: result.rows,
			});
		} else {
			// customer
			const customerId = Number(req.user?.id);
			const result = await bookingService.getBookingsForCustomer(customerId);
			res.status(200).json({
				success: true,
				message: 'Your bookings retrieved successfully',
				data: result.rows,
			});
		}
	} catch (err: any) {
		res.status(500).json({ success: false, message: err.message });
	}
};

const updateBooking = async (req: Request, res: Response) => {
	try {
		const bookingId = Number(req.params.bookingId);
		const { status } = req.body; // 'cancelled' or 'returned'

		if (!['cancelled', 'returned'].includes(status))
			return res
				.status(400)
				.json({ success: false, message: 'Invalid status' });

		// Authorization: customers can cancel (before start date); admin can mark as returned.
		if (req.user?.role === 'customer' && status === 'returned') {
			return res.status(403).json({ success: false, message: 'Forbidden' });
		}

		if (req.user?.role === 'customer' && status === 'cancelled') {
			// TODO: additional check enforced in service
		}

		const result = await bookingService.updateBookingStatus(
			bookingId,
			status as 'cancelled' | 'returned',
		);
		if (result.rowCount === 0)
			return res
				.status(404)
				.json({ success: false, message: 'Booking not found' });

		if (status === 'cancelled') {
			res.status(200).json({
				success: true,
				message: 'Booking cancelled successfully',
				data: result.rows[0],
			});
		} else {
			res.status(200).json({
				success: true,
				message: 'Booking marked as returned. Vehicle is now available',
				data: result.rows[0],
			});
		}
	} catch (err: any) {
		res.status(400).json({ success: false, message: err.message });
	}
};

export const bookingController = { createBooking, getBookings, updateBooking };
