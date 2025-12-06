import { pool } from '../../config/db';
import bcrypt from 'bcryptjs';
import { QueryResult } from 'pg';

export type UserRow = {
	id: number;
	name: string;
	email: string;
	phone: string;
	role: 'admin' | 'customer';
	created_at?: string;
	updated_at?: string;
};

export type UserUpdatable = {
	name?: string;
	email?: string;
	phone?: string;
	role?: 'admin' | 'customer';
	password?: string;
};

const getAllUsers = async (): Promise<QueryResult<UserRow>> => {
	return pool.query(`SELECT id, name, email, phone, role FROM users`);
};

const updateUser = async (
	id: number,
	payload: UserUpdatable,
): Promise<QueryResult<UserRow>> => {
	const fields: string[] = [];
	const values: (string | number)[] = [];
	let idx = 1;

	if (payload.name !== undefined) {
		fields.push(`name = $${idx++}`);
		values.push(payload.name);
	}
	if (payload.email !== undefined) {
		fields.push(`email = $${idx++}`);
		values.push(payload.email.toLowerCase());
	}
	if (payload.phone !== undefined) {
		fields.push(`phone = $${idx++}`);
		values.push(payload.phone);
	}
	if (payload.role !== undefined) {
		fields.push(`role = $${idx++}`);
		values.push(payload.role);
	}
	if (payload.password !== undefined) {
		const hashed = await bcrypt.hash(payload.password, 10);
		fields.push(`password = $${idx++}`);
		values.push(hashed);
	}

	if (fields.length === 0) {
		return {
			command: 'UPDATE',
			rowCount: 0,
			oid: 0,
			rows: [],
			fields: [],
		} as QueryResult<UserRow>;
	}

	values.push(id); // final param
	const query = `UPDATE users SET ${fields.join(
		', ',
	)}, updated_at = NOW() WHERE id = $${idx} RETURNING id, name, email, phone, role`;
	return pool.query(query, values);
};

const deleteUser = async (id: number) => {
	// Check for active bookings for this user
	const bookingCheck = await pool.query(
		`SELECT COUNT(*)::int AS active_count FROM bookings WHERE customer_id = $1 AND status = 'active'`,
		[id],
	);

	const activeCount = bookingCheck.rows[0]?.active_count ?? 0;

	if (activeCount > 0) {
		// refuse deletion
		throw new Error('User has active bookings');
	}

	// safe to delete
	return pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
};

export const userService = { getAllUsers, updateUser, deleteUser };
