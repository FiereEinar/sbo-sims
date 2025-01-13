import assert from 'node:assert'
import { HttpStatusCode } from '../constants/http';
import { AppErrorCodes } from '../constants';
import AppError from './appError';

type AppAssert = (
	condition: any,
	httpStatusCode: HttpStatusCode,
	message: string,
	appErrorCode?: AppErrorCodes
) => asserts condition;

/**
 * Asserts a condition and throws an AppError if the condition is falsy.
 */
const appAssert: AppAssert = (
	condition,
	httpStatusCode,
	message,
	appErrorCode
) => assert(condition, new AppError(httpStatusCode, message, appErrorCode));

export default appAssert;
