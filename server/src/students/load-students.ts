import mongoose from 'mongoose';
import fs from 'fs';
import Student from '../models/student';
import csvParser from 'csv-parser';

export const loadStudents = async (): Promise<void> => {
	const csvFilePath = './src/students/STUDENTS_LIST_BSEMC-DAT.csv';

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
};
