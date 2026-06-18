import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import appAssert from '../errors/appAssert';
import CustomResponse from '../types/response';
import { loginUserBody, signupUserBody } from '../types/user';
import { ONE_DAY_MS, thirtyDaysFromNow } from '../utils/date';
import { getUserRequestInfo } from '../utils/utils';
import {
  accessTokenCookieName,
  AppErrorCodes,
  refreshTokenCookieName,
} from '../constants';
import {
  BCRYPT_SALT,
  JWT_REFRESH_SECRET_KEY,
  NODE_ENV,
  RECAPTCHA_SECRET_KEY,
  SECRET_ADMIN_KEY,
  STUDENT_EMAIL_DOMAIN,
  APP_ORIGIN,
  FRONTEND_URL,
} from '../constants/env';
import {
  BAD_REQUEST,
  CONFLICT,
  NO_CONTENT,
  NOT_FOUND,
  OK,
  UNAUTHORIZED,
} from '../constants/http';
import {
  cookieOptions,
  getAccessTokenOptions,
  getRefreshTokenOptions,
  REFRESH_PATH,
  setAuthCookie,
} from '../utils/cookie';
import {
  getAccessToken,
  RefreshTokenPayload,
  refreshTokenSignOptions,
  signToken,
  verifyToken,
} from '../utils/jwt';
import UserModel, { IUser } from '../models/user.model';
import { sendVerificationEmail } from '../services/emailService';
import SessionModel from '../models/session.model';
import OrganizationModel from '../models/organization.model';
import RoleModel from '../models/role.model';
import AppSettingModel from '../models/app-setting.model';

/**
 * GET - public organizations
 */
export const get_public_organizations = asyncHandler(async (req, res) => {
  const organizations = await OrganizationModel.find({}, 'name slug').exec();
  res.json(new CustomResponse(true, organizations, 'Public organizations'));
});

/**
 * POST - user signup
 */
export const signup = asyncHandler(async (req, res) => {
  const {
    confirmPassword,
    password,
    studentID,
    firstname,
    lastname,
    bio,
  }: signupUserBody = req.body;

  const email = studentID + STUDENT_EMAIL_DOMAIN;

  // check if passwords match
  appAssert(password === confirmPassword, BAD_REQUEST, 'Password must match');

  // check if studentID is valid
  appAssert(
    parseInt(studentID).toString().length === 10,
    BAD_REQUEST,
    `Student ID must be 10 numbers and should not contain characters to be valid`,
  );

  const orgSlug = req.headers['x-organization-slug'] as string;
  appAssert(orgSlug, BAD_REQUEST, 'Organization slug is required');

  const organization = await OrganizationModel.findOne({
    slug: orgSlug,
  }).exec();
  appAssert(organization, NOT_FOUND, 'Organization not found');

  // check if studentID already exist
  const existingUser = await UserModel.findOne({
    studentID: studentID,
    organization: organization._id,
  }).exec();

  appAssert(
    !existingUser,
    CONFLICT,
    `A user with ID '${studentID}' already exist in this organization`,
  );

  // set default profile picture
  let profileURL =
    'https://res.cloudinary.com/diirvhsym/image/upload/v1728426644/user/zl85ljimxkrs1uqnqrvu.webp';
  let profilePublicID = 'user/al85leemxkrs2qwnqrvU';

  // hash the password
  const hashedPassword = await bcrypt.hash(password, parseInt(BCRYPT_SALT));

  // Find the default role for the organization
  const defaultRole = await RoleModel.findOne({
    isDefault: true,
    organization: organization._id,
  }).exec();
  appAssert(
    defaultRole,
    BAD_REQUEST,
    'System configuration error: No default role found for this organization',
  );

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // create and save the user
  const user = new UserModel({
    firstname: firstname,
    lastname: lastname,
    studentID: studentID,
    password: hashedPassword,
    email: email,
    bio: bio,
    rbacRole: defaultRole._id,
    roleManuallyAssigned: false,
    profile: {
      url: profileURL,
      publicID: profilePublicID,
    },
    verified: false,
    organization: organization._id,
    verificationToken,
    verificationTokenExpiresAt,
  });
  await user.save();

  const verificationUrl = `${APP_ORIGIN}/auth/verify-email?token=${verificationToken}&id=${user._id}`;
  await sendVerificationEmail(email, verificationUrl);

  // hide the password
  let userCopy = user.omitPassword();

  res.json(
    new CustomResponse(
      true,
      userCopy,
      'User signed up successfully. Please check your email to verify your account.',
    ),
  );
});

