import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import appAssert from '../errors/appAssert';
import CustomResponse from '../types/response';
import { loginUserBody, signupUserBody } from '../types/user';
import { thirtyDaysFromNow } from '../utils/date';
import { getUserRequestInfo } from '../utils/utils';
import { AppErrorCodes, refreshTokenCookieName } from '../constants';
import {
  BCRYPT_SALT,
  RECAPTCHA_SECRET_KEY,
  APP_ORIGIN,
  FRONTEND_URL,
  STUDENT_EMAIL_DOMAIN,
} from '../constants/env';
import {
  BAD_REQUEST,
  CONFLICT,
  NOT_FOUND,
  OK,
  UNAUTHORIZED,
} from '../constants/http';
import { setAuthCookie } from '../utils/cookie';
import { refreshTokenSignOptions, signToken } from '../utils/jwt';
import UserModel, { IUser } from '../models/user.model';
import { sendVerificationEmail } from '../services/emailService';
import SessionModel from '../models/session.model';
import StudentModel from '../models/student.model';
import TransactionModel from '../models/transaction.model';
import AttendanceRecordModel from '../models/attendance-record.model';
import AppSettingModel from '../models/app-setting.model';

/**
 * POST /student-portal/signup
 * Public — creates a new student User (no org slug required).
 * Sends a verification email before the account can be used.
 */
export const student_signup = asyncHandler(async (req, res) => {
  const {
    confirmPassword,
    password,
    studentID,
    firstname,
    lastname,
  }: signupUserBody = req.body;

  const email = studentID + STUDENT_EMAIL_DOMAIN;

  // check if passwords match
  appAssert(password === confirmPassword, BAD_REQUEST, 'Passwords must match');

  // check if studentID is valid (10 digits)
  appAssert(
    parseInt(studentID).toString().length === 10,
    BAD_REQUEST,
    'Student ID must be exactly 10 digits and contain no letters',
  );

  // Check global uniqueness — a student user is identified only by studentID (no org scope)
  const existingUser = await UserModel.findOne({
    studentID,
    role: 'student',
  }).exec();

  appAssert(
    !existingUser,
    CONFLICT,
    `A student account with ID '${studentID}' already exists. Please log in instead.`,
  );

  const hashedPassword = await bcrypt.hash(password, parseInt(BCRYPT_SALT));

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const defaultProfile = {
    url: 'https://res.cloudinary.com/diirvhsym/image/upload/v1728426644/user/zl85ljimxkrs1uqnqrvu.webp',
    publicID: 'user/al85leemxkrs2qwnqrvU',
  };

  const user = new UserModel({
    firstname,
    lastname,
    studentID,
    password: hashedPassword,
    email,
    role: 'student',
    roleManuallyAssigned: false,
    profile: defaultProfile,
    verified: false,
    // organization is intentionally left undefined — students span multiple orgs
    verificationToken,
    verificationTokenExpiresAt,
  });
  await user.save();

  const verificationUrl = `${APP_ORIGIN}/auth/verify-email?token=${verificationToken}&id=${user._id}`;
  await sendVerificationEmail(email, verificationUrl);

  res.json(
    new CustomResponse(
      true,
      user.omitPassword(),
      'Account created! Please check your email to verify your account before logging in.',
    ),
  );
});

/**
 * POST /student-portal/login
 * Public — authenticates a student user without an org slug.
 * Requires the account to be email-verified.
 */
export const student_login = asyncHandler(async (req, res) => {
  const {
    studentID,
    password,
    recaptchaToken,
  }: loginUserBody & { recaptchaToken: string } = req.body;

  // verify reCAPTCHA
  const recaptchaResponse = await fetch(
    'https://www.google.com/recaptcha/api/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
    },
  );
  const recaptchaData = await recaptchaResponse.json();
  appAssert(
    recaptchaData.success,
    BAD_REQUEST,
    'reCAPTCHA verification failed. Please try again.',
  );

  // Find the student user — no org filter, role must be 'student'
  const user = await UserModel.findOne<IUser>({
    studentID,
    role: 'student',
  }).exec();

  appAssert(user, UNAUTHORIZED, 'Incorrect Student ID or password');

  const match = await bcrypt.compare(password, user.password);
  appAssert(match, UNAUTHORIZED, 'Incorrect Student ID or password');

  appAssert(
    user.verified,
    UNAUTHORIZED,
    'Please verify your email before logging in. Check your inbox for the verification link.',
  );

  const { ip, userAgent } = getUserRequestInfo(req);

  const session = new SessionModel({
    userID: user._id,
    expiresAt: thirtyDaysFromNow(),
    ip,
    userAgent,
  });
  await session.save();

  const sessionID = session._id.toString();
  const userID = user._id.toString();

  const accessToken = signToken({ sessionID, userID });
  const refreshToken = signToken({ sessionID }, refreshTokenSignOptions);
  setAuthCookie({ res, accessToken, refreshToken });

  const useragent = req.useragent;
  const device = useragent?.isMobile
    ? 'mobile'
    : useragent?.isTablet
      ? 'tablet'
      : 'desktop';

  // Sync active term from global settings if available
  const globalSettings = await AppSettingModel.findOne();
  if (globalSettings) {
    user.activeSemDB = globalSettings.activeSemester as any;
    user.activeSchoolYearDB = globalSettings.activeSchoolYear;
  } else {
    user.activeSemDB = '1';
    user.activeSchoolYearDB = new Date().getFullYear().toString();
  }
  await user.save();

  res.json(
    new CustomResponse(
      true,
      { user: user.omitPassword(), accessToken, device },
      'Login successful',
    ),
  );
});

