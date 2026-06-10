import rateLimit from 'express-rate-limit';

// Global rate limiter applied to all routes
export const globalLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 500, // Limit each IP to 500 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	message: {
		success: false,
		message: 'Too many requests from this IP, please try again after 15 minutes',
	},
	validate: { trustProxy: false },
});

// Strict rate limiter for sensitive routes like auth
export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 20, // Limit each IP to 20 login/signup requests per `window`
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		success: false,
		message: 'Too many login attempts from this IP, please try again after 15 minutes',
	},
	validate: { trustProxy: false },
});
