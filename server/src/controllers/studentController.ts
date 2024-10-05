import asyncHandler from 'express-async-handler';
import Student from '../models/student';
import Transaction from '../models/transaction';
import Category from '../models/category';

/**
 * GET - fetch all students
 */
export const get_all_students = asyncHandler(async (req, res) => {
	const students = await Student.find();
	res.json({ message: 'All students', data: students });
});

/**
 * GET - fetch student data
 */
export const get_student = asyncHandler(async (req, res) => {
	const { studentID } = req.params;
	const student = await Student.findOne({ studentID: studentID })
		.populate({
			model: Transaction,
			path: 'transactions',
			populate: {
				model: Category,
				path: 'category',
			},
		})
		.exec();

	res.json({ message: 'Student data', data: student });
});
