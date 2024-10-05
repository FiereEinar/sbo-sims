export default class CustomResponse {
	success: boolean;
	data: any;
	message: string;
	error?: string | undefined;

	constructor(
		success: boolean,
		data: any,
		message: string,
		error?: string | undefined
	) {
		this.success = success;
		this.data = data;
		this.message = message;
		this.error = error;
	}
}
