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
		if (!bookingId)
			return res
				.status(400)
				.json({ success: false, message: 'bookingId is required' });

		const { status } = req.body; // 'cancelled' | 'returned'
		if (!['cancelled', 'returned'].includes(status))
			return res
				.status(400)
				.json({ success: false, message: 'Invalid status' });

		// fetch booking to check ownership & dates
		const bookingRes = await bookingService.getBookingById(bookingId);
		if (bookingRes.rows.length === 0)
			return res
				.status(404)
				.json({ success: false, message: 'Booking not found' });

		const booking = bookingRes.rows[0];

		if (!booking)
			return res
				.status(404)
				.json({ success: false, message: 'Booking not found' });

		// Authorization: customers can only act on their own bookings
		if (
			req.user?.role === 'customer' &&
			Number(req.user.id) !== Number(booking?.customer_id)
		) {
			return res.status(403).json({ success: false, message: 'Forbidden' });
		}

		// Extra controller-level check: customer can only cancel BEFORE start date
		if (req.user?.role === 'customer' && status === 'cancelled') {
			const now = new Date();
			const start = new Date(booking.rent_start_date);
			if (now >= start) {
				return res.status(400).json({
					success: false,
					message: 'Cannot cancel booking on or after start date',
				});
			}
		}

		// Admin can mark returned; customer cannot mark returned
		if (req.user?.role === 'customer' && status === 'returned') {
			return res.status(403).json({
				success: false,
				message: 'Customers cannot mark bookings as returned',
			});
		}

		// Delegate to service to do the work
		const result = await bookingService.updateBookingStatus(
			bookingId,
			status as 'cancelled' | 'returned',
		);

		if (result.rowCount === 0)
			return res
				.status(404)
				.json({ success: false, message: 'Booking not found' });

		if (status === 'cancelled') {
			return res.status(200).json({
				success: true,
				message: 'Booking cancelled successfully',
				data: result.rows[0],
			});
		} else {
			return res.status(200).json({
				success: true,
				message: 'Booking marked as returned. Vehicle is now available',
				data: result.rows[0],
			});
		}
	} catch (err: any) {
		// service may throw business errors (e.g., cannot cancel after start) — map to 400
		if (
			err.message &&
			/cannot cancel|Cannot cancel|already booked|Vehicle not available/i.test(
				err.message,
			)
		) {
			return res.status(400).json({ success: false, message: err.message });
		}
		return res.status(500).json({ success: false, message: err.message });
	}
};

export const bookingController = { createBooking, getBookings, updateBooking };
