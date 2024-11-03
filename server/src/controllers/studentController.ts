import asyncHandler from 'express-async-handler';
import { IStudent } from '../models/student';
import { createStudentBody } from '../types/student';
import { FilterQuery, PipelineStage, UpdateQuery } from 'mongoose';
import CustomResponse, { CustomPaginatedResponse } from '../types/response';
import { validateEmail } from '../utils/utils';
import { loadStudents } from '../students/load-students';
import { CustomRequest } from '../types/request';

/**
 * GET - fetch all students
 */
export const get_all_students = asyncHandler(
	async (req: CustomRequest, res) => {
		const { page, pageSize, search, course, year, gender, sortBy } = req.query;
		if (!req.StudentModel) {
			res
				.status(500)
				.json(new CustomResponse(false, null, 'StudentModel not attached'));

			return;
		}

		const defaultPage = 1;
		const defaultPageSize = 100;

		const pageNum = page ? parseInt(page as string) : defaultPage;
		const pageSizeNum = pageSize
			? parseInt(pageSize as string)
			: defaultPageSize;
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
	}
);

/**
 * GET - get all the distinc courses of students
 */
export const get_available_course = asyncHandler(
	async (req: CustomRequest, res) => {
		if (!req.StudentModel) {
			res
				.status(500)
				.json(new CustomResponse(false, null, 'StudentModel not attached'));

			return;
		}

		const courses = await req.StudentModel.find().distinct('course');

		res.json(new CustomResponse(true, courses, 'Students courses'));
	}
);

/**
 * GET - fetch student data
 */
export const get_student = asyncHandler(async (req: CustomRequest, res) => {
	const { studentID } = req.params;
	if (!req.StudentModel) {
		res
			.status(500)
			.json(new CustomResponse(false, null, 'StudentModel not attached'));

		return;
	}

	const student = await req.StudentModel.findOne({
		studentID: studentID,
	}).exec();

	if (student === null) {
		res.json(
			new CustomResponse(
				false,
				null,
				`Student with ID ${studentID} does not exist`
			)
		);
		return;
	}

	res.json(new CustomResponse(true, student, 'Student data'));
});

/**
 * GET - fetch the transactions that a student have made
 */
export const get_student_transaction = asyncHandler(
	async (req: CustomRequest, res) => {
		const { studentID } = req.params;
		if (!req.StudentModel || !req.TransactionModel) {
			res
				.status(500)
				.json(
					new CustomResponse(
						false,
						null,
						'StudentModel & TransactionModel not attached'
					)
				);

			return;
		}

		const student = await req.StudentModel.findOne({
			studentID: studentID,
		}).exec();

		if (student === null) {
			res.json(
				new CustomResponse(
					false,
					null,
					`Student with ID ${studentID} does not exist`
				)
			);
			return;
		}

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
	}
);

/**
 * POST - create a student
 */
export const create_student = asyncHandler(async (req: CustomRequest, res) => {
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
	if (!req.StudentModel) {
		res
			.status(500)
			.json(new CustomResponse(false, null, 'StudentModel not attached'));

		return;
	}

	if (email?.length && !validateEmail(email)) {
		res.json(
			new CustomResponse(
				false,
				null,
				'Error in form validation',
				'Email must be valid'
			)
		);
		return;
	}

	const existingStudentWithID = await req.StudentModel.findOne({
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

	if (gender !== 'M' && gender !== 'F') {
		res.json(
			new CustomResponse(false, null, `Student gender can only be M or F`)
		);
		return;
	}

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
export const update_student = asyncHandler(async (req: CustomRequest, res) => {
	const { studentID } = req.params;
	const { firstname, lastname, email }: Omit<createStudentBody, 'studentID'> =
		req.body;

	if (!req.StudentModel) {
		res
			.status(500)
			.json(new CustomResponse(false, null, 'StudentModel not attached'));

		return;
	}

	if (email?.length && !validateEmail(email)) {
		res.json(
			new CustomResponse(
				false,
				null,
				'Error in form validation',
				'Email must be valid'
			)
		);
		return;
	}

	// check if a student with the given ID exists
	const student = await req.StudentModel.findOne({ studentID: studentID });
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
export const delete_student = asyncHandler(async (req: CustomRequest, res) => {
	const { studentID } = req.params;

	if (!req.StudentModel) {
		res
			.status(500)
			.json(new CustomResponse(false, null, 'StudentModel not attached'));

		return;
	}

	const student = await req.StudentModel.findOne({ studentID: studentID });

	if (student === null) {
		res.json(
			new CustomResponse(false, null, `Student with ID: ${studentID} not found`)
		);
		return;
	}

	const transactions = await req.TransactionModel?.find({
		owner: student._id,
	}).exec();

	if (transactions && transactions.length > 0) {
		res.json(
			new CustomResponse(
				false,
				null,
				'The student has existing transactions record, make sure to handle and delete them first'
			)
		);
		return;
	}

	const result = await req.StudentModel.findByIdAndDelete(student._id);

	res.json(new CustomResponse(true, result, 'Student deleted successfully'));
});

export const load_all_students = asyncHandler(
	async (req: CustomRequest, res) => {
		await loadStudents(req, res);
		res.json({ message: 'done' });
	}
);
