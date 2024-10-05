export interface HttpError extends Error {
	status?: number;
}

export class HttpError extends Error {
	status?: number;

	constructor(message: string) {
		super(message);
	}
}
