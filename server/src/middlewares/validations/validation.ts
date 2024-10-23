import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import CustomResponse from '../../types/response';

export const isValidMongooseId = (stringID: string) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const id = req.params[stringID];

		if (!mongoose.isValidObjectId(id)) {
			res.json(new CustomResponse(false, null, `${id} is not a valid ID`));
			return;
		}
	};
};
