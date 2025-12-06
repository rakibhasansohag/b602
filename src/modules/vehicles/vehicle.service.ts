import { pool } from '../../config/db';
import { QueryResult } from 'pg';
import {
	VehicleCreatePayload,
	VehicleRow,
	VehicleUpdatePayload,
} from './types';

const createVehicle = async (
	payload: VehicleCreatePayload,
): Promise<QueryResult<VehicleRow>> => {
	const result = await pool.query(
		`INSERT INTO vehicles (vehicle_name, type, registration_number, daily_rent_price, availability_status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, vehicle_name, type, registration_number, daily_rent_price, availability_status`,
		[
			payload.vehicle_name,
			payload.type,
			payload.registration_number,
			payload.daily_rent_price,
			payload.availability_status || 'available',
		],
	);
	return result;
};

const getAllVehicles = async (): Promise<QueryResult<VehicleRow>> => {
	return pool.query(
		`SELECT id, vehicle_name, type, registration_number, daily_rent_price, availability_status FROM vehicles`,
	);
};

const getVehicleById = async (id: number): Promise<QueryResult<VehicleRow>> => {
	return pool.query(
		`SELECT id, vehicle_name, type, registration_number, daily_rent_price, availability_status FROM vehicles WHERE id = $1`,
		[id],
	);
};

const updateVehicle = async (
	id: number,
	payload: VehicleUpdatePayload,
): Promise<QueryResult<VehicleRow>> => {
	const fields: string[] = [];
	const values: (string | number)[] = [];
	let idx = 1;

	if (payload.vehicle_name !== undefined) {
		fields.push(`vehicle_name = $${idx++}`);
		values.push(payload.vehicle_name);
	}
	if (payload.type !== undefined) {
		fields.push(`type = $${idx++}`);
		values.push(payload.type);
	}
	if (payload.registration_number !== undefined) {
		fields.push(`registration_number = $${idx++}`);
		values.push(payload.registration_number);
	}
	if (payload.daily_rent_price !== undefined) {
		fields.push(`daily_rent_price = $${idx++}`);
		values.push(payload.daily_rent_price);
	}
	if (payload.availability_status !== undefined) {
		fields.push(`availability_status = $${idx++}`);
		values.push(payload.availability_status);
	}

	if (fields.length === 0) {
		return {
			command: 'UPDATE',
			rowCount: 0,
			oid: 0,
			rows: [],
			fields: [],
		} as QueryResult<VehicleRow>;
	}

	values.push(id);
	const query = `UPDATE vehicles SET ${fields.join(
		', ',
	)}, updated_at = NOW() WHERE id = $${idx} RETURNING id, vehicle_name, type, registration_number, daily_rent_price, availability_status`;
	return pool.query(query, values);
};

const deleteVehicle = async (id: number) => {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');

		// lock vehicle row
		const vRes = await client.query(
			`SELECT id FROM vehicles WHERE id = $1 FOR UPDATE`,
			[id],
		);

		if (vRes.rows.length === 0) {
			await client.query('ROLLBACK');
			return {
				command: 'DELETE',
				rowCount: 0,
				oid: 0,
				rows: [],
				fields: [],
			} as QueryResult;
		}

		// check active bookings
		const bookingCheck = await client.query(
			`SELECT COUNT(*)::int AS active_count FROM bookings WHERE vehicle_id = $1 AND status = 'active'`,
			[id],
		);
		const activeCount = bookingCheck.rows[0]?.active_count ?? 0;
		if (activeCount > 0) {
			await client.query('ROLLBACK');
			throw new Error('Vehicle has active bookings');
		}

		const del = await client.query(
			`DELETE FROM vehicles WHERE id = $1 RETURNING id`,
			[id],
		);
		await client.query('COMMIT');
		return del;
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
};


export const vehicleService = {
	createVehicle,
	getAllVehicles,
	getVehicleById,
	updateVehicle,
	deleteVehicle,
};
