import { pool } from '../../config/db';
import { QueryResult } from 'pg';
import { BookingRow } from './types';

type CreateBookingPayload = {
	customer_id: number;
	vehicle_id: number;
	rent_start_date: string; // 'YYYY-MM-DD'
	rent_end_date: string; // 'YYYY-MM-DD'
};

const daysBetween = (start: Date, end: Date): number => {
	const msPerDay = 1000 * 60 * 60 * 24;
	const diff = Math.floor((end.getTime() - start.getTime()) / msPerDay);
	return diff;
};

const createBooking = async (
	payload: CreateBookingPayload,
): Promise<{
	booking: BookingRow;
	vehicle: { vehicle_name: string; daily_rent_price: number };
} | null> => {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');

		// lock vehicle row for update
		const vehicleRes = await client.query(
			`SELECT id, vehicle_name, daily_rent_price, availability_status FROM vehicles WHERE id = $1 FOR UPDATE`,
			[payload.vehicle_id],
		);
		if (vehicleRes.rows.length === 0) {
			await client.query('ROLLBACK');
			return null;
		}
		const vehicle = vehicleRes.rows[0];
		if (vehicle.availability_status !== 'available') {
			await client.query('ROLLBACK');
			throw new Error('Vehicle not available');
		}

		const start = new Date(payload.rent_start_date);
		const end = new Date(payload.rent_end_date);
		if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
			await client.query('ROLLBACK');
			throw new Error(
				'Invalid dates: rent_end_date must be after rent_start_date',
			);
		}

		const days = daysBetween(start, end); // e.g., 2026-01-15 to 2026-01-20 -> 5
		const totalPrice = Number(vehicle.daily_rent_price) * days;

		const insertBooking = await client.query(
			`INSERT INTO bookings (customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status`,
			[
				payload.customer_id,
				payload.vehicle_id,
				payload.rent_start_date,
				payload.rent_end_date,
				totalPrice,
				'active',
			],
		);

		await client.query(
			`UPDATE vehicles SET availability_status = 'booked', updated_at = NOW() WHERE id = $1`,
			[payload.vehicle_id],
		);

		await client.query('COMMIT');

		const booking = insertBooking.rows[0] as BookingRow;

		return {
			booking,
			vehicle: {
				vehicle_name: vehicle.vehicle_name,
				daily_rent_price: Number(vehicle.daily_rent_price),
			},
		};
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
};

const getBookingsForAdmin = async (): Promise<QueryResult<any>> => {
	return pool.query(`
    SELECT b.*, u.name AS customer_name, v.vehicle_name, v.registration_number
    FROM bookings b
    JOIN users u ON u.id = b.customer_id
    JOIN vehicles v ON v.id = b.vehicle_id
    ORDER BY b.created_at DESC
  `);
};

const getBookingsForCustomer = async (
	customerId: number,
): Promise<QueryResult<any>> => {
	return pool.query(
		`SELECT b.*, v.vehicle_name, v.registration_number, v.type FROM bookings b JOIN vehicles v ON v.id = b.vehicle_id WHERE b.customer_id = $1 ORDER BY b.created_at DESC`,
		[customerId],
	);
};

const updateBookingStatus = async (
	bookingId: number,
	status: 'cancelled' | 'returned',
): Promise<QueryResult<any>> => {
	// For 'cancelled' we should set vehicle to 'available' if appropriate; for 'returned' we also make available.
	const client = await pool.connect();
	try {
		await client.query('BEGIN');

		// Get booking
		const bookingRes = await client.query(
			`SELECT * FROM bookings WHERE id = $1 FOR UPDATE`,
			[bookingId],
		);
		if (bookingRes.rows.length === 0) {
			await client.query('ROLLBACK');
			return {
				command: 'UPDATE',
				rowCount: 0,
				oid: 0,
				rows: [],
				fields: [],
			} as QueryResult<any>;
		}
		const booking = bookingRes.rows[0];

		// business rules:
		if (status === 'cancelled') {
			// allow cancellation only before start date
			const today = new Date();
			const start = new Date(booking.rent_start_date);
			if (today >= start) {
				await client.query('ROLLBACK');
				throw new Error('Cannot cancel booking on or after start date');
			}
		}

		const updateRes = await client.query(
			`UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
			[status, bookingId],
		);

		// update vehicle availability
		await client.query(
			`UPDATE vehicles SET availability_status = 'available', updated_at = NOW() WHERE id = $1`,
			[booking.vehicle_id],
		);

		await client.query('COMMIT');
		return updateRes;
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
};

export const bookingService = {
	createBooking,
	getBookingsForAdmin,
	getBookingsForCustomer,
	updateBookingStatus,
};
