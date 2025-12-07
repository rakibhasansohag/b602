import { Request, Response } from 'express';
import { userService } from './user.service';

const getAllUsers = async (req: Request, res: Response) => {
	try {
		const result = await userService.getAllUsers();
		res.status(200).json({
			success: true,
			message: 'Users retrieved successfully',
			data: result.rows,
		});
	} catch (err: any) {
		res.status(500).json({ success: false, message: err.message });
	}
};

const updateUser = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		if (!id)
			return res
				.status(400)
				.json({ success: false, message: 'User id is required' });

		if (!req.user)
			return res
				.status(401)
				.json({ success: false, message: 'Unauthorized Access!' });

		const actor = req.user
			? { id: Number(req.user.id), role: req.user.role as 'admin' | 'customer' }
			: null;

		const payload = req.body;
		const result = await userService.updateUser(actor, Number(id), payload);

		if (result.rowCount === 0)
			return res.status(404).json({
				success: false,
				message: 'User not found or no fields to update',
			});

		res.status(200).json({
			success: true,
			message: 'User updated successfully',
			data: result.rows[0],
		});
	} catch (err: any) {
		if (err.message === 'Unauthorized Access')
			return res.status(401).json({ success: false, message: err.message });
		if (err.message === 'Forbidden Access')
			return res.status(403).json({ success: false, message: err.message });

		if (err.message && /unique|email|invalid/i.test(err.message)) {
			return res.status(400).json({ success: false, message: err.message });
		}

		return res.status(500).json({ success: false, message: err.message });
	}
};

const deleteUser = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const result = await userService.deleteUser(Number(id));
		if (result.rowCount === 0)
			return res
				.status(404)
				.json({ success: false, message: 'User not found' });

		res
			.status(200)
			.json({ success: true, message: 'User deleted successfully' });
	} catch (err: any) {

		if (err.message === 'User has active bookings') {
			return res.status(400).json({ success: false, message: err.message });
		}
		
		res.status(500).json({ success: false, message: err.message });
	}
};

export const userController = { getAllUsers, updateUser, deleteUser };
