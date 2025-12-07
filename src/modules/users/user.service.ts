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

type Actor = { id: number; role: 'admin' | 'customer' } | null;

const getAllUsers = async (): Promise<QueryResult<UserRow>> => {
	return pool.query(`SELECT id, name, email, phone, role FROM users`);
};

const updateUser = async (
	actor: Actor,
	targetId: number,
	payload: UserUpdatable,
): Promise<QueryResult<UserRow>> => {
	// Authorization
	if (!actor) {
		const err = new Error('Unauthorized');
		(err as any).code = 'Unauthorized';
		throw err;
	}

	const isAdmin = actor.role === 'admin';
	const isOwner = Number(actor.id) === Number(targetId);

	if (!isAdmin && !isOwner) {
		const err = new Error('Forbidden Access');
		(err as any).code = 'Forbidden';
		throw err;
	}

	// Build sanitized payload - only allow role change when admin
	const sanitized: Partial<UserUpdatable> = {};
	if (payload.name !== undefined) sanitized.name = payload.name;
	if (payload.email !== undefined)
		sanitized.email = (payload.email as string).toLowerCase();
	if (payload.phone !== undefined) sanitized.phone = payload.phone;

	if (payload.password !== undefined) {
		// Hash password
		const hashed = await bcrypt.hash(payload.password as string, 10);
		sanitized.password = hashed;
	}

	if (isAdmin && payload.role !== undefined) {
		sanitized.role = payload.role;
	} // owner cannot set role

	// If nothing to update
	if (Object.keys(sanitized).length === 0) {
		return {
			command: 'UPDATE',
			rowCount: 0,
			oid: 0,
			rows: [],
			fields: [],
		} as QueryResult<UserRow>;
	}

	// Dynamic update builder
	const fields: string[] = [];
	const values: (string | number)[] = [];
	let idx = 1;

	if (sanitized.name !== undefined) {
		fields.push(`name = $${idx++}`);
		values.push(sanitized.name as string);
	}
	if (sanitized.email !== undefined) {
		fields.push(`email = $${idx++}`);
		values.push(sanitized.email as string);
	}
	if (sanitized.phone !== undefined) {
		fields.push(`phone = $${idx++}`);
		values.push(sanitized.phone as string);
	}
	if (sanitized.role !== undefined) {
		fields.push(`role = $${idx++}`);
		values.push(sanitized.role as string);
	}
	if (sanitized.password !== undefined) {
		fields.push(`password = $${idx++}`);
		values.push(sanitized.password as string);
	}

	values.push(targetId); // final param
	const query = `UPDATE users SET ${fields.join(
		', ',
	)}, updated_at = NOW() WHERE id = $${idx} RETURNING id, name, email, phone, role`;
	return pool.query(query, values);
};

const deleteUser = async (id: number) => {
	const client = await pool.connect();
	try {
		await client.query('BEGIN');

		// lock user row
		const userRes = await client.query(
			`SELECT id FROM users WHERE id = $1 FOR UPDATE`,
			[id],
		);
		if (userRes.rows.length === 0) {
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
			`SELECT COUNT(*)::int AS active_count FROM bookings WHERE customer_id = $1 AND status = 'active'`,
			[id],
		);
		const activeCount = bookingCheck.rows[0]?.active_count ?? 0;
		if (activeCount > 0) {
			await client.query('ROLLBACK');
			throw new Error('User has active bookings');
		}

		// safe to delete
		const del = await client.query(
			`DELETE FROM users WHERE id = $1 RETURNING id`,
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

export const userService = { getAllUsers, updateUser, deleteUser };
