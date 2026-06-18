import ejs from 'ejs';
import _, { startCase } from 'lodash';
import path from 'path';
import fs from 'fs/promises';
import asyncHandler from 'express-async-handler';
import appAssert from '../errors/appAssert';
import CategoryModel, { ICategory } from '../models/category.model';
import { UpdateQuery } from 'mongoose';
import TransactionModel, { ITransaction } from '../models/transaction.model';
import { TransactionQueryFilterRequest } from '../types/request';
import { getEJSTransactionsData, getPeriodLabel } from '../utils/utils';
import CustomResponse, { CustomPaginatedResponse } from '../types/response';
import { convertToPdf } from '../services/pdfConverter';
import { addDays, format, isBefore, startOfDay } from 'date-fns';
import { BAD_REQUEST, CONFLICT, NOT_FOUND } from '../constants/http';
import {
  batchCreateTransactionBody,
  createTransactionBody,
  TransactionEJSVariables,
  updateTransactionAmountBody,
} from '../types/transaction';
import {
  importTransactionsFromExcel,
  previewTransactionsFromExcel,
} from '../services/excelLoader';
import UserModel from '../models/user.model';
import OrganizationModel from '../models/organization.model';
import StudentModel from '../models/student.model';

/**
 * GET - fetch all transactions made
 */
export const get_all_transactions = asyncHandler(
  async (req: TransactionQueryFilterRequest, res) => {
    const splicedFilteredTransactions = req.filteredTransactions?.splice(
      req.skipAmount ?? 0,
      req.pageSizeNum,
    );

    res.json(
      new CustomPaginatedResponse(
        true,
        splicedFilteredTransactions,
        'All transactions',
        req.nextPage ?? -1,
        req.prevPage ?? -1,
      ),
    );
  },
);

/**
 * GET - get a pdf file result of transactions
 */
export const get_transaction_list_file = asyncHandler(
  async (req: TransactionQueryFilterRequest, res) => {
    if (!req.filteredTransactions) return;

    // read the template
    const template = await fs.readFile(
      path.join(__dirname, '../', 'templates', 'transactionsPDF.ejs'),
      { encoding: 'utf8' },
    );

    const startDateString = req.query.startDate
      ? format(new Date(req.query.startDate as string), 'MMMM dd, yyyy')
      : 'start';
    const endDateString = req.query.endDate
      ? format(new Date(req.query.endDate as string), 'MMMM dd, yyyy')
      : 'present';

    // create an object with the necessary data to be injected in ejs template
    let EJSData: TransactionEJSVariables = {
      startDate: startDateString,
      endDate: endDateString,
      period: getPeriodLabel(req.query.period as string) ?? 'Today',
      totalAmount: 0,
      transactions: [],
    };

    // push a formatted data into EJSData.transactions for each transactions
    const { EJSTransactions, totalAmount } = getEJSTransactionsData(
      req.filteredTransactions,
    );
    EJSData.transactions = EJSTransactions;
    EJSData.totalAmount = totalAmount;

    // inject the EJSData into the template
    const html = ejs.render(template, EJSData);

    // this function will spit out a pdf file in public directory
    const buffer = await convertToPdf(html);

    // set response headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="transactions.pdf"',
      'Content-Length': buffer.length,
    });

    // send the buffer
    res.end(buffer);
  },
);

/**
 * GET - get a csv file result of transactions
 */
export const get_transaction_list_csv = asyncHandler(
  async (req: TransactionQueryFilterRequest, res) => {
    if (!req.filteredTransactions) return;

    const csv = req.filteredTransactions.map((transaction) => {
      const { amount, date, category, owner, details } = transaction;

      const ownerName = startCase(
        `${owner.firstname} ${owner.middlename} ${owner.lastname}`,
      );
      const datePayed = format(date || new Date(), 'M/dd/yyyy');
      let categoryDetails = '';

      category.details.map((detail) => {
        categoryDetails = categoryDetails.concat(`${details[detail]},`);
      });

      return (
        `${owner.studentID},${ownerName},${owner.course},${amount},${datePayed},` +
        categoryDetails
      );
    });

    // add csv header
    let header = 'Student ID,Student Name,Course,Amount,Date Payed,';
    req.filteredTransactions[0].category.details.map((detail) => {
      header = header.concat(`${detail},`);
    });

    csv.unshift(header);

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'inline; filename="transactions.csv"',
    });

    res.send(csv.join('\n'));
  },
);

