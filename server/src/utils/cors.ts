import { CorsOptions } from 'cors';
import { IPV4_ADDRESS_ORIGIN } from '../constants/env';

const allowedOrigins = ['http://localhost:5173', IPV4_ADDRESS_ORIGIN];

export const corsOptions: CorsOptions = {
	origin: (origin, callback) => {
		if (!origin || allowedOrigins.includes(origin)) {
			callback(null, true);
		} else {
			callback(new Error('Not allowed by CORS'));
		}
	},
	credentials: true,
};
