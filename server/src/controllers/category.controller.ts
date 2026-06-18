import asyncHandler from 'express-async-handler';
import appAssert from '../errors/appAssert';
import CategoryModel, { ICategory } from '../models/category.model';
import { UpdateQuery } from 'mongoose';
import CustomResponse, { CustomPaginatedResponse } from '../types/response';
import { TransactionQueryFilterRequest } from '../types/request';
import {
  BAD_REQUEST,
  NOT_FOUND,
  UNPROCESSABLE_ENTITY,
} from '../constants/http';
import {
  createCategoryBody,
  ICategoryWithTransactions,
  updateCategoryBody,
} from '../types/category';
import OrganizationModel from '../models/organization.model';
import StudentModel from '../models/student.model';
import TransactionModel from '../models/transaction.model';

/**
 * GET - fetch all categories
 */
export const get_all_category = asyncHandler(async (req, res) => {
  const categories = await CategoryModel.find({
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  }).populate({
    model: OrganizationModel,
    path: 'organization',
  });

  res.json(new CustomResponse(true, categories, 'All categories'));
});

/**
 * GET - fetch all categories along with its total transactions and total amount
 */
export const get_all_category_with_transactions_data = asyncHandler(
  async (req, res) => {
    const categoriesWithOrg = await CategoryModel.find({
      organization: req.tenantContext!.organizationId,
      semester: req.tenantContext!.semester,
      schoolYear: req.tenantContext!.schoolYear,
    }).populate({
      model: OrganizationModel,
      path: 'organization',
    });

    const categories = await CategoryModel.aggregate<ICategoryWithTransactions>(
      [
        {
          $match: {
            organization: req.tenantContext!.organizationId,
            semester: req.tenantContext!.semester,
            schoolYear: req.tenantContext!.schoolYear,
          },
        },
        {
          $lookup: {
            from: 'transactions',
            localField: '_id',
            foreignField: 'category',
            as: 'transaction',
          },
        },
        {
          $addFields: {
            totalTransactions: { $size: '$transaction' },
            totalTransactionsAmount: { $sum: '$transaction.amount' },
          },
        },
        {
          $project: {
            transaction: 0,
          },
        },
      ],
    );

    const orgMap = new Map(
      categoriesWithOrg.map((category) => [
        category._id.toString(),
        category.organization,
      ]),
    );

    categories.forEach((category) => {
      const org = orgMap.get(category._id.toString());
      if (org) category.organization = org;
    });

    res.json(
      new CustomResponse(
        true,
        categories,
        'All categories with transactions data',
      ),
    );
  },
);

/**
 * GET - fetch a category by ID in params
 */
export const get_category = asyncHandler(
  async (req: TransactionQueryFilterRequest, res) => {
    const { categoryID } = req.params;

    // check if the given category exists
    const category = await CategoryModel.findOne({
      _id: categoryID,
      organization: req.tenantContext!.organizationId,
      semester: req.tenantContext!.semester,
      schoolYear: req.tenantContext!.schoolYear,
    })
      .populate({
        model: OrganizationModel,
        path: 'organization',
      })
      .exec();

    appAssert(category, NOT_FOUND, `Category wit ID: ${categoryID} not found`);

    const categoryTransactions = req.filteredTransactions?.splice(
      req.skipAmount ?? 0,
      req.pageSizeNum,
    );

    res.json(
      new CustomPaginatedResponse(
        true,
        { category, categoryTransactions },
        'Category',
        req.nextPage ?? -1,
        req.prevPage ?? -1,
      ),
    );
  },
);

/**
 * GET - fetch the transactions made in a category
 */
export const get_category_transactions = asyncHandler(async (req, res) => {
  const { categoryID } = req.params;

  // check if the given category exists
  const category = await CategoryModel.findOne({
    _id: categoryID,
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  });
  appAssert(category, NOT_FOUND, `Category wit ID: ${categoryID} not found`);

  const categoryTransactions = await TransactionModel.find({
    category: category._id,
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  })
    .populate({ model: StudentModel, path: 'owner' })
    .populate({
      model: CategoryModel,
      path: 'category',
      populate: {
        model: OrganizationModel,
        path: 'organization',
      },
    })
    .exec();

  res.json(
    new CustomResponse(true, categoryTransactions, 'Category transactions'),
  );
});

