import mongoose from 'mongoose';
import fs from 'fs';
import csvParser from 'csv-parser';
import { getDatabaseConnection } from '../database/databaseManager';
import { DB_MODEL, originalDbName } from '../constants';
import { StudentSchema } from '../models/student';

export const loadStudents = async (): Promise<void> => {
	const dbURI = process.env.MONGO_URI;

	const connection = await getDatabaseConnection(
		originalDbName,
		dbURI as string
	);
	const Student = connection.model(DB_MODEL.STUDENT, StudentSchema);

	// const csvFilePaths = ['./src/students/STUDENTS_LIST_BSEMC-DAT.csv'];
	const csvFilePaths = [
		'./src/students/STUDENTS_LIST_BSAT.csv',
		'./src/students/STUDENTS_LIST_BSIT.csv',
		'./src/students/STUDENTS_LIST_BSET.csv',
		'./src/students/STUDENTS_LIST_BSFT.csv',
	];

	csvFilePaths.forEach((csvFilePath) => {
		fs.createReadStream(csvFilePath)
			.pipe(csvParser())
			.on('data', async (row) => {
				try {
					const newStudent = new Student({
						firstname: row.firstname,
						lastname: row.lastname,
						studentID: row.studentID,
						course: row.course,
						year: parseInt(row.year),
						gender: row.gender,
						email: '',
						middlename: row.middlename,
					});

					// console.log(newStudent);

					await newStudent.save();
					console.log(`Saved student: ${row.studentID}`);
				} catch (err) {
					console.error(`Failed to save student: ${row.studentID}`, err);
				}
			})
			.on('end', () => {
				console.log('CSV file processing completed');
				// mongoose.connection.close();
			})
			.on('error', (error) => {
				console.error('Error reading CSV file:', error);
			});
	});
};
