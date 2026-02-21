// export const appCookieName = 'transaction_app_token';
export const accessTokenCookieName = 'transaction_access_token';
export const refreshTokenCookieName = 'transaction_refresh_token';
export const originalDbName = 'transactionsdb';

export const DB_MODEL = {
	USER: 'User',
	STUDENT: 'Student',
	TRANSACTION: 'Transaction',
	PRELISTING: 'Prelisting',
	ORGANIZATION: 'Organization',
	CATEGORY: 'Category',
	SESSION: 'Session',
	ROLE: 'Role',
};

export const WHITELISTED_DOMAINS = ['student.buksu.edu.ph'];

export const SUPER_ADMIN = 'Super Admin';

export enum AppErrorCodes {
	InvalidAccessToken = 'InvalidAccessToken',
}