/**
 * GET - fetch all students in the category's organization and their payment status
 */
export const get_category_student_status = asyncHandler(async (req, res) => {
  const { categoryID } = req.params;
  const { page, pageSize, search, course, status, year, section } = req.query;

  const category = await CategoryModel.findOne({
    _id: categoryID,
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  }).populate({
    model: OrganizationModel,
    path: 'organization',
  });
  appAssert(category, NOT_FOUND, `Category with ID ${categoryID} not found`);

  // 1. Get all students that belong to the organization
  let studentQuery: any = {
    course: { $in: category.organization.departments },
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  };
  if (course) {
    studentQuery.course = course;
  }
  if (year && year !== 'All') {
    studentQuery.year = parseInt(year as string);
  }
  if (section && section !== 'All') {
    studentQuery.section = { $regex: `^${section}$`, $options: 'i' };
  }
  if (search && typeof search === 'string') {
    const s = search.toLowerCase();
    studentQuery.$or = [
      { firstname: { $regex: s, $options: 'i' } },
      { lastname: { $regex: s, $options: 'i' } },
      { studentID: { $regex: s, $options: 'i' } },
    ];
  }

  const students = await StudentModel.find(studentQuery).lean();

  // 2. Get all transactions for this category
  const transactions = await TransactionModel.find({
    category: categoryID,
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  }).lean();
  const transactionMap = new Map(
    transactions.map((t) => [t.owner.toString(), t]),
  );

  // 3. Map students to their payment status
  let studentStatuses = students.map((student) => {
    const transaction = transactionMap.get(student._id.toString());
    const amountPaid = transaction ? transaction.amount : 0;
    let paymentStatus = 'unpaid';
    if (amountPaid >= category.fee) paymentStatus = 'paid';
    else if (amountPaid > 0) paymentStatus = 'partial';

    return {
      student,
      amountPaid,
      status: paymentStatus,
      transactionID: transaction ? transaction._id : null,
      datePayed: transaction?.date,
    };
  });

  // 4. Filter by status if provided
  if (status && status !== 'all') {
    studentStatuses = studentStatuses.filter((s) => s.status === status);
  }

  // 5. Pagination
  const pageNum = page ? parseInt(page as string) : 1;
  const pageSizeNum = pageSize ? parseInt(pageSize as string) : 50;
  const skipAmount = (pageNum - 1) * pageSizeNum;

  const total = studentStatuses.length;
  const paginatedStudents = studentStatuses.slice(
    skipAmount,
    skipAmount + pageSizeNum,
  );

  const nextPage = total > skipAmount + pageSizeNum ? pageNum + 1 : -1;
  const prevPage = pageNum > 1 ? pageNum - 1 : -1;

  res.json(
    new CustomPaginatedResponse(
      true,
      { category, students: paginatedStudents },
      'Student Payment Status',
      nextPage,
      prevPage,
    ),
  );
});

