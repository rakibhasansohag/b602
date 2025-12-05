import { Request, Response, NextFunction } from 'express';

const logger = (req: Request, _res: Response, next: NextFunction) => {
	console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
	next();
};

export default logger;
