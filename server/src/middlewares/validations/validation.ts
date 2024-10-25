import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import CustomResponse from '../../types/response';
import { validationResult } from 'express-validator';

type isValidMongooseIdOptions = {
	from: 'params' | 'body';
};

export const isValidMongooseId = (
	stringID: string,
	options: isValidMongooseIdOptions
) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const id = req[options.from][stringID];

		if (!mongoose.isValidObjectId(id)) {
			res.json(new CustomResponse(false, null, `${id} is not a valid ID`));
			return;
		}

		next();
	};
};

export const isFormBodyValidated = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		res.json(
			new CustomResponse(
				false,
				null,
				'Error in form validation',
				errors.array()[0].msg
			)
		);
		return;
	}

	next();
};
