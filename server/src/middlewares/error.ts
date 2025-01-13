import { ErrorRequestHandler, Response } from 'express';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from '../constants/http';
import AppError from '../errors/appError';
import { z } from 'zod';

const handleAppError = (res: Response, error: AppError) => {
	res.status(error.statusCode).json({
		message: error.message,
		errorCode: error.errorCode,
	});
};

const handleZodError = (res: Response, error: z.ZodError) => {
	const errors = error.issues.map((err) => ({
		path: err.path.join('.'),
		message: err.message,
	}));

	res.status(BAD_REQUEST).json({
		errors,
		error: error.issues[0].message,
		message: error.message,
	});
};

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
	console.log(`PATH ${req.path}`, error);

	if (error instanceof z.ZodError) {
		handleZodError(res, error);
		return;
	}

	if (error instanceof AppError) {
		handleAppError(res, error);
		return;
	}

	res
		.status(error.status || INTERNAL_SERVER_ERROR)
		.json({ message: error.message, status: error.status, stack: error.stack });
};
