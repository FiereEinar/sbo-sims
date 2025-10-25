export type createPrelistingBody = {
	studentID: string;
	categoryID: string;
	description?: string;
	date?: Date;
	details: { [key: string]: any };
};
