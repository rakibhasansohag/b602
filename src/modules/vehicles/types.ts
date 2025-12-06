export type VehicleRow = {
	id: number;
	vehicle_name: string;
	type: 'car' | 'bike' | 'van' | 'SUV';
	registration_number: string;
	daily_rent_price: number;
	availability_status: 'available' | 'booked';
	created_at?: string;
	updated_at?: string;
};

export type VehicleCreatePayload = {
	vehicle_name: string;
	type: VehicleRow['type'];
	registration_number: string;
	daily_rent_price: number;
	availability_status?: VehicleRow['availability_status'];
};

export type VehicleUpdatePayload = Partial<VehicleCreatePayload>;
