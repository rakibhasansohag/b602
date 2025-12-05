import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), '.env') });

const config = {
	CONNECTION_STRING: process.env.CONNECTION_STRING,
	port: process.env.PORT ? Number(process.env.PORT) : 5000,
	jwtSecret: process.env.JWT_SECRET,
};

export default config;
