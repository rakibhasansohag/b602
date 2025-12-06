import express from 'express';
import initDB from './config/db';
import errorHandler from './middleware/errorHandler';
import logger from './middleware/logger';
import authRoutes from './modules/auth/auth.route';
import userRoutes from './modules/users/user.route';
import vehicleRoutes from './modules/vehicles/vehicle.route';
import bookingRoutes from './modules/bookings/booking.route';
import { startCronJobs } from './utils/corn';

const app = express();

// init DB connection
initDB().catch((err) => {
	console.error('DB init error:', err);
	process.exit(1);
});

app.get('/', logger, (_req, res) => {
	res.send('Car is running WIthOut Typescript!');
});

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);
startCronJobs();

// API  base Version
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/vehicles', vehicleRoutes);
app.use('/api/v1/bookings', bookingRoutes);


// not found
app.use((_req, res) => {
	res.status(404).json({ success: false, message: 'Route not found' });
});

// error handler
app.use(errorHandler);

export default app;
