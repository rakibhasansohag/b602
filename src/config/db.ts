import { Pool, types } from 'pg';
import config from './index';

types.setTypeParser(types.builtins.NUMERIC, (value: string) => {
	return parseFloat(value);
});

export const pool = new Pool({
	connectionString: config.CONNECTION_STRING,
});

const initDB = async () => {
	// Users Modal
	await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(30) NOT NULL,
      role VARCHAR(30) NOT NULL DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

	// Vehicles Modal
	await pool.query(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id SERIAL PRIMARY KEY,
      vehicle_name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      registration_number VARCHAR(100) NOT NULL UNIQUE,
      daily_rent_price NUMERIC NOT NULL CHECK (daily_rent_price > 0),
      availability_status VARCHAR(20) NOT NULL DEFAULT 'available',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

	// Bookings Modal
	await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      customer_id INT REFERENCES users(id) ON DELETE CASCADE,
      vehicle_id INT REFERENCES vehicles(id) ON DELETE CASCADE,
      rent_start_date DATE NOT NULL,
      rent_end_date DATE NOT NULL,
      total_price NUMERIC NOT NULL CHECK (total_price >= 0),
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

	// Creating index to speed queries
	await pool.query(
		`CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);`,
	);
};

export default initDB;