/**
 * POST - user login
 */
export const login = asyncHandler(async (req, res) => {
  const {
    studentID,
    password,
    recaptchaToken,
  }: loginUserBody & { recaptchaToken: string } = req.body;

  // verify reCAPTCHA token with Google
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

  const orgSlug = req.headers['x-organization-slug'] as string;
  appAssert(orgSlug, BAD_REQUEST, 'Organization slug is required');

  const organization = await OrganizationModel.findOne({
    slug: orgSlug,
  }).exec();
  appAssert(organization, NOT_FOUND, 'Organization not found');

  // check if studentID is valid
  const user = await UserModel.findOne<IUser>({
    studentID: studentID,
    organization: organization._id,
  })
    .populate('rbacRole')
    .populate('organization')
    .exec();
  appAssert(user, UNAUTHORIZED, `Incorrect Student ID`);

  // check if password is correct
  const match = await bcrypt.compare(password, user.password);
  appAssert(match, UNAUTHORIZED, 'Incorrect password');

  appAssert(
    user.verified,
    UNAUTHORIZED,
    'Please verify your email before logging in',
  );

  const { ip, userAgent } = getUserRequestInfo(req);

  // create and save the session
  const session = new SessionModel({
    userID: user._id,
    expiresAt: thirtyDaysFromNow(),
    ip,
    userAgent,
  });
  await session.save();

  const sessionID = session._id.toString();
  const userID = user._id.toString();

  // create and set the access token and refresh token
  const accessToken = signToken({ sessionID, userID });
  const refreshToken = signToken({ sessionID }, refreshTokenSignOptions);
  setAuthCookie({ res, accessToken, refreshToken });

  const useragent = req.useragent;
  const device = useragent?.isMobile
    ? 'mobile'
    : useragent?.isTablet
      ? 'tablet'
      : 'desktop';

  const globalSettings = await AppSettingModel.findOne();
  if (globalSettings) {
    user.activeSemDB = globalSettings.activeSemester as any;
    user.activeSchoolYearDB = globalSettings.activeSchoolYear;
  } else {
    user.activeSemDB = '1';
    user.activeSchoolYearDB = '2025';
  }
  await user.save();

  res.json(
    new CustomResponse(
      true,
      { user: user.omitPassword(), accessToken, device },
      'Login successfull',
    ),
  );
});

/**
 * GET - user logout
 */
export const logout = asyncHandler(async (req, res) => {
  const accessToken = getAccessToken(req);

  // check if token is present
  appAssert(accessToken, NO_CONTENT, 'No token');

  const { payload } = verifyToken(accessToken);

  if (payload) {
    await SessionModel.findByIdAndDelete(payload.sessionID);
  }

  // clear the cookie
  res.clearCookie(accessTokenCookieName, cookieOptions);
  res.clearCookie(refreshTokenCookieName, {
    ...cookieOptions,
    path: REFRESH_PATH,
  });

  res.sendStatus(OK);
});

/**
 * GET - refresh access token
 */
export const refresh = asyncHandler(async (req, res) => {
  // get the refresh token
  const refreshToken = req.cookies[refreshTokenCookieName] as string;
  appAssert(refreshToken, UNAUTHORIZED, 'No refresh token found');

  // verify the refresh token
  const { payload } = verifyToken<RefreshTokenPayload>(refreshToken, {
    secret: JWT_REFRESH_SECRET_KEY,
  });

  appAssert(payload, UNAUTHORIZED, 'Token did not return any payload');

  const session = await SessionModel.findById(payload.sessionID);
  const now = Date.now();

  // check if session is valid
  appAssert(session, UNAUTHORIZED, 'Invalid session');

  if (session.expiresAt.getTime() < now) {
    await SessionModel.findByIdAndDelete(session._id);
    appAssert(false, UNAUTHORIZED, 'Session expired');
  }

  // check if session needs refresh
  const sessionNeedsRefresh = session.expiresAt.getTime() - now < ONE_DAY_MS;
  if (sessionNeedsRefresh) {
    session.expiresAt = thirtyDaysFromNow();
    await session.save();
  }

  // create and set the new access token and refresh token
  const newRefreshToken = sessionNeedsRefresh
    ? signToken({ sessionID: session._id.toString() }, refreshTokenSignOptions)
    : undefined;

  const accessToken = signToken({
    sessionID: session._id.toString(),
    userID: session.userID as unknown as string,
  });

  if (newRefreshToken) {
    res.cookie(
      refreshTokenCookieName,
      newRefreshToken,
      getRefreshTokenOptions(),
    );
  }

  res
    .status(OK)
    .cookie(accessTokenCookieName, accessToken, getAccessTokenOptions())
    .json(new CustomResponse(true, null, 'Token refreshed'));
});

