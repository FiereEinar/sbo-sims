import { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from './env';

export const accessTokenCookieName = ACCESS_TOKEN_COOKIE_NAME;
export const refreshTokenCookieName = REFRESH_TOKEN_COOKIE_NAME;

export const DB_MODEL = {
  USER: 'User',
  STUDENT: 'Student',
  TRANSACTION: 'Transaction',
  PRELISTING: 'Prelisting',
  ORGANIZATION: 'Organization',
  CATEGORY: 'Category',
  SESSION: 'Session',
  ROLE: 'Role',
  APPSETTING: 'AppSetting',
  EVENT: 'Event',
  EVENT_SESSION: 'EventSession',
  ATTENDANCE_RECORD: 'AttendanceRecord',
};

export const WHITELISTED_DOMAINS = ['student.buksu.edu.ph'];

export const SUPER_ADMIN = 'Super Admin';

export enum AppErrorCodes {
  InvalidAccessToken = 'InvalidAccessToken',
}
