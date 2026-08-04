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
  SECRET_ADMIN_KEY,
  STUDENT_EMAIL_DOMAIN,
  FRONTEND_URL,
  WEB_APP_ORIGIN,
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
import { sendForgotPasswordEmail } from '../services/emailService';
import SessionModel from '../models/session.model';
import OrganizationModel from '../models/organization.model';
import AppSettingModel from '../models/app-setting.model';
import {
  loginService,
  selfHealRBAC,
  signupService,
  verifyRecaptcha,
} from '../services/auth.service';

/**
 * GET - public organizations
 */
export const get_public_organizations = asyncHandler(async (req, res) => {
  let organizations = await OrganizationModel.find({}, 'name slug').exec();

  if (organizations.length === 0 && process.env.IS_ELECTRON === 'true') {
    const cloudUrl =
      process.env.CLOUD_API_URL || 'https://sbo-sims-server.vercel.app';
    try {
      const fetchRes = await fetch(
        `${cloudUrl}/sync/bootstrap?collection=organizations&page=1`,
        {
          headers: { 'x-sync-secret': SECRET_ADMIN_KEY },
        },
      );
      if (fetchRes.ok) {
        const responseData = await fetchRes.json();
        const docs = responseData.data?.docs ?? [];
        if (docs.length > 0) {
          const bulkOps = docs.map((doc: any) => ({
            updateOne: {
              filter: { _id: doc._id },
              update: { $setOnInsert: doc },
              upsert: true,
            },
          }));
          await OrganizationModel.bulkWrite(bulkOps, { ordered: false });
          organizations = await OrganizationModel.find({}, 'name slug').exec();
        }
      }
    } catch (err) {
      console.error('[Public Org Proxy] Error fetching orgs from Atlas:', err);
    }
  }

  res.json(new CustomResponse(true, organizations, 'Public organizations'));
});

/**
 * POST - user signup
 */
