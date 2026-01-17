import asyncHandler from 'express-async-handler';
import appAssert from '../errors/appAssert';
import { IStudent } from '../models/student';
import { createStudentBody } from '../types/student';
import { FilterQuery, PipelineStage, UpdateQuery } from 'mongoose';
import { validateEmail } from '../utils/utils';
import { serverlessCSVLoader } from '../services/csvLoader';
import { importStudentsFromFile, previewStudentsFromFile } from '../services/studentExcelLoader';
import CustomResponse, { CustomPaginatedResponse } from '../types/response';
import {
	BAD_REQUEST,
	CONFLICT,
	NOT_FOUND,
	UNPROCESSABLE_ENTITY,
} from '../constants/http';

/**
 * GET - fetch all students
 */
export const get_all_students = asyncHandler(async (req, res) => {
	const { page, pageSize, search, course, year, gender, sortBy } = req.query;

	const defaultPage = 1;
	const defaultPageSize = 100;

	const pageNum = page ? parseInt(page as string) : defaultPage;
	const pageSizeNum = pageSize ? parseInt(pageSize as string) : defaultPageSize;
	const skipAmount = (pageNum - 1 || 0) * pageSizeNum;

	const filters: FilterQuery<IStudent>[] = [];

	if (course) filters.push({ course: course });
	if (year) filters.push({ year: parseInt(year as string) });
	if (gender) filters.push({ gender: gender });
	if (search) {
		const searchRegex = new RegExp(search as string, 'i');
		filters.push({
			$or: [
				{ studentID: { $regex: searchRegex } },
				{ firstname: { $regex: searchRegex } },
				{ lastname: { $regex: searchRegex } },
				{ middlename: { $regex: searchRegex } },
				{ email: { $regex: searchRegex } },
				{ section: { $regex: searchRegex } },
			],
		});
	}

	const aggregatePipeline: PipelineStage[] = [
		{
			$lookup: {
				from: 'transactions',
				localField: '_id',
				foreignField: 'owner',
				as: 'transactions',
			},
		},
		{
			$addFields: {
				totalTransactions: { $size: '$transactions' },
				totalTransactionsAmount: { $sum: '$transactions.amount' },
			},
		},
		{
			$project: {
				transactions: 0,
			},
		},
		{
			$sort: {
				firstname: sortBy === 'dec' ? -1 : 1,
			},
		},
		{
			$skip: skipAmount,
		},
		{
			$limit: pageSizeNum,
		},
	];

	if (filters.length > 0) {
		aggregatePipeline.unshift({
			$match: {
				$and: filters,
			},
		});
	}

	const students = await req.StudentModel.aggregate(aggregatePipeline);

	const next =
		(await req.StudentModel.countDocuments({ $and: filters })) >
		skipAmount + pageSizeNum
			? pageNum + 1
			: -1;
	const prev = pageNum > 1 ? pageNum - 1 : -1;

	res.json(
		new CustomPaginatedResponse(true, students, 'All students', next, prev)
	);
});

/**
 * POST - import student from a csv file (legacy - exact headers required)
 */
export const post_csv_students = asyncHandler(async (req, res) => {
	const file = req.file;
	appAssert(file, BAD_REQUEST, 'Server did not recieve any file');

	appAssert(
		file.mimetype === 'text/csv',
		BAD_REQUEST,
		'File should be in csv format'
	);

	const valid = await serverlessCSVLoader(req, file.buffer);

	appAssert(
		valid,
		BAD_REQUEST,
		'File was not read succesfully, make sure to check if the headers are proper and the file format is correct'
	);

	await serverlessCSVLoader(req, file.buffer, true);

	res.json(new CustomResponse(true, null, 'File imported successfully'));
});

/**
 * POST - preview students from Excel/CSV file (smart detection)
 */
export const preview_students_import = asyncHandler(async (req, res) => {
	const file = req.file;
	appAssert(file, BAD_REQUEST, 'No file uploaded');

	const validMimeTypes = [
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'application/vnd.ms-excel',
		'text/csv',
	];
	appAssert(
		validMimeTypes.includes(file.mimetype),
		BAD_REQUEST,
		'File must be Excel (.xlsx, .xls) or CSV'
	);

	const previewResult = await previewStudentsFromFile(req, file.buffer);

	res.json(
		new CustomResponse(
			true,
			previewResult,
			`Preview: ${previewResult.valid.length} new, ${previewResult.existing.length} existing, ${previewResult.invalid.length} invalid`
		)
	);
});

/**
 * POST - import students from Excel/CSV file (smart detection)
 */
export const import_students_smart = asyncHandler(async (req, res) => {
	const file = req.file;
	const skipExisting = req.body.skipExisting !== 'false';

	appAssert(file, BAD_REQUEST, 'No file uploaded');

	const validMimeTypes = [
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'application/vnd.ms-excel',
		'text/csv',
	];
	appAssert(
		validMimeTypes.includes(file.mimetype),
		BAD_REQUEST,
		'File must be Excel (.xlsx, .xls) or CSV'
	);

	const importResult = await importStudentsFromFile(req, file.buffer, skipExisting);

	res.json(
		new CustomResponse(
			true,
			importResult,
			`Import: ${importResult.success} added, ${importResult.skipped} skipped, ${importResult.failed} failed`
		)
	);
});

