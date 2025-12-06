import cron from 'node-cron';
import { bookingService } from '../modules/bookings/booking.service';

export const startCronJobs = () => {
	// run at 00:05 every day (server timezone) —
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
			timezone: 'UTC', // server timezone
		},
	);

	console.log('Cron jobs started');
};
