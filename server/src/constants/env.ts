const getEnv = (key: string, defaultValue?: string): string => {
	const value = process.env[key] || defaultValue;

	if (value === undefined) {
		throw new Error(`Environment variable ${key} is required`);
	}

	return value;
};

export const PORT = getEnv('PORT', '3000');
export const ME_CONFIG_MONGODB_URL = getEnv('ME_CONFIG_MONGODB_URL');
export const BCRYPT_SALT = getEnv('BCRYPT_SALT');
export const JWT_SECRET_KEY = getEnv('JWT_SECRET_KEY');
export const JWT_REFRESH_SECRET_KEY = getEnv('JWT_REFRESH_SECRET_KEY');
export const NODE_ENV = getEnv('NODE_ENV', 'development');
export const IPV4_ADDRESS_ORIGIN = getEnv('IPV4_ADDRESS_ORIGIN');
export const FRONTEND_URL = getEnv('FRONTEND_URL');
export const SECRET_ADMIN_KEY = getEnv('SECRET_ADMIN_KEY');