export const download_category_student_status_pdf = asyncHandler(
  async (req, res) => {
    const { categoryID } = req.params;
    const { search, course, status } = req.query;

    const category = await CategoryModel.findOne({
      _id: categoryID,
      organization: req.tenantContext!.organizationId,
      semester: req.tenantContext!.semester,
      schoolYear: req.tenantContext!.schoolYear,
    }).populate({
      model: OrganizationModel,
      path: 'organization',
    });
    appAssert(category, NOT_FOUND, `Category with ID ${categoryID} not found`);

    let studentQuery: any = {
      course: { $in: category.organization.departments },
      organization: req.tenantContext!.organizationId,
      semester: req.tenantContext!.semester,
      schoolYear: req.tenantContext!.schoolYear,
    };
    if (course) studentQuery.course = course;
    if (search && typeof search === 'string') {
      const s = search.toLowerCase();
      studentQuery.$or = [
        { firstname: { $regex: s, $options: 'i' } },
        { lastname: { $regex: s, $options: 'i' } },
        { studentID: { $regex: s, $options: 'i' } },
      ];
    }

    const students = await StudentModel.find(studentQuery).lean();
    const transactions = await TransactionModel.find({
      category: categoryID,
      organization: req.tenantContext!.organizationId,
      semester: req.tenantContext!.semester,
      schoolYear: req.tenantContext!.schoolYear,
    }).lean();
    const transactionMap = new Map(
      transactions.map((t) => [t.owner.toString(), t]),
    );

    let studentStatuses = students.map((student) => {
      const transaction = transactionMap.get(student._id.toString());
      const amountPaid = transaction ? transaction.amount : 0;
      let paymentStatus = 'unpaid';
      if (amountPaid >= category.fee) paymentStatus = 'paid';
      else if (amountPaid > 0) paymentStatus = 'partial';

      return {
        student,
        amountPaid,
        status: paymentStatus,
        datePayed: transaction?.date,
      };
    });

    if (status && status !== 'all') {
      studentStatuses = studentStatuses.filter((s) => s.status === status);
    }

    // For PDF, we can use a custom template or format it into an HTML table manually
    // Since we don't have a specific student-status.ejs yet, we can generate simple HTML
    const html = `
		<html>
		<head>
			<style>
				body { font-family: sans-serif; padding: 20px; }
				h1 { font-size: 20px; }
				h2 { font-size: 16px; color: #555; margin-bottom: 20px; }
				table { width: 100%; border-collapse: collapse; margin-top: 20px; }
				th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 12px; }
				th { background-color: #f4f4f4; }
			</style>
		</head>
		<body>
			<h1>Student Payment Status</h1>
			<h2>Category: ${category.name} (Fee: P${category.fee})</h2>
			<table>
				<thead>
					<tr>
						<th>Student ID</th>
						<th>Name</th>
						<th>Course</th>
						<th>Status</th>
						<th>Amount Paid</th>
						<th>Date Payed</th>
					</tr>
				</thead>
				<tbody>
					${studentStatuses
            .map(
              (s) => `
						<tr>
							<td>${s.student.studentID}</td>
							<td>${s.student.firstname} ${s.student.lastname}</td>
							<td>${s.student.course}</td>
							<td>${s.status.toUpperCase()}</td>
							<td>P${s.amountPaid}</td>
							<td>${s.datePayed ? new Date(s.datePayed).toLocaleDateString() : 'N/A'}</td>
						</tr>
					`,
            )
            .join('')}
				</tbody>
			</table>
		</body>
		</html>
	`;

    const { convertToPdf } = require('../services/pdfConverter');
    const buffer = await convertToPdf(html);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="student-status.pdf"',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  },
);

export const download_category_student_status_csv = asyncHandler(
  async (req, res) => {
    const { categoryID } = req.params;
    const { search, course, status } = req.query;

    const category = await CategoryModel.findOne({
      _id: categoryID,
      organization: req.tenantContext!.organizationId,
      semester: req.tenantContext!.semester,
      schoolYear: req.tenantContext!.schoolYear,
    }).populate({
      model: OrganizationModel,
      path: 'organization',
    });
    appAssert(category, NOT_FOUND, `Category with ID ${categoryID} not found`);

    let studentQuery: any = {
      course: { $in: category.organization.departments },
      organization: req.tenantContext!.organizationId,
      semester: req.tenantContext!.semester,
      schoolYear: req.tenantContext!.schoolYear,
    };
    if (course) studentQuery.course = course;
    if (search && typeof search === 'string') {
      const s = search.toLowerCase();
      studentQuery.$or = [
        { firstname: { $regex: s, $options: 'i' } },
        { lastname: { $regex: s, $options: 'i' } },
        { studentID: { $regex: s, $options: 'i' } },
      ];
    }

    const students = await StudentModel.find(studentQuery).lean();
    const transactions = await TransactionModel.find({
      category: categoryID,
      organization: req.tenantContext!.organizationId,
      semester: req.tenantContext!.semester,
      schoolYear: req.tenantContext!.schoolYear,
    }).lean();
    const transactionMap = new Map(
      transactions.map((t) => [t.owner.toString(), t]),
    );

    let studentStatuses = students.map((student) => {
      const transaction = transactionMap.get(student._id.toString());
      const amountPaid = transaction ? transaction.amount : 0;
      let paymentStatus = 'unpaid';
      if (amountPaid >= category.fee) paymentStatus = 'paid';
      else if (amountPaid > 0) paymentStatus = 'partial';

      return {
        student,
        amountPaid,
        status: paymentStatus,
        datePayed: transaction?.date,
      };
    });

    if (status && status !== 'all') {
      studentStatuses = studentStatuses.filter((s) => s.status === status);
    }

    const csv = studentStatuses.map((s) => {
      const name = `${s.student.firstname} ${s.student.lastname}`.replace(
        /,/g,
        '',
      );
      const dateStr = s.datePayed
        ? new Date(s.datePayed).toLocaleDateString()
        : 'N/A';
      return `${s.student.studentID},${name},${s.student.course},${s.status.toUpperCase()},${s.amountPaid},${dateStr}`;
    });

    csv.unshift('Student ID,Student Name,Course,Status,Amount Paid,Date Payed');

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'inline; filename="student-status.csv"',
    });
    res.send(csv.join('\n'));
  },
);

