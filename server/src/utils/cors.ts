import { CorsOptions } from 'cors';
import { FRONTEND_URL } from '../constants/env';

export const corsOptions: CorsOptions = {
	origin: FRONTEND_URL,
	credentials: true,
};
