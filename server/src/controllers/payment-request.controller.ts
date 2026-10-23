import asyncHandler from 'express-async-handler';
import PaymentRequestModel from '../models/payment-request.model';
import TransactionModel from '../models/transaction.model';
import CustomResponse from '../types/response';
import appAssert from '../errors/appAssert';
import { BAD_REQUEST, NOT_FOUND, OK } from '../constants/http';
import CategoryModel from '../models/category.model';
import StudentModel from '../models/student.model';
import UserModel from '../models/user.model';
import { sendPaymentRequestStatusEmail, sendOrgEmail, renderEmailLayout } from '../services/emailService';
import { resolveStudentEmail } from '../utils/student';
import { resolveOrgEmailCredentials } from './organization.controller';


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

  // Send email notification to student (fire-and-forget)
  try {
    const studentEmail = await resolveStudentEmail(student);
    if (studentEmail) {
      const orgName = (request.organization as any)?.name ?? 'your organization';
      const orgCreds = await resolveOrgEmailCredentials(organizationId).catch(() => null);
      if (orgCreds) {
        sendPaymentRequestStatusEmailOrg(
          studentEmail,
          `${student.firstname} ${student.lastname}`,
          category.name,
          orgName,
          Number(request.amount),
          'approved',
          undefined,
          orgCreds,
        ).catch(() => {}); // non-blocking
      }
    }
  } catch (_) {}


  res.status(OK).json(new CustomResponse(true, request, 'Payment request approved successfully'));
});

export const reject_payment_request = asyncHandler(async (req, res) => {
  const organizationId = req.tenantContext!.organizationId;
  const { id } = req.params;
  const { remarks } = req.body;

  const request = await PaymentRequestModel.findOne({ _id: id, organization: organizationId })
    .populate('student')
    .populate('category', 'name')
    .populate('organization', 'name');

  appAssert(request, NOT_FOUND, 'Payment request not found');
  appAssert(request.status === 'pending', BAD_REQUEST, 'Only pending requests can be rejected');

  request.status = 'rejected';
  request.remarks = remarks;
  await request.save();

  // Send email notification to student (fire-and-forget)
  try {
    const student = request.student as any;
    const category = request.category as any;
    const studentEmail = await resolveStudentEmail(student);
    if (studentEmail) {
      const orgName = (request.organization as any)?.name ?? 'your organization';
      const orgCreds = await resolveOrgEmailCredentials(organizationId).catch(() => null);
      if (orgCreds) {
        sendPaymentRequestStatusEmailOrg(
          studentEmail,
          `${student.firstname} ${student.lastname}`,
          category.name,
          orgName,
          Number(request.amount),
          'rejected',
          remarks,
          orgCreds,
        ).catch(() => {}); // non-blocking
      }
    }
  } catch (_) {}

  res.status(OK).json(new CustomResponse(true, request, 'Payment request rejected successfully'));
});

/**
 * Sends a payment request status email using org-specific credentials.
 * Silently skips if orgCreds is null (no email configured).
 */
async function sendPaymentRequestStatusEmailOrg(
  to: string,
  studentName: string,
  categoryName: string,
  orgName: string,
  amount: number,
  status: 'approved' | 'rejected',
  remarks?: string,
  orgCreds?: { user: string; pass: string } | null,
) {
  if (!orgCreds) return;

  const { WEB_APP_ORIGIN } = await import('../constants/env');
  const isApproved = status === 'approved';
  const statusLabel = isApproved ? 'Approved' : 'Rejected';
  const headerColor = isApproved ? '#1e8e3e' : '#d93025';
  const badgeBg = isApproved ? '#e6f4ea' : '#fce8e6';
  const badgeColor = isApproved ? '#1e8e3e' : '#d93025';

  const bodyMessage = isApproved
    ? `Great news! Your payment request for <strong>${categoryName}</strong> has been reviewed and <strong>approved</strong> by <strong>${orgName}</strong>. A transaction record has been created for your account.`
    : `Your payment request for <strong>${categoryName}</strong> has been reviewed by <strong>${orgName}</strong> and has unfortunately been <strong>rejected</strong>.`;

  const remarksSection =
    !isApproved && remarks
      ? `<div style="background-color:#fce8e6;border-left:4px solid #d93025;padding:14px 18px;border-radius:4px;margin:20px 0;"><p style="color:#d93025;font-size:13px;font-weight:bold;margin:0 0 6px;">Rejection Reason:</p><p style="color:#5f6368;font-size:14px;margin:0;">${remarks}</p></div>`
      : '';

  const studentPortalUrl = `${WEB_APP_ORIGIN || 'https://sbo-sims.vercel.app'}/#/student/transactions`;

  const contentHtml = `
    <p style="color:#5f6368;font-size:15px;margin:0 0 20px;">Hi <strong>${studentName}</strong>,</p>
    <p style="color:#5f6368;font-size:15px;line-height:1.6;margin:0 0 20px;">${bodyMessage}</p>
    ${remarksSection}
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fa;border-radius:6px;margin:24px 0;border:1px solid #e0e0e0;">
      <tr><td style="padding:16px 20px;border-bottom:1px solid #e0e0e0;"><span style="color:#9aa0a6;font-size:12px;display:block;margin-bottom:4px;">ORGANIZATION</span><span style="color:#202124;font-size:14px;font-weight:bold;">${orgName}</span></td></tr>
      <tr><td style="padding:16px 20px;border-bottom:1px solid #e0e0e0;"><span style="color:#9aa0a6;font-size:12px;display:block;margin-bottom:4px;">CATEGORY</span><span style="color:#202124;font-size:14px;font-weight:bold;">${categoryName}</span></td></tr>
      <tr><td style="padding:16px 20px;border-bottom:1px solid #e0e0e0;"><span style="color:#9aa0a6;font-size:12px;display:block;margin-bottom:4px;">AMOUNT</span><span style="color:#202124;font-size:14px;font-weight:bold;">₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></td></tr>
      <tr><td style="padding:16px 20px;"><span style="color:#9aa0a6;font-size:12px;display:block;margin-bottom:4px;">STATUS</span><span style="display:inline-block;background-color:${badgeBg};color:${badgeColor};padding:4px 12px;border-radius:999px;font-size:13px;font-weight:bold;">${statusLabel}</span></td></tr>
    </table>
    <p style="color:#5f6368;font-size:14px;line-height:1.6;margin:24px 0 0;">You can log in to your <a href="${studentPortalUrl}" style="color:#1a73e8;text-decoration:none;">SBO-SIMS Student Portal</a> to view more details.</p>
  `;

  await sendOrgEmail({
    orgEmailUser: orgCreds.user,
    orgEmailPass: orgCreds.pass,
    orgName,
    to,
    subject: `Payment Request ${statusLabel} — ${categoryName}`,
    preheader: `Your payment request for ${categoryName} has been ${status}.`,
    headerBackground: headerColor,
    headerTitle: 'SBO-SIMS',
    headerSubtitle: 'Payment Request Update',
    contentHtml,
  });
}