/**
 * GET - get all the distinc courses of students
 */
export const get_available_course = asyncHandler(async (req, res) => {
	const courses = await req.StudentModel.find().distinct('course');

	res.json(new CustomResponse(true, courses, 'Students courses'));
});

/**
 * GET - fetch student data
 */
export const get_student = asyncHandler(async (req, res) => {
	const { studentID } = req.params;

	const student = await req.StudentModel.findOne({
		studentID: studentID,
	}).exec();
	appAssert(student, NOT_FOUND, `Student with ID ${studentID} does not exist`);

	res.json(new CustomResponse(true, student, 'Student data'));
});

/**
 * GET - fetch the transactions that a student have made
 */
export const get_student_transaction = asyncHandler(async (req, res) => {
	const { studentID } = req.params;

	const student = await req.StudentModel.findOne({
		studentID: studentID,
	}).exec();
	appAssert(student, NOT_FOUND, `Student with ID ${studentID} does not exist`);

	const studentTransactions = await req.TransactionModel.find({
		owner: student._id,
	})
		.populate({ model: req.StudentModel, path: 'owner' })
		.populate({
			model: req.CategoryModel,
			path: 'category',
			populate: { model: req.OrganizationModel, path: 'organization' },
		})
		.exec();

	res.json(
		new CustomResponse(true, studentTransactions, 'Student transactions')
	);
});

/**
 * POST - create a student
 */
export const create_student = asyncHandler(async (req, res) => {
	const {
		studentID,
		firstname,
		lastname,
		email,
		course,
		gender,
		year,
		middlename,
	}: createStudentBody = req.body;

	if (email?.length) {
		appAssert(validateEmail(email), BAD_REQUEST, 'Email must be valid');
	}

	const existingStudentWithID = await req.StudentModel.findOne({
		studentID: studentID,
	}).exec();
	appAssert(
		existingStudentWithID === null,
		CONFLICT,
		`Student with ID: ${studentID} already exists`
	);

	appAssert(
		gender === 'M' || gender === 'F',
		BAD_REQUEST,
		`Student gender can only be M or F`
	);

	appAssert(year > 0 && year <= 4, BAD_REQUEST, 'Student year can only be 1-4');

	// create the student and save
	const student = new req.StudentModel({
		studentID: studentID,
		firstname: firstname,
		lastname: lastname,
		email: email,
		course: course,
		gender: gender,
		middlename: middlename,
		year: year,
	});
	await student.save();

	res.json(new CustomResponse(true, student, 'Student created successfully'));
});

/**
 * PUT - update a student by studentID in params
 */
export const update_student = asyncHandler(async (req, res) => {
	const { studentID } = req.params;
	const {
		firstname,
		lastname,
		email,
		middlename,
		course,
		gender,
		year,
	}: Omit<createStudentBody, 'studentID'> = req.body;

	if (email?.length) {
		appAssert(validateEmail(email), BAD_REQUEST, 'Email must be valid');
	}

	// check if a student with the given ID exists
	const student = await req.StudentModel.findOne({ studentID: studentID });
	appAssert(student, NOT_FOUND, `Student with ID: ${studentID} not found`);

	if (gender) {
		appAssert(
			gender === 'M' || gender === 'F',
			BAD_REQUEST,
			`Student gender can only be M or F`
		);
	}

	// create the update query
	const update: UpdateQuery<IStudent> = {
		firstname: firstname || student.firstname,
		lastname: lastname || student.lastname,
		email: email || student.email,
		middlename: middlename || student.middlename,
		course: course || student.course,
		year: year || student.year,
		gender: gender || student.gender,
	};

	// update the student
	const updatedStudent = await req.StudentModel.findByIdAndUpdate(
		student._id,
		update,
		{
			new: true,
		}
	).exec();

	res.json(
		new CustomResponse(true, updatedStudent, 'Student updated successfully')
	);
});

/**
 * DELETE - delete a student by studentID in params
 */
export const delete_student = asyncHandler(async (req, res) => {
	const { studentID } = req.params;

	const student = await req.StudentModel.findOne({ studentID: studentID });
	appAssert(student, NOT_FOUND, `Student with ID: ${studentID} not found`);

	const transactions = await req.TransactionModel?.find({
		owner: student._id,
	}).exec();
	appAssert(
		!transactions || transactions.length === 0,
		UNPROCESSABLE_ENTITY,
		'The student has existing transactions record, make sure to handle and delete them first'
	);

	const result = await req.StudentModel.findByIdAndDelete(student._id);

	res.json(new CustomResponse(true, result, 'Student deleted successfully'));
});