/**
 * GET /student-portal/dashboard
 * Protected (auth + studentAuth) — returns aggregated data for the logged-in student
 * across ALL organizations they appear in (matched by studentID).
 */
export const get_student_dashboard = asyncHandler(async (req, res) => {
  const currentUser = req.currentUser!;
  const { studentID, activeSemDB, activeSchoolYearDB } = currentUser;

  // 1. Find all Student records that share this studentID across any org for the active term
  const studentRecords = await StudentModel.find({ 
    studentID,
    semester: activeSemDB,
    schoolYear: activeSchoolYearDB
  }).populate('organization', 'name slug').lean();
  const studentObjIds = studentRecords.map((s) => s._id);

  // 2. Aggregate transactions across all orgs
  const [txAgg] = await TransactionModel.aggregate([
    { $match: { owner: { $in: studentObjIds } } },
    {
      $facet: {
        totalPaid: [{ $group: { _id: null, total: { $sum: '$amount' } } }],
        recentTransactions: [
          { $sort: { createdAt: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: 'categories',
              localField: 'category',
              foreignField: '_id',
              as: 'category',
            },
          },
          { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'organizations',
              localField: 'organization',
              foreignField: '_id',
              as: 'organization',
            },
          },
          {
            $unwind: {
              path: '$organization',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              amount: 1,
              modeOfPayment: 1,
              createdAt: 1,
              semester: 1,
              schoolYear: 1,
              'category.name': 1,
              'organization.name': 1,
              'organization.slug': 1,
            },
          },
        ],
        totalTransactions: [{ $count: 'count' }],
      },
    },
  ]);

  // 3. Aggregate attendance records across all orgs
  const [attAgg] = await AttendanceRecordModel.aggregate([
    { $match: { student: { $in: studentObjIds } } },
    {
      $facet: {
        totalAttended: [{ $count: 'count' }],
        recentAttendance: [
          { $sort: { recordedAt: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: 'events',
              localField: 'event',
              foreignField: '_id',
              as: 'event',
            },
          },
          { $unwind: { path: '$event', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'eventsessions',
              localField: 'session',
              foreignField: '_id',
              as: 'session',
            },
          },
          { $unwind: { path: '$session', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: 'organizations',
              localField: 'organization',
              foreignField: '_id',
              as: 'organization',
            },
          },
          {
            $unwind: {
              path: '$organization',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              recordedAt: 1,
              'event.name': '$event.title',
              'session.name': 1,
              'organization.name': 1,
              'organization.slug': 1,
            },
          },
        ],
      },
    },
  ]);

  const totalPaid = txAgg?.totalPaid?.[0]?.total ?? 0;
  const totalTransactions = txAgg?.totalTransactions?.[0]?.count ?? 0;
  const recentTransactions = txAgg?.recentTransactions ?? [];
  const totalAttended = attAgg?.totalAttended?.[0]?.count ?? 0;
  const recentAttendance = attAgg?.recentAttendance ?? [];
  const activeOrgs = studentRecords.length;
  const enrolledOrgs = studentRecords.map((s) => s.organization).filter(Boolean);

  res.status(OK).json(
    new CustomResponse(
      true,
      {
        totalPaid,
        totalTransactions,
        totalAttended,
        activeOrgs,
        enrolledOrgs,
        recentTransactions,
        recentAttendance,
      },
      'Student dashboard data',
    ),
  );
});

/**
 * PUT /student-portal/term
 * Protected (auth + studentAuth) — updates the student user's active semester and school year.
 * Students don't have an org context so they cannot use the regular /user/:id endpoint.
 */
export const update_student_term = asyncHandler(async (req, res) => {
  const currentUser = req.currentUser!;
  const { activeSemDB, activeSchoolYearDB } = req.body;

  if (activeSemDB !== undefined) {
    appAssert(
      activeSemDB === '1' || activeSemDB === '2',
      BAD_REQUEST,
      'Semester can only be 1 or 2',
    );
  }

  if (activeSchoolYearDB !== undefined) {
    const year = parseInt(activeSchoolYearDB);
    appAssert(
      year >= 2000 && year <= 3000,
      BAD_REQUEST,
      'Year must only be between 2000 and 3000',
    );
  }

  const updated = await UserModel.findByIdAndUpdate(
    currentUser._id,
    {
      ...(activeSemDB !== undefined && { activeSemDB }),
      ...(activeSchoolYearDB !== undefined && { activeSchoolYearDB }),
    },
    { new: true },
  );

  appAssert(updated, NOT_FOUND, 'Student user not found');

  res.status(OK).json(
    new CustomResponse(true, updated.omitPassword(), 'Term settings updated'),
  );
});
