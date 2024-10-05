import asyncHandler from 'express-async-handler';
import Student, { IStudent } from '../models/student';
import Transaction from '../models/transaction';
import Category from '../models/category';
import { createStudentBody } from '../types/student';
import { validationResult } from 'express-validator';
import CustomResponse from '../utils/custom-response';
import { UpdateQuery } from 'mongoose';

/**
 * GET - fetch all students
 */
export const get_all_students = asyncHandler(async (req, res) => {
	const students = await Student.find();

	res.json(new CustomResponse(true, students, 'All students'));
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

	res.json(new CustomResponse(true, student, 'Student data'));
});

/**
 * POST - create a student
 */
export const create_student = asyncHandler(async (req, res) => {
	const { studentID, firstname, lastname, email }: createStudentBody = req.body;

	// check for errors in validation
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		res.json(
			new CustomResponse(
				false,
				null,
				'Error in body validation',
				errors.array()[0].msg
			)
		);
		return;
	}

	const existingStudentWithID = await Student.findOne({
		studentID: studentID,
	}).exec();
	if (existingStudentWithID !== null) {
		res.json(
			new CustomResponse(
				false,
				null,
				`Student with ID: ${studentID} already exists`
			)
		);
		return;
	}

	// create the student and save
	const student = new Student({
		studentID: studentID,
		firstname: firstname,
		lastname: lastname,
		email: email,
	});
	await student.save();

	res.json(new CustomResponse(true, student, 'Student created successfully'));
});

/**
 * PUT - update a student by studentID in params
 */
export const update_student = asyncHandler(async (req, res) => {
	const { studentID } = req.params;
	const { firstname, lastname, email }: Omit<createStudentBody, 'studentID'> =
		req.body;

	// check for errors in validation
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		res.json(
			new CustomResponse(
				false,
				null,
				'Error in body validation',
				errors.array()[0].msg
			)
		);
		return;
	}

	// check if a student with the given ID exists
	const student = await Student.findOne({ studentID: studentID });
	if (student === null) {
		res.json(
			new CustomResponse(false, null, `Student with ID: ${studentID} not found`)
		);
		return;
	}

	// create the update query
	const update: UpdateQuery<IStudent> = {
		firstname: firstname,
		lastname: lastname,
		email: email,
	};

	// update the student
	const updatedStudent = await Student.findByIdAndUpdate(student._id, update, {
		new: true,
	}).exec();

	res.json(
		new CustomResponse(true, updatedStudent, 'Student updated successfully')
	);
});

/**
 * DELETE - delete a student by studentID in params
 */
export const delete_student = asyncHandler(async (req, res) => {
	const { studentID } = req.params;

	// check if a student with the given ID exists
	const student = await Student.findOne({ studentID: studentID });
	if (student === null) {
		res.json(
			new CustomResponse(false, null, `Student with ID: ${studentID} not found`)
		);
		return;
	}

	await Student.findByIdAndDelete(student._id);

	res.json(new CustomResponse(true, null, 'Student deleted successfully'));
});
