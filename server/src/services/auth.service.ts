import { Request, Response } from 'express';
import UserModel, { IUser, UserRoles } from '../models/user.model';
import { getUserRequestInfo } from '../utils/utils';
import SessionModel from '../models/session.model';
import { thirtyDaysFromNow } from '../utils/date';
import { refreshTokenSignOptions, signToken } from '../utils/jwt';
import { setAuthCookie } from '../utils/cookie';
import AppSettingModel from '../models/app-setting.model';
import RoleModel from '../models/role.model';
import { IOrganization } from '../models/organization.model';
import { SUPER_ADMIN } from '../constants';
import { MODULES } from '../constants/modules';
import {
  APP_ORIGIN,
  BCRYPT_SALT,
  RECAPTCHA_SECRET_KEY,
} from '../constants/env';
import bcrypt from 'bcryptjs';
import { signupUserBody } from '../types/user';
import crypto from 'crypto';
import { sendVerificationEmail } from './emailService';

export const loginService = async (
  req: Request,
  res: Response,
  user: IUser,
) => {
  try {
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
      user.activeSchoolYearDB = new Date().getFullYear().toString();
    }
    await user.save();

    return {
      updatedUser: user,
      accessToken,
      device,
    };
  } catch (error: any) {
    throw new Error('Login service failed: ' + error.message);
  }
};

export const signupService = async (
  user: signupUserBody,
  email: string,
  password: string,
) => {
  try {
    const hashedPassword = await bcrypt.hash(password, parseInt(BCRYPT_SALT));

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ); // 24 hours

    const defaultProfile = {
      url: 'https://res.cloudinary.com/diirvhsym/image/upload/v1728426644/user/zl85ljimxkrs1uqnqrvu.webp',
      publicID: 'user/al85leemxkrs2qwnqrvU',
    };

    const newUser = new UserModel({
      firstname: user.firstname,
      lastname: user.lastname,
      studentID: user.studentID,
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
    await newUser.save();

    const verificationUrl = `${APP_ORIGIN}/auth/verify-email?token=${verificationToken}&id=${newUser._id}`;
    await sendVerificationEmail(email, verificationUrl);

    return { newUser, email };
  } catch (error: any) {
    throw new Error('Signup service failed: ' + error.message);
  }
};

export const selfHealRBAC = async (
  user: IUser,
  organization: IOrganization,
) => {
  try {
    if (user.rbacRole) {
      const role = await RoleModel.findOne({
        _id: user.rbacRole,
        organization: organization._id,
      }).exec();
      if (role) {
        // Self-heal: only applies to the seeded "Super Admin" role.
        // Custom officer roles have their own deliberate permission sets — do not touch them.
        if (role.name === SUPER_ADMIN) {
          const allPermissions = Object.values(MODULES);
          const currentPerms = new Set(role.permissions as string[]);
          const missing = allPermissions.filter((p) => !currentPerms.has(p));

          if (missing.length > 0) {
            role.permissions = allPermissions;
            await role.save();
            console.log(
              `[seed] Healed "${role.name}" role — added ${missing.length} new permission(s): ${missing.join(', ')}`,
            );
          }
        }
      }
    }
  } catch (error) {
    throw error;
  }
};

export const verifyRecaptcha = async (recaptchaToken: string) => {
  try {
    const recaptchaResponse = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
      },
    );
    const recaptchaData = await recaptchaResponse.json();

    return recaptchaData;
  } catch (error) {
    throw error;
  }
};