/**
 * GET - check if authenticated
 */
export const check_auth = asyncHandler(async (req, res) => {
  const token = getAccessToken(req);
  appAssert(
    token,
    UNAUTHORIZED,
    'Token not found',
    AppErrorCodes.InvalidAccessToken,
  );

  // verify the token
  const { error, payload } = verifyToken(token);
  appAssert(
    !error && payload,
    UNAUTHORIZED,
    'Token not verified',
    AppErrorCodes.InvalidAccessToken,
  );

  const user = await UserModel.findById(payload.userID as string)
    .populate('rbacRole')
    .populate('organization');
  const session = await SessionModel.findById(payload.sessionID);

  appAssert(
    session && user,
    UNAUTHORIZED,
    'User or session not found',
    AppErrorCodes.InvalidAccessToken,
  );

  const now = Date.now();

  if (session.expiresAt.getTime() < now) {
    await SessionModel.findByIdAndDelete(session._id);
    appAssert(
      false,
      UNAUTHORIZED,
      'Session expired',
      AppErrorCodes.InvalidAccessToken,
    );
  }

  res.status(OK).json(user.omitPassword());
});

export const admin = asyncHandler(async (req, res) => {
  if (NODE_ENV !== 'test') {
    res.status(NOT_FOUND).json({ message: 'Service unavailable' });
    return;
  }

  const { secretAdminKey, userID } = req.body;

  appAssert(
    secretAdminKey === SECRET_ADMIN_KEY,
    BAD_REQUEST,
    'Invalid admin key',
  );

  const user = await UserModel.findByIdAndUpdate(
    userID,
    { role: 'governor' },
    { new: true },
  );

  appAssert(user, NOT_FOUND, 'User not found');

  res.json(new CustomResponse(true, user.omitPassword(), 'Admin found'));
});

/**
 * POST /auth/admin-login
 * Login for the global super admin only (no org slug required).
 * Validates that the user has role === 'admin'.
 */
export const admin_login = asyncHandler(async (req, res) => {
  const { studentID, password }: loginUserBody = req.body;

  // Find the admin user — no organization filter
  const user = await UserModel.findOne<IUser>({ studentID })
    .populate('rbacRole')
    .exec();
  appAssert(user, UNAUTHORIZED, 'Incorrect Student ID or password');
  appAssert(
    user.role === 'admin',
    UNAUTHORIZED,
    'Access denied: not a super admin',
  );

  const match = await bcrypt.compare(password, user.password);
  appAssert(match, UNAUTHORIZED, 'Incorrect Student ID or password');

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

  res.json(
    new CustomResponse(
      true,
      { user: user.omitPassword(), accessToken, device },
      'Admin login successful',
    ),
  );
});

export const verify_email = asyncHandler(async (req, res) => {
  const { token, id } = req.query;

  appAssert(token && id, BAD_REQUEST, 'Invalid verification link');

  const user = await UserModel.findById(id);
  appAssert(user, NOT_FOUND, 'User not found');

  if (user.verified) {
    res.redirect(`${FRONTEND_URL}/login?verified=true`);
    return;
  }

  appAssert(
    user.verificationToken === token &&
      user.verificationTokenExpiresAt &&
      user.verificationTokenExpiresAt.getTime() > Date.now(),
    BAD_REQUEST,
    'Verification link is invalid or has expired',
  );

  user.verified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiresAt = undefined;
  await user.save();

  res.redirect(`${FRONTEND_URL}/login?verified=true`);
});
