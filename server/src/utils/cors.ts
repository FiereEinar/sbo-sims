import { CorsOptions } from 'cors';
import { FRONTEND_URL, IPV4_ADDRESS_ORIGIN } from '../constants/env';

const allowedOrigins = [FRONTEND_URL, IPV4_ADDRESS_ORIGIN];

export const corsOptions: CorsOptions = {
	origin: FRONTEND_URL,
	credentials: true,
};

// export const corsOptions: CorsOptions = {
// 	origin: (origin, callback) => {
// 		if (!origin || allowedOrigins.includes(origin)) {
// 			callback(null, true);
// 		} else {
// 			callback(new Error('Not allowed by CORS'));
// 		}
// 	},
// 	credentials: true,
// };
