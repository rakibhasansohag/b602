import express from 'express';
import initDB from './config/db';
import errorHandler from './middleware/errorHandler';

const app = express();

// init DB connection
initDB().catch((err) => {
	console.error('DB init error:', err);
	process.exit(1);
});

app.use('/', (req, res) => {
	res.send('Car is running WIthOut Typescript!');
});

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// not found
app.use((_req, res) => {
	res.status(404).json({ success: false, message: 'Route not found' });
});

// error handler
app.use(errorHandler);

export default app;
