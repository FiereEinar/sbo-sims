import { CorsOptions } from 'cors';
import { FRONTEND_URL } from '../constants/env';

// Remove trailing slash if present to avoid CORS mismatch
const normalizedOrigin = FRONTEND_URL.replace(/\/$/, '');

export const corsOptions: CorsOptions = {
	origin: normalizedOrigin,
	credentials: true,
};
