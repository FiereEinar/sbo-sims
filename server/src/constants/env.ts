const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;

  if (value === undefined) {
    throw new Error(`Environment variable ${key} is required`);
  }

  return value;
};

export const PORT = getEnv('PORT', '3000');
export const ME_CONFIG_MONGODB_URL = getEnv('ME_CONFIG_MONGODB_URL');
export const MONGODB_PARAMS = getEnv('MONGODB_PARAMS', '');
export const BCRYPT_SALT = getEnv('BCRYPT_SALT');
export const JWT_SECRET_KEY = getEnv('JWT_SECRET_KEY');
export const JWT_REFRESH_SECRET_KEY = getEnv('JWT_REFRESH_SECRET_KEY');
export const NODE_ENV = getEnv('NODE_ENV', 'development');
export const FRONTEND_URL = getEnv('FRONTEND_URL');
export const SECRET_ADMIN_KEY = getEnv('SECRET_ADMIN_KEY');
export const ADMIN_ID = getEnv('ADMIN_ID');
export const ADMIN_PASS = getEnv('ADMIN_PASS');
export const RECAPTCHA_SECRET_KEY = getEnv('RECAPTCHA_SECRET_KEY');

export const APP_ORIGIN = getEnv('APP_ORIGIN');
export const EMAIL_USER = getEnv('EMAIL_USER');
export const EMAIL_PASS = getEnv('EMAIL_PASS');
export const STUDENT_EMAIL_DOMAIN = getEnv('STUDENT_EMAIL_DOMAIN');
export const DATABASE_NAME = getEnv('DATABASE_NAME');
export const ACCESS_TOKEN_COOKIE_NAME = getEnv('ACCESS_TOKEN_COOKIE_NAME');
export const REFRESH_TOKEN_COOKIE_NAME = getEnv('REFRESH_TOKEN_COOKIE_NAME');
