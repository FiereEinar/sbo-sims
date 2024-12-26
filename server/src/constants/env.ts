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
