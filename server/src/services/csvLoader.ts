import fs from 'fs';
import csvParser from 'csv-parser';
import { CustomRequest } from '../types/request';

export const loadStudents = async (
	req: CustomRequest,
	filepath: string,
	save?: boolean
): Promise<boolean> => {
	try {
		await new Promise<void>((resolve, reject) => {
			fs.createReadStream(filepath)
				.pipe(csvParser())
				.on('data', async (row) => {
					try {
						if (!req.StudentModel) {
							throw new Error('StudentModel not attached');
						}

						// requried csv headers
						const requiredHeaders = [
							'firstname',
							'lastname',
							'studentID',
							'course',
							'gender',
							'year',
							'middlename',
						];

						const hasAllHeaders = requiredHeaders.every(
							(header) => row[header] !== undefined
						);

						if (!hasAllHeaders) {
							throw new Error('CSV headers are incorrect');
						}

						const newStudent = new req.StudentModel({
							firstname: row.firstname,
							lastname: row.lastname,
							studentID: row.studentID,
							course: row.course,
							year: parseInt(row.year),
							gender: row.gender,
							email: '',
							middlename: row.middlename,
						});

						if (save) {
							await newStudent.save();
						}
					} catch (err) {
						console.error(
							`Error processing student row: ${JSON.stringify(row)}`,
							err
						);
						reject(err);
					}
				})
				.on('end', () => resolve())
				.on('error', (error) => {
					console.error('Error reading CSV file:', error);
					reject(error);
				});
		});
	} catch (error) {
		console.error('Failed to process students:', error);
		return false;
	}

	return true;
};