export const signup = asyncHandler(async (req, res) => {
  const { confirmPassword, password, studentID }: signupUserBody = req.body;

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

  const { newUser } = await signupService(req.body, email, password);

  res.json(
    new CustomResponse(
      true,
      newUser.omitPassword(),
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
  const recaptchaData = await verifyRecaptcha(recaptchaToken);
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

  let user = await UserModel.findOne<IUser>({
    studentID: studentID,
    organization: organization._id,
  })
    .populate('organization')
    .exec();

  if (!user && process.env.IS_ELECTRON === 'true') {
    const cloudUrl = process.env.CLOUD_API_URL || 'https://sbo-sims.vercel.app';
    try {
      const fetchRes = await fetch(
        `${cloudUrl}/sync/user-bootstrap?studentID=${studentID}&userRole=org-admin`,
        {
          headers: { 'x-sync-secret': process.env.SECRET_ADMIN_KEY! },
        },
      );
      if (fetchRes.ok) {
        const responseData = await fetchRes.json();
        const data = responseData.data;
        if (data && data.user) {
          // Dynamically import Role model to avoid circular deps if any
          const RoleModel = (await import('../models/role.model')).default;

          await Promise.all([
            OrganizationModel.findByIdAndUpdate(
              data.organization._id,
              data.organization,
              { upsert: true },
            ),
            RoleModel.findByIdAndUpdate(data.role._id, data.role, {
              upsert: true,
            }),
            UserModel.findByIdAndUpdate(data.user._id, data.user, {
              upsert: true,
            }),
          ]);

          user = await UserModel.findOne<IUser>({
            studentID: studentID,
            organization: organization._id,
          })
            .populate('organization')
            .exec();
        }
      }
    } catch (err) {
      console.error('[Login Proxy] Error fetching user from Atlas:', err);
    }
  }

  appAssert(user, UNAUTHORIZED, `Incorrect Student ID or password`);

  // check if password is correct
  const match = await bcrypt.compare(password, user.password);
  appAssert(match, UNAUTHORIZED, 'Incorrect Student ID or password');

  appAssert(
    user.verified,
    UNAUTHORIZED,
    'Please verify your email before logging in',
  );

  await selfHealRBAC(user, organization);

  const { updatedUser, accessToken, device } = await loginService(
    req,
    res,
    user,
  );

  res.json(
    new CustomResponse(
      true,
      { user: updatedUser.omitPassword(), accessToken, device },
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

  const user = await UserModel.findById(session.userID);
  if (!user) {
    appAssert(false, UNAUTHORIZED, 'User not found');
  }

  // auto set active semester and school year
  const globalSettings = await AppSettingModel.findOne();
  if (globalSettings) {
    user.activeSemDB = globalSettings.activeSemester as any;
    user.activeSchoolYearDB = globalSettings.activeSchoolYear;
  } else {
    user.activeSemDB = '1';
    user.activeSchoolYearDB = new Date().getFullYear().toString();
  }
  await user.save();

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

  // auto set active semester and school year
  const globalSettings = await AppSettingModel.findOne();
  if (globalSettings) {
    user.activeSemDB = globalSettings.activeSemester as any;
    user.activeSchoolYearDB = globalSettings.activeSchoolYear;
  } else {
    user.activeSemDB = '1';
    user.activeSchoolYearDB = new Date().getFullYear().toString();
  }
  await user.save();

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
    { role: 'org-admin' },
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
  let user = await UserModel.findOne<IUser>({
    studentID,
    role: 'central-admin',
  })
    .populate('rbacRole')
    .exec();

  if (!user && process.env.IS_ELECTRON === 'true') {
    const cloudUrl = process.env.CLOUD_API_URL || 'https://sbo-sims.vercel.app';
    try {
      const fetchRes = await fetch(
        `${cloudUrl}/api/v1/sync/user-bootstrap?studentID=${studentID}`,
        {
          headers: { 'x-sync-secret': process.env.SECRET_ADMIN_KEY! },
        },
      );
      if (fetchRes.ok) {
        const responseData = await fetchRes.json();
        const data = responseData.data;
        if (data && data.user) {
          const RoleModel = (await import('../models/role.model')).default;
          const ops = [
            UserModel.findByIdAndUpdate(data.user._id, data.user, {
              upsert: true,
            }),
          ];
          if (data.role)
            ops.push(
              RoleModel.findByIdAndUpdate(data.role._id, data.role, {
                upsert: true,
              }) as any,
            );
          if (data.organization) {
            const OrganizationModel = (
              await import('../models/organization.model')
            ).default;
            ops.push(
              OrganizationModel.findByIdAndUpdate(
                data.organization._id,
                data.organization,
                { upsert: true },
              ) as any,
            );
          }
          await Promise.all(ops);

          user = await UserModel.findOne<IUser>({
            studentID,
            role: 'central-admin',
          })
            .populate('rbacRole')
            .exec();
        }
      }
    } catch (err) {
      console.error('[Admin Login Proxy] Error fetching user from Atlas:', err);
    }
  }

  appAssert(user, UNAUTHORIZED, 'Incorrect Student ID or password');

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

export const forgot_password = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await UserModel.findOne({ email });
  appAssert(user, NOT_FOUND, 'User with this email not found');

  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpiresAt = new Date(Date.now() + 3600000); // 1 hour
  await user.save();

  const resetUrl = `${WEB_APP_ORIGIN}/reset-password?token=${token}`;
  await sendForgotPasswordEmail(user.email, resetUrl);

  res.json(
    new CustomResponse(true, null, 'Password reset link sent to your email'),
  );
});

export const reset_password = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  const user = await UserModel.findOne({
    resetPasswordToken: token,
    resetPasswordExpiresAt: { $gt: Date.now() },
  });

  appAssert(user, BAD_REQUEST, 'Invalid or expired password reset token');

  const salt = await bcrypt.genSalt(Number(BCRYPT_SALT));
  user.password = await bcrypt.hash(newPassword, salt);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiresAt = undefined;
  await user.save();

  res.json(
    new CustomResponse(true, null, 'Password has been reset successfully'),
  );
});
