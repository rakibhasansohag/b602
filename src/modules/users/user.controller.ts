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
		const payload = req.body;
		const result = await userService.updateUser(Number(id), payload);

		if (result.rowCount === 0)
			return res
				.status(404)
				.json({ success: false, message: 'User not found' });

		res.status(200).json({
			success: true,
			message: 'User updated successfully',
			data: result.rows[0],
		});
	} catch (err: any) {
		res.status(500).json({ success: false, message: err.message });
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
		res.status(500).json({ success: false, message: err.message });
	}
};

export const userController = { getAllUsers, updateUser, deleteUser };
