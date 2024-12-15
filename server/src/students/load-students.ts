import fs from 'fs';
import csvParser from 'csv-parser';
import { CustomRequest } from '../types/request';
import { Response } from 'express';

export const loadStudents = async (
	req: CustomRequest,
	res: Response
): Promise<void> => {
	const csvFilePaths = [
		'./src/students/STUDENTS_LIST_BSAT.csv',
		'./src/students/STUDENTS_LIST_BSIT.csv',
		'./src/students/STUDENTS_LIST_BSET.csv',
		'./src/students/STUDENTS_LIST_BSFT.csv',
		'./src/students/STUDENTS_LIST_BSEMC-DAT.csv',
	];

	csvFilePaths.forEach((csvFilePath) => {
		fs.createReadStream(csvFilePath)
			.pipe(csvParser())
			.on('data', async (row) => {
				try {
					if (!req.StudentModel) {
						console.log('StudentModel not attached');
						return;
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

					await newStudent.save();
				} catch (err) {
					console.error(`Failed to save student: ${row.studentID}`, err);
				}
			})
			.on('end', () => {
				console.log('CSV file processing completed');
			})
			.on('error', (error) => {
				console.error('Error reading CSV file:', error);
			});
	});
};
