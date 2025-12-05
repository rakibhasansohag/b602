import { Request, Response } from 'express';
import { authService } from './auth.service';

const signup = async (req: Request, res: Response) => {
	try {
		const payload = req.body;
		const result = await authService.signup(payload);

		res.status(201).json({
			success: true,
			message: 'User registered successfully',
			data: result,
		});
	} catch (err: any) {
		res.status(500).json({ success: false, message: err.message });
	}
};

const signin = async (req: Request, res: Response) => {
	try {
		const { email, password } = req.body;
		const result = await authService.signin(email, password);
		if (!result)
			return res
				.status(401)
				.json({ success: false, message: 'Invalid credentials' });

		res.status(200).json({
			success: true,
			message: 'Login successful',
			data: result,
		});
	} catch (err: any) {
		res.status(500).json({ success: false, message: err.message });
	}
};

export const authController = { signup, signin };
