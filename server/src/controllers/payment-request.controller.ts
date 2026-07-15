import asyncHandler from 'express-async-handler';
import PaymentRequestModel from '../models/payment-request.model';
import TransactionModel from '../models/transaction.model';
import CustomResponse from '../types/response';
import appAssert from '../errors/appAssert';
import { BAD_REQUEST, NOT_FOUND, OK } from '../constants/http';
import CategoryModel from '../models/category.model';
import StudentModel from '../models/student.model';

export const create_payment_request = asyncHandler(async (req, res) => {
  // Extract info from studentAuth middleware
  const { studentID } = req.currentUser!;
  const { organization, category, amount, modeOfPayment, referenceNumber } = req.body;
  
  // File from multer
  const file = req.file;
  
  appAssert(organization, BAD_REQUEST, 'Organization is required');
  appAssert(category, BAD_REQUEST, 'Category is required');
  appAssert(amount, BAD_REQUEST, 'Amount is required');

  // Verify the student exists in this organization for the active term
  const studentRecord = await StudentModel.findOne({ 
    studentID, 
    organization,
    semester: req.currentUser!.activeSemDB,
    schoolYear: req.currentUser!.activeSchoolYearDB
  });
  appAssert(studentRecord, NOT_FOUND, 'You are not enrolled in this organization for the selected term');

  // Verify the category exists
  const categoryRecord = await CategoryModel.findById(category);
  appAssert(categoryRecord, NOT_FOUND, 'Category not found');

  const receiptImage = file ? `/uploads/${file.filename}` : undefined;

  const pendingRequest = await PaymentRequestModel.findOne({
    student: studentRecord._id,
    category,
    status: 'pending',
  });
  appAssert(!pendingRequest, BAD_REQUEST, 'You already have a pending request for this category');

  const existingTransaction = await TransactionModel.findOne({
    owner: studentRecord._id,
    category: categoryRecord._id,
  });

  if (existingTransaction) {
    appAssert(
      existingTransaction.amount < categoryRecord.fee,
      BAD_REQUEST,
      `You have already fully paid for ${categoryRecord.name}`,
    );
    const numericAmount = Number(amount);
    const newTotal = existingTransaction.amount + numericAmount;
    appAssert(
      newTotal <= categoryRecord.fee,
      BAD_REQUEST,
      `Top-up would exceed the required fee. Remaining balance: ${categoryRecord.fee - existingTransaction.amount}`,
    );
  }

  const newRequest = new PaymentRequestModel({
    student: studentRecord._id,
    organization,
    category,
    amount,
    modeOfPayment: modeOfPayment || 'cash',
    referenceNumber,
    receiptImage,
    semester: req.currentUser!.activeSemDB,
    schoolYear: req.currentUser!.activeSchoolYearDB,
  });

  await newRequest.save();

  res.status(OK).json(new CustomResponse(true, newRequest, 'Payment request submitted successfully'));
});

export const get_student_payment_requests = asyncHandler(async (req, res) => {
  const { studentID, activeSemDB, activeSchoolYearDB } = req.currentUser!;

  // Get all student records for this studentID across orgs
  const studentRecords = await StudentModel.find({ studentID }).lean();
  const studentObjIds = studentRecords.map((s) => s._id);

  const requests = await PaymentRequestModel.find({
    student: { $in: studentObjIds },
    semester: activeSemDB,
    schoolYear: activeSchoolYearDB,
  })
    .populate('organization', 'name slug')
    .populate('category', 'name fee')
    .sort({ createdAt: -1 });

  res.status(OK).json(new CustomResponse(true, requests, 'Student payment requests retrieved'));
});

export const get_org_payment_requests = asyncHandler(async (req, res) => {
  const organizationId = req.tenantContext!.organizationId;
  const { semester, schoolYear } = req.tenantContext!;

  const requests = await PaymentRequestModel.find({
    organization: organizationId,
    semester,
    schoolYear,
  })
    .populate('student', 'firstname lastname studentID')
    .populate('category', 'name fee')
    .sort({ createdAt: -1 });

  res.status(OK).json(new CustomResponse(true, requests, 'Organization payment requests retrieved'));
});

export const approve_payment_request = asyncHandler(async (req, res) => {
  const organizationId = req.tenantContext!.organizationId;
  const { id } = req.params;
  const user = req.currentUser!;

  const request = await PaymentRequestModel.findOne({ _id: id, organization: organizationId })
    .populate('student')
    .populate({
      path: 'category',
      populate: { path: 'organization' }
    });

  appAssert(request, NOT_FOUND, 'Payment request not found');
  appAssert(request.status === 'pending', BAD_REQUEST, 'Only pending requests can be approved');

  const category = request.category as any;
  const student = request.student as any;

  // Create details mapping
  const detailsObj: { [key: string]: any } = {};
  category.details.forEach((detail: string) => {
    // Fill with NA or request details if applicable
    detailsObj[detail] = 'N/A';
  });

  // Check if an existing transaction exists for this student + category in the SAME term
  const existingTransaction = await TransactionModel.findOne({
    owner: student._id,
    category: category._id,
    semester: request.semester,
    schoolYear: request.schoolYear,
  });

  let transactionId;

  if (existingTransaction) {
    appAssert(
      existingTransaction.amount < category.fee,
      BAD_REQUEST,
      `This student has already fully paid for ${category.name}`,
    );

    const numericAmount = Number(request.amount);
    const newTotal = existingTransaction.amount + numericAmount;
    appAssert(
      newTotal <= category.fee,
      BAD_REQUEST,
      `Top-up would exceed the required fee. Remaining balance: ${category.fee - existingTransaction.amount}`,
    );

    const updatedTransaction = await TransactionModel.findByIdAndUpdate(
      existingTransaction._id,
      {
        $inc: { amount: numericAmount },
        $push: {
          paymentHistory: {
            amount: numericAmount,
            date: new Date(),
            modeOfPayment: request.modeOfPayment,
          },
        },
      },
      { new: true },
    );
    transactionId = updatedTransaction!._id;
  } else {
    // Create Transaction
    const transaction = new TransactionModel({
      amount: request.amount,
      category: category._id,
      owner: student._id,
      description: 'Approved via Payment Request',
      date: new Date(),
      modeOfPayment: request.modeOfPayment,
      governor: category.organization.governor,
      viceGovernor: category.organization.viceGovernor,
      treasurer: category.organization.treasurer,
      auditor: category.organization.auditor,
      details: detailsObj,
      recordedBy: user._id,
      paymentHistory: [
        {
          amount: request.amount,
          date: new Date(),
          modeOfPayment: request.modeOfPayment,
        },
      ],
      organization: organizationId,
      semester: request.semester,
      schoolYear: request.schoolYear,
    });

    await transaction.save();
    transactionId = transaction._id;
  }

  // Update request
  request.status = 'approved';
  request.transaction = transactionId as any;
  await request.save();

  res.status(OK).json(new CustomResponse(true, request, 'Payment request approved successfully'));
});

export const reject_payment_request = asyncHandler(async (req, res) => {
  const organizationId = req.tenantContext!.organizationId;
  const { id } = req.params;
  const { remarks } = req.body;

  const request = await PaymentRequestModel.findOne({ _id: id, organization: organizationId });

  appAssert(request, NOT_FOUND, 'Payment request not found');
  appAssert(request.status === 'pending', BAD_REQUEST, 'Only pending requests can be rejected');

  request.status = 'rejected';
  request.remarks = remarks;
  await request.save();

  res.status(OK).json(new CustomResponse(true, request, 'Payment request rejected successfully'));
});
