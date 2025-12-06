import cron from 'node-cron';
import { bookingService } from '../modules/bookings/booking.service';

export const startCronJobs = () => {
	// run at 00:05 every day (server timezone) — adjust schedule as needed
	cron.schedule(
		'5 0 * * *',
		async () => {
			try {
				const count = await bookingService.autoReturnExpiredBookings();
				if (count > 0) {
					console.log(`[cron] auto-returned ${count} bookings`);
				}
			} catch (err) {
				console.error('[cron] auto-return job failed', err);
			}
		},
		{
			timezone: 'UTC', // or your server timezone; modify if needed
		},
	);

	console.log('Cron jobs started');
};