/**
 * POST - create a category
 */
export const create_category = asyncHandler(async (req, res) => {
  const { name, fee, details }: createCategoryBody = req.body;
  // check if the organization exists
  const organization = await OrganizationModel.findById(
    req.tenantContext!.organizationId,
  );
  appAssert(organization, NOT_FOUND, `Organization does not exist`);

  appAssert(fee > 0, BAD_REQUEST, 'Please enter a non-negative number for fee');

  // create and save the category
  const category = new CategoryModel({
    name: name,
    fee: fee,
    organization: req.tenantContext!.organizationId,
    details: details,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  });
  await category.save();

  res.json(new CustomResponse(true, category, 'Category created successfully'));
});

/**
 * PUT - update a category based on ID in params
 */
export const update_category = asyncHandler(async (req, res) => {
  const { categoryID } = req.params;
  const { name, fee, details }: updateCategoryBody = req.body;

  // appAssert(Array.isArray(details), BAD_REQUEST, 'Details should be an array');
  const organization = await OrganizationModel?.findById(
    req.tenantContext!.organizationId,
  );
  appAssert(organization, NOT_FOUND, `Organization not found`);

  appAssert(fee > 0, BAD_REQUEST, 'Please enter a non-negative number for fee');

  // create and save the category
  const update: UpdateQuery<ICategory> = {
    name: name,
    fee: fee,
    organization: req.tenantContext!.organizationId,
    details: details,
  };

  const result = await CategoryModel.findOneAndUpdate(
    {
      _id: categoryID,
      organization: req.tenantContext!.organizationId,
      semester: req.tenantContext!.semester,
      schoolYear: req.tenantContext!.schoolYear,
    },
    update,
    { new: true },
  ).exec();

  appAssert(
    result,
    NOT_FOUND,
    `Category with ID: ${categoryID} does not exist`,
  );

  res.json(new CustomResponse(true, result, 'Category updated successfully'));
});

/**
 * DELETE - delete a category by given ID in params
 */
export const delete_category = asyncHandler(async (req, res) => {
  const { categoryID } = req.params;

  const transactions = await TransactionModel?.find({
    category: categoryID,
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  }).exec();

  appAssert(
    !transactions || transactions.length === 0,
    UNPROCESSABLE_ENTITY,
    'The category has existing transactions, make sure to handle and delete them first',
  );

  const result = await CategoryModel.findOneAndDelete({
    _id: categoryID,
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  });
  appAssert(result, NOT_FOUND, `Category with ID ${categoryID} does not exist`);

  res.json(new CustomResponse(true, result, 'Category deleted successfully'));
});
