import fs from 'fs';
import csvParser from 'csv-parser';
import { Request } from 'express';
import { Readable } from 'stream';

export const loadStudents = async (
	req: Request,
	filepath: string,
	save?: boolean
): Promise<boolean> => {
	try {
		await new Promise<void>((resolve, reject) => {
			fs.createReadStream(filepath)
				.pipe(csvParser())
				.on('data', async (row) => {
					try {
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

export const serverlessCSVLoader = async (
	req: Request,
	buffer: Buffer<ArrayBufferLike>,
	save?: boolean
): Promise<boolean> => {
	try {
		// Convert the buffer to a readable stream
		const stream = new Readable();
		stream.push(buffer);
		stream.push(null); // Indicates the end of the stream

		// Process the CSV data
		await new Promise<void>((resolve, reject) => {
			stream
				.pipe(csvParser())
				.on('data', async (row) => {
					try {
						// Required CSV headers
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

						// Create a new student object
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

						// Save the student to the database if the `save` flag is true
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
					console.error('Error reading CSV data:', error);
					reject(error);
				});
		});
	} catch (error) {
		console.error('Failed to process students:', error);
		return false;
	}

	return true;
};