/**
 * GET - dashboard data
 */
export const get_dashboard_data = asyncHandler(async (req, res) => {
  /**
   * Transactions related logic
   */
  const prevMonth = new Date();
  prevMonth.setDate(0); // Sets to the last day of the previous month

  // Calculate overall totals and previous month totals in a single pass using Facets
  const totals = await TransactionModel.aggregate([
    {
      $match: {
        organization: req.tenantContext!.organizationId,
        semester: req.tenantContext!.semester,
        schoolYear: req.tenantContext!.schoolYear,
      },
    },
    {
      $facet: {
        overall: [
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$amount' },
              totalTransactions: { $sum: 1 },
            },
          },
        ],
        lastMonth: [
          {
            $match: {
              date: { $lt: prevMonth.toISOString() }, // Mongoose stores dates as ISO strings in this schema
            },
          },
          {
            $group: {
              _id: null,
              totalRevenueLastMonth: { $sum: '$amount' },
              totalTransactionLastMonth: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  const totalRevenue = totals?.[0]?.overall[0]?.totalRevenue || 0;
  const totalTransaction = totals?.[0]?.overall[0]?.totalTransactions || 0;
  const totalRevenueLastMonth =
    totals?.[0]?.lastMonth[0]?.totalRevenueLastMonth || 0;
  const totalTransactionLastMonth =
    totals?.[0]?.lastMonth[0]?.totalTransactionLastMonth || 0;

  const transactions = await TransactionModel.aggregate([
    {
      $match: {
        organization: req.tenantContext!.organizationId,
        semester: req.tenantContext!.semester,
        schoolYear: req.tenantContext!.schoolYear,
      },
    },
    {
      $group: {
        _id: '$date',
        totalAmount: { $sum: '$amount' },
      },
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        totalAmount: 1,
      },
    },
    {
      $sort: { date: 1 },
    },
    {
      $limit: 90, // 3 months
    },
  ]);

  const transactionsToday = await TransactionModel.countDocuments({
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
    $and: [
      { date: { $gte: startOfDay(new Date()).toISOString() } },
      { date: { $lt: startOfDay(addDays(new Date(), 1)).toISOString() } },
    ],
  });

  /**
   * Categories related logic
   */
  type CategoryObjResponse = {
    category: ICategory;
    totalAmount: number;
    totalTransactions: number;
  };

  // Get all categories populated with organizations
  const categories = await CategoryModel.find({
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  })
    .populate({
      model: OrganizationModel,
      path: 'organization',
    })
    .lean();

  // Calculate stats grouped by category in the DB
  const categoryStats = await TransactionModel.aggregate([
    {
      $match: {
        organization: req.tenantContext!.organizationId,
        semester: req.tenantContext!.semester,
        schoolYear: req.tenantContext!.schoolYear,
      },
    },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
      },
    },
  ]);

  const statsMap = new Map();
  categoryStats?.forEach((stat) => {
    statsMap.set(stat._id.toString(), {
      totalAmount: stat.totalAmount,
      totalTransactions: stat.totalTransactions,
    });
  });

  // Merge DB stats with populated categories
  const categoriesArray: CategoryObjResponse[] =
    categories?.map((cat) => {
      const stats = statsMap.get(cat._id.toString()) || {
        totalAmount: 0,
        totalTransactions: 0,
      };
      return {
        category: cat as unknown as ICategory,
        totalAmount: stats.totalAmount,
        totalTransactions: stats.totalTransactions,
      };
    }) || [];

  /**
   * Students related logic
   */
  const totalStudents = await StudentModel?.countDocuments({
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  });

  res.json(
    new CustomResponse(
      true,
      {
        totalRevenue,
        totalRevenueLastMonth,
        totalTransaction,
        totalTransactionLastMonth,
        transactionsToday,
        totalStudents,
        transactions,
        categories: categoriesArray,
      },
      'Dashboard data',
    ),
  );
});

/**
 * GET - get a specific transaction based on ID from params
 */
export const get_transaction = asyncHandler(async (req, res) => {
  const { transactionID } = req.params;

  const transaction = await TransactionModel.findOne({
    _id: transactionID,
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  })
    .populate({
      model: CategoryModel,
      path: 'category',
      populate: {
        model: OrganizationModel,
        path: 'organization',
      },
    })
    .populate({
      model: StudentModel,
      path: 'owner',
    })
    .populate({
      model: UserModel,
      path: 'recordedBy',
    });

  appAssert(
    transaction,
    NOT_FOUND,
    `Transaction with ID: ${transactionID} not found`,
  );

  res.json(new CustomResponse(true, transaction, 'Transaction'));
});

/**
 * POST - create and save a transaction
 */
export const create_transaction = asyncHandler(async (req, res) => {
  const {
    amount,
    categoryID,
    date,
    description,
    studentID,
    details,
    modeOfPayment,
  }: createTransactionBody = req.body;
  const user = req.currentUser!;

  // check if the category exists
  const category = await CategoryModel.findById<ICategory>(categoryID).populate(
    {
      model: OrganizationModel,
      path: 'organization',
    },
  );
  appAssert(category, NOT_FOUND, `Category with ID ${categoryID} not found`);

  // check if the amount paid is non-negative
  appAssert(amount > 0, BAD_REQUEST, `Enter a valid amount`);

  // check if the student with the given ID exists
  const student = await StudentModel.findOne({
    studentID: studentID,
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  }).exec();
  appAssert(student, NOT_FOUND, `Student with ID: ${studentID} not found`);

  // check if the student is within the organization
  const isInOrganization = category.organization.departments.includes(
    student.course,
  );
  appAssert(
    isInOrganization,
    BAD_REQUEST,
    `Student with ID: ${student.studentID} does not belong in the ${category.organization.name} organization. Please double check the student course if it exactly matches the departments under ${category.organization.name}`,
  );

  const paymentDate = date ? new Date(date as any) : new Date();
  const paymentMode = modeOfPayment || 'cash';

  // check if an existing transaction exists for this student + category
  const existingTransaction = await TransactionModel.findOne({
    owner: student._id,
    category: category._id,
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  }).exec();

  if (existingTransaction) {
    // already fully paid
    appAssert(
      existingTransaction.amount < category.fee,
      CONFLICT,
      `This student has already fully paid for ${category.name}`,
    );

    // top-up: validate new total doesn't exceed fee
    const numericAmount = Number(amount);
    const newTotal = existingTransaction.amount + numericAmount;
    appAssert(
      newTotal <= category.fee,
      BAD_REQUEST,
      `Top-up would exceed the required fee for ${category.name}. Remaining balance: ${category.fee - existingTransaction.amount}`,
    );

    const updatedTransaction = await TransactionModel.findByIdAndUpdate(
      existingTransaction._id,
      {
        $inc: { amount: numericAmount },
        $push: {
          paymentHistory: {
            amount: numericAmount,
            date: paymentDate,
            modeOfPayment: paymentMode,
          },
        },
      },
      { new: true },
    ).exec();

    res.json(
      new CustomResponse(
        true,
        updatedTransaction,
        'Payment topped up successfully',
      ),
    );
    return;
  }

  // check if the amount paid is over the amount required for a category
  appAssert(
    amount <= category.fee,
    BAD_REQUEST,
    `The amount is over the required amount for ${category.name} fee. Fee is ${category.fee}`,
  );

  const detailsObj: { [key: string]: any } = {};
  category.details.map((detail) => {
    detailsObj[detail] = details[detail];
  });

  // create and save the transaction
  const transaction = new TransactionModel({
    amount: amount,
    category: categoryID,
    owner: student._id,
    description: description,
    date: paymentDate.toISOString(),
    modeOfPayment: paymentMode,
    governor: category.organization.governor,
    viceGovernor: category.organization.viceGovernor,
    treasurer: category.organization.treasurer,
    auditor: category.organization.auditor,
    details: detailsObj,
    recordedBy: user._id,
    paymentHistory: [
      {
        amount,
        date: paymentDate,
        modeOfPayment: paymentMode,
      },
    ],
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  });
  await transaction.save();

  res.json(
    new CustomResponse(true, transaction, 'Transaction saved successfully'),
  );
});

/**
 * POST - create multiple transactions at once (batch)
 */
export const create_batch_transactions = asyncHandler(async (req, res) => {
  const {
    studentID,
    date,
    description,
    modeOfPayment,
    items,
  }: batchCreateTransactionBody = req.body;
  const user = req.currentUser!;

  appAssert(
    items && items.length > 0,
    BAD_REQUEST,
    'At least one category entry is required',
  );

  // validate student once
  const student = await StudentModel.findOne({
    studentID,
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  }).exec();
  appAssert(student, NOT_FOUND, `Student with ID: ${studentID} not found`);

  // validate all items first before creating any
  const validatedItems = [];
  for (const item of items) {
    const category = await CategoryModel.findById<ICategory>(
      item.categoryID,
    ).populate({
      model: OrganizationModel,
      path: 'organization',
    });
    appAssert(
      category,
      NOT_FOUND,
      `Category with ID ${item.categoryID} not found`,
    );

    appAssert(
      item.amount > 0,
      BAD_REQUEST,
      `Enter a valid amount for ${category.name}`,
    );

    const isAlreadyPaid = await TransactionModel.findOne({
      owner: student._id,
      category: category._id,
      organization: req.tenantContext!.organizationId,
      semester: req.tenantContext!.semester,
      schoolYear: req.tenantContext!.schoolYear,
    }).exec();

    let isTopUp = false;
    if (isAlreadyPaid) {
      appAssert(
        isAlreadyPaid.amount < category.fee,
        CONFLICT,
        `This student has already fully paid for ${category.name}`,
      );

      const numericAmount = Number(item.amount);
      const newTotal = isAlreadyPaid.amount + numericAmount;
      appAssert(
        newTotal <= category.fee,
        BAD_REQUEST,
        `Top-up for ${category.name} would exceed the required fee. Remaining balance: ${category.fee - isAlreadyPaid.amount}`,
      );
      isTopUp = true;
    } else {
      appAssert(
        item.amount <= category.fee,
        BAD_REQUEST,
        `The amount is over the required amount for ${category.name} fee. Fee is ${category.fee}`,
      );
    }

    const isInOrganization = category.organization.departments.includes(
      student.course,
    );
    appAssert(
      isInOrganization,
      BAD_REQUEST,
      `Student with ID: ${student.studentID} does not belong in the ${category.organization.name} organization`,
    );

    const detailsObj: { [key: string]: any } = {};
    category.details.map((detail) => {
      detailsObj[detail] = item.details?.[detail];
    });

    validatedItems.push({
      category,
      detailsObj,
      amount: item.amount,
      isTopUp,
      existingTransaction: isAlreadyPaid,
    });
  }

  const paymentDate = date ? new Date(date as any) : new Date();
  const paymentMode = modeOfPayment || 'cash';

  // all validations passed, create or update all transactions
  const transactions = [];
  for (const item of validatedItems) {
    if (item.isTopUp && item.existingTransaction) {
      const numericAmount = Number(item.amount);
      const updatedTransaction = await TransactionModel.findByIdAndUpdate(
        item.existingTransaction._id,
        {
          $inc: { amount: numericAmount },
          $push: {
            paymentHistory: {
              amount: numericAmount,
              date: paymentDate,
              modeOfPayment: paymentMode,
            },
          },
        },
        { new: true },
      ).exec();
      transactions.push(updatedTransaction);
    } else {
      const transaction = new TransactionModel({
        amount: item.amount,
        category: item.category._id,
        owner: student._id,
        description: description,
        date: paymentDate.toISOString(),
        modeOfPayment: paymentMode,
        governor: item.category.organization.governor,
        viceGovernor: item.category.organization.viceGovernor,
        treasurer: item.category.organization.treasurer,
        auditor: item.category.organization.auditor,
        details: item.detailsObj,
        recordedBy: user._id,
        paymentHistory: [
          {
            amount: item.amount,
            date: paymentDate,
            modeOfPayment: paymentMode,
          },
        ],
        organization: req.tenantContext!.organizationId,
        semester: req.tenantContext!.semester,
        schoolYear: req.tenantContext!.schoolYear,
      });
      await transaction.save();
      transactions.push(transaction);
    }
  }

  res.json(
    new CustomResponse(
      true,
      transactions,
      `${transactions.length} transaction(s) saved successfully`,
    ),
  );
});

/**
 * DELETE - delete a transaction by given ID in params
 */
export const delete_transaction = asyncHandler(async (req, res) => {
  const { transactionID } = req.params;

  const result = await TransactionModel.findOneAndDelete({
    _id: transactionID,
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  });
  appAssert(
    result,
    NOT_FOUND,
    `Transaction with ID: ${transactionID} does not exists`,
  );

  res.json(
    new CustomResponse(true, result, 'Transaction deleted successfully'),
  );
});

/**
 * PUT - update a transaction based on ID in params
 */
export const update_transaction = asyncHandler(async (req, res) => {
  const { transactionID } = req.params;
  const {
    amount,
    categoryID,
    date,
    description,
    studentID,
    details,
    modeOfPayment,
  }: createTransactionBody = req.body;

  // check if the category exists
  const category = await CategoryModel.findById(categoryID).populate({
    model: OrganizationModel,
    path: 'organization',
  });
  appAssert(category, NOT_FOUND, `Category with ID ${categoryID} not found`);

  // check if the amount paid is over the amount required for a category
  appAssert(
    amount <= category.fee,
    BAD_REQUEST,
    `The amount is over the required amount for ${category.name} fee (${category.fee})`,
  );

  // check if the amount paid is non-negative
  appAssert(amount > 0, BAD_REQUEST, 'Enter a valid amount');

  // check if the student with the given ID exists
  const student = await StudentModel.findOne({
    studentID: studentID,
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  }).exec();
  appAssert(student, NOT_FOUND, `Student with ID: ${studentID} not found`);

  // check if the student is within the organization
  const isInOrganization = category.organization.departments.includes(
    student.course,
  );
  appAssert(
    isInOrganization,
    BAD_REQUEST,
    `Student with ID: ${student.studentID} does not belong in the ${category.organization.name} organization. Please double check the student course if it exactly matches the departments under ${category.organization.name}`,
  );

  const detailsObj: { [key: string]: any } = {};
  category.details.map((detail) => {
    detailsObj[detail] = details[detail];
  });

  // create update query and save the transaction
  const update: UpdateQuery<ITransaction> = {
    amount: amount,
    category: categoryID,
    owner: student._id,
    description: description,
    date: date?.toISOString(),
    modeOfPayment: modeOfPayment || 'cash',
    details: detailsObj,
  };

  const result = await TransactionModel.findOneAndUpdate(
    {
      _id: transactionID,
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
    `Transaction with ID: ${transactionID} not found`,
  );

  res.json(
    new CustomResponse(true, result, 'Transaction updated successfully'),
  );
});

// TODO: add a new route specifically for updating the amount paid
export const update_transaction_amount = asyncHandler(async (req, res) => {
  const { transactionID } = req.params;
  const { amount }: updateTransactionAmountBody = req.body;

  const transaction = await TransactionModel.findOne({
    _id: transactionID,
    organization: req.tenantContext!.organizationId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  })
    .populate({
      model: CategoryModel,
      path: 'category',
    })
    .exec();

  appAssert(
    transaction,
    NOT_FOUND,
    `Transaction with ID: ${transactionID} does not exists`,
  );

  const category = transaction.category;
  const transactionAmountSum = transaction.amount + amount;

  // check if the amount paid is over the amount required for a category
  appAssert(
    transactionAmountSum <= category.fee,
    BAD_REQUEST,
    `The amount is over the required amount for ${category.name} fee`,
  );

  // check if the amount paid is non-negative
  appAssert(amount > 0, BAD_REQUEST, 'Enter a valid amount');

  const update: UpdateQuery<ITransaction> = {
    $set: { amount: transactionAmountSum },
    $push: {
      paymentHistory: {
        amount,
        date: new Date(),
        modeOfPayment: 'cash', // Defaulting to cash since this endpoint doesn't accept modeOfPayment yet
      },
    },
  };

  const result = await TransactionModel.findOneAndUpdate(
    {
      _id: transaction._id,
      organization: req.tenantContext!.organizationId,
      semester: req.tenantContext!.semester,
      schoolYear: req.tenantContext!.schoolYear,
    },
    update,
    { new: true },
  ).exec();

  res.json(
    new CustomResponse(true, result, 'Transaction amount updated successfully'),
  );
});

/**
 * POST - import transactions from Excel file (.xlsx)
 */
export const import_transactions_excel = asyncHandler(async (req, res) => {
  const file = req.file;
  const { categoryID } = req.body;

  appAssert(file, BAD_REQUEST, 'No file uploaded');
  appAssert(categoryID, BAD_REQUEST, 'Category ID is required');

  // Validate file type
  const validMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  appAssert(
    validMimeTypes.includes(file.mimetype),
    BAD_REQUEST,
    'File must be an Excel file (.xlsx or .xls)',
  );

  // Check if category exists
  const category = await CategoryModel.findById(categoryID);
  appAssert(category, NOT_FOUND, `Category with ID ${categoryID} not found`);

  // First pass: validate without saving
  const validationResult = await importTransactionsFromExcel(
    req,
    file.buffer,
    categoryID,
    false,
  );

  // If validation has critical errors, return them
  if (validationResult.success === 0 && validationResult.failed > 0) {
    res
      .status(BAD_REQUEST)
      .json(
        new CustomResponse(
          false,
          validationResult,
          'Validation failed. No transactions imported.',
        ),
      );
    return;
  }

  // Second pass: actually save the transactions
  const importResult = await importTransactionsFromExcel(
    req,
    file.buffer,
    categoryID,
    true,
  );

  res.json(
    new CustomResponse(
      true,
      importResult,
      `Import completed: ${importResult.success} successful, ${importResult.failed} failed`,
    ),
  );
});

/**
 * POST - preview transactions from Excel file before importing
 */
export const preview_transactions_excel = asyncHandler(async (req, res) => {
  const file = req.file;
  const { categoryID } = req.body;

  appAssert(file, BAD_REQUEST, 'No file uploaded');
  appAssert(categoryID, BAD_REQUEST, 'Category ID is required');

  // Validate file type - also accept CSV
  const validMimeTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
  ];
  appAssert(
    validMimeTypes.includes(file.mimetype),
    BAD_REQUEST,
    'File must be an Excel file (.xlsx, .xls) or CSV',
  );

  // Check if category exists
  const category = await CategoryModel.findById(categoryID);
  appAssert(category, NOT_FOUND, `Category with ID ${categoryID} not found`);

  const previewResult = await previewTransactionsFromExcel(
    req,
    file.buffer,
    categoryID,
  );

  res.json(
    new CustomResponse(
      true,
      previewResult,
      `Preview: ${previewResult.valid.length} valid, ${previewResult.invalid.length} invalid`,
    ),
  );
});
