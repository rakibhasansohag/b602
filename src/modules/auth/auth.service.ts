import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../../config/db';
import config from '../../config';

type SignupPayload = {
	name: string;
	email: string;
	password: string;
	phone: string;
	role?: 'admin' | 'customer';
};

const signup = async (payload: SignupPayload) => {
	const email = (payload.email || '').toLowerCase();
	const hashed = await bcrypt.hash(payload.password, 10);

	const result = await pool.query(
		`INSERT INTO users (name, email, password, phone, role)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone, role`,
		[payload.name, email, hashed, payload.phone, payload.role || 'customer'],
	);

	return result.rows[0];
};

const signin = async (emailRaw: string, password: string) => {
	const email = emailRaw.toLowerCase();
	const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
		email,
	]);

	if (result.rows.length === 0) return null;
	const user = result.rows[0];

	const ok = await bcrypt.compare(password, user.password);
	if (!ok) return null;

	// sign token (store minimal fields)
	const token = jwt.sign(
		{ id: user.id, name: user.name, email: user.email, role: user.role },
		config.jwtSecret as string,
		{ expiresIn: '1d' },
	);

	// omit password in response
	const userSafe = {
		id: user.id,
		name: user.name,
		email: user.email,
		phone: user.phone,
		role: user.role,
	};

	return { token, user: userSafe };
};

export const authService = { signup, signin };
