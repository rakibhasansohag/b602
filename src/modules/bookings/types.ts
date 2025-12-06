export type BookingRow = {
	id: number;
	customer_id: number;
	vehicle_id: number;
	rent_start_date: string;
	rent_end_date: string;
	total_price: number;
	status: 'active' | 'cancelled' | 'returned';
	created_at?: string;
	updated_at?: string;
};
