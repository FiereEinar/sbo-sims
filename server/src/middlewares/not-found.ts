import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../errors/http-error';

export const notFoundHandler = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const err = new HttpError('Not Found :(');
	err.status = 404;
	next(err);
};
