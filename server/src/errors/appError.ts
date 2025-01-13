import { AppErrorCodes } from '../constants';
import { HttpStatusCode } from '../constants/http';

class AppError extends Error {
	constructor(
		public statusCode: HttpStatusCode,
		public message: string,
		public errorCode?: AppErrorCodes
	) {
		super(message);
	}
}

export default AppError;
