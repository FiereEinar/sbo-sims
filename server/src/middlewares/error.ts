import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import {
  BAD_REQUEST,
  CONFLICT,
  INTERNAL_SERVER_ERROR,
} from '../constants/http';
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

const handleMongoError = (req: Request, res: Response, error: any) => {
  let message = 'A database error occurred.';
  let status = INTERNAL_SERVER_ERROR;

  // Handle Duplicate Key Error
  if (error.code === 11000) {
    const key = Object.keys(error.keyPattern || {})[0];
    const value = error.keyValue?.[key as string];
    message = `Duplicate value for "${key}": "${value}". This value must be unique.`;
    status = CONFLICT;
  }

  // Handle Mongoose Validation Errors
  else if (error.name === 'ValidationError') {
    const fields = Object.values(error.errors || {}).map((e: any) => e.message);
    message = `Validation failed: ${fields.join(', ')}`;
    status = BAD_REQUEST;
  }

  // Handle CastError (e.g., invalid ObjectId)
  else if (error.name === 'CastError') {
    message = `Invalid value for field "${error.path}": ${error.value}`;
    status = BAD_REQUEST;
  }

  // Handle MongoServerError or others
  else if (error.name === 'MongoServerError') {
    message = error.errmsg || 'Unexpected MongoDB server error.';
    status = INTERNAL_SERVER_ERROR;
  }

  res.status(status).json({
    message,
    code: error.code,
    name: error.name,
    details: error.errmsg || undefined,
  });
};

export const errorHandler: ErrorRequestHandler = (
  error,
  req: Request,
  res,
  next,
) => {
  console.log(`PATH ${req.path}`, error);

  if (error instanceof z.ZodError) {
    handleZodError(res, error);
    return;
  }

  if (error instanceof AppError) {
    handleAppError(res, error);
    return;
  }

  if (
    error.name?.includes('Mongo') ||
    error.name?.includes('ValidationError') ||
    error.name === 'CastError'
  ) {
    handleMongoError(req, res, error);
    return;
  }

  res
    .status(error.status || INTERNAL_SERVER_ERROR)
    .json({ message: error.message, status: error.status, stack: error.stack });
};
