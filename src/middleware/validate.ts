import { ZodObject, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';

const validate =
	(schema: ZodObject) => (req: Request, res: Response, next: NextFunction) => {
		try {
			schema.parse({ body: req.body, params: req.params, query: req.query });
			next();
		} catch (err) {
			if (err instanceof ZodError) {
				return res.status(400).json({
					success: false,
					message: 'Validation failed',
					errors: err,
				});
			}
			next(err);
		}
	};

export default validate;
