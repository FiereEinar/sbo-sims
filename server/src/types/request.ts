import { Request } from 'express';
import { IUser } from '../models/user';

export interface CustomRequest extends Request {
	user?: IUser;
}
