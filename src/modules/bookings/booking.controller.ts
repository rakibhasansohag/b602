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
		if (!bookingId) {
			return res
				.status(400)
				.json({ success: false, message: 'bookingId is required' });
		}

		const { status } = req.body;
		if (!['cancelled', 'returned'].includes(status)) {
			return res.status(400).json({
				success: false,
				message: 'Invalid status Choose Between cancelled or returned',
			});
		}

		// fetch booking to check ownership & dates
		const bookingRes = await bookingService.getBookingById(bookingId);
		if (bookingRes.rows.length === 0) {
			return res
				.status(404)
				.json({ success: false, message: 'Booking not found' });
		}
		const booking = bookingRes.rows[0];

		if (!booking)
			return res.status(404).json({
				success: false,
				message: 'Booking Not Found',
			});

		// Authorization checks
		const actorRole = req.user?.role;
		const actorId = req.user ? Number(req.user.id) : null;

		// Only customer (owner) can cancel
		if (status === 'cancelled') {
			if (actorRole !== 'customer' || actorId !== Number(booking.customer_id)) {
				return res.status(403).json({
					success: false,
					message: 'Only booking owner (customer) can cancel this booking',
				});
			}
			// check start date
			const now = new Date();
			const start = new Date(booking.rent_start_date);
			if (now >= start) {
				return res.status(400).json({
					success: false,
					message: 'Cannot cancel booking on or after start date',
				});
			}
		}

		// Only admin can mark returned
		if (status === 'returned') {
			if (actorRole !== 'admin') {
				return res.status(403).json({
					success: false,
					message: 'Only admin can mark bookings as returned',
				});
			}
		}

		// Delegate to service
		const svcResult = await bookingService.updateBookingStatus(
			bookingId,
			status as 'cancelled' | 'returned',
		);

		if (svcResult.updateRes.rowCount === 0) {
			return res
				.status(404)
				.json({ success: false, message: 'Booking not found' });
		}

		// Format booking dates 
		const updatedBooking = svcResult.updateRes.rows[0]; const fmt = (val?: string | Date | null): string | null => {
			if (val === null || val === undefined) return null;
			const d = typeof val === 'string' ? new Date(val) : val;
			if (isNaN(d.getTime())) return null;
			return d.toISOString().slice(0, 10); // YYYY-MM-DD
		};
		
		const responseBooking = {
			id: updatedBooking.id,
			customer_id: updatedBooking.customer_id,
			vehicle_id: updatedBooking.vehicle_id,
			rent_start_date: fmt(updatedBooking.rent_start_date),
			rent_end_date: fmt(updatedBooking.rent_end_date),
			total_price: updatedBooking.total_price,
			status: updatedBooking.status,
		};

		if (status === 'cancelled') {
			return res.status(200).json({
				success: true,
				message: 'Booking cancelled successfully',
				data: responseBooking,
			});
		} else {
			return res.status(200).json({
				success: true,
				message: 'Booking marked as returned. Vehicle is now available',
				data: {
					...responseBooking,
					vehicle: svcResult.vehicle ?? { availability_status: 'available' },
				},
			});
		}
	} catch (err: any) {
		// map known business messages to 400
		if (
			err.message &&
			/Cannot cancel booking on or after start date|already booked|Vehicle not available/i.test(
				err.message,
			)
		) {
			return res.status(400).json({ success: false, message: err.message });
		}
		return res.status(500).json({ success: false, message: err.message });
	}
};

export const bookingController = { createBooking, getBookings, updateBooking };
