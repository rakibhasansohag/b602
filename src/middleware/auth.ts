import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

const auth = (...roles: string[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		try {
			const header = req.headers.authorization;

			if (!header)
				return res
					.status(401)
					.json({ success: false, message: 'Authorization header missing' });

			const token = header.split(' ')[1];
			if (!token)
				return res
					.status(401)
					.json({ success: false, message: 'Token missing' });

			const decoded = jwt.verify(token, config.jwtSecret as string) as any;
			req.user = decoded;

			if (roles.length && !roles.includes(decoded.role)) {
				return res
					.status(403)
					.json({ success: false, message: 'Forbidden Access!' });
			}

			next();
		} catch (err: any) {
			return res.status(401).json({
				success: false,
				message: err.message || 'Unauthorized Access!',
			});
		}
	};
};

export default auth;
