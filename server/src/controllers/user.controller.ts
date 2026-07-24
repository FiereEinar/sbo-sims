import appAssert from '../errors/appAssert';
import CustomResponse, { CustomPaginatedResponse } from '../types/response';
import asyncHandler from 'express-async-handler';
import { adminUpdateUserBody, updateUserBody } from '../types/user';
import { UpdateQuery } from 'mongoose';
import UserModel, { IUser } from '../models/user.model';
import { escapeRegex, validateEmail } from '../utils/utils';
import { BAD_REQUEST, NOT_FOUND, UNAUTHORIZED } from '../constants/http';
import { BCRYPT_SALT } from '../constants/env';
import bcrypt from 'bcryptjs';
import RoleModel from '../models/role.model';

export const update_user = asyncHandler(async (req, res) => {
  const { userID } = req.params;
  const {
    firstname,
    lastname,
    studentID,
    bio,
    email,
    activeSchoolYearDB,
    activeSemDB,
  }: updateUserBody = req.body;

  const user = await UserModel.findOne({
    _id: userID,
    organization: req.tenantContext!.organizationId,
  });
  appAssert(user, NOT_FOUND, `User with ID: ${userID} not found`);

  appAssert(
    req.currentUser?._id.toString() === userID,
    UNAUTHORIZED,
    'You are not authorized to update this user',
  );

  const year = parseInt(activeSchoolYearDB);

  appAssert(
    year >= 2000 && year <= 3000,
    BAD_REQUEST,
    'Year must only be between 2000 and 3000',
  );

  if (activeSemDB.length > 0) {
    appAssert(
      activeSemDB === '1' || activeSemDB === '2',
      BAD_REQUEST,
      'Semester can only be 1 or 2',
    );
  }

  if (email?.length) {
    appAssert(validateEmail(email), BAD_REQUEST, 'Email must be valid');
  }

  const update: UpdateQuery<IUser> = {
    firstname: firstname,
    lastname: lastname,
    studentID: studentID,
    bio: bio,
    email: email,
    activeSchoolYearDB: activeSchoolYearDB || user.activeSchoolYearDB,
    activeSemDB: activeSemDB || user.activeSemDB,
  };

  const result = await UserModel?.findByIdAndUpdate(user._id, update, {
    new: true,
  }).exec();

  res.json(new CustomResponse(true, result, 'User updated successfully!'));
});

/**
 * @route GET /api/v1/user
 * @query page=1
 * @query pageSize=10
 * @query search=keyword
 * @query role=admin|student|instructor
 */
export const getUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    pageSize = 10,
    search = '',
    role = '',
  } = req.query as Record<string, string>;

  const numericPage = Number(page);
  const limit = Number(pageSize);
  const skip = (numericPage - 1) * limit;

  /** ---------------------
   *        FILTERS
   *  --------------------*/
  const filter: Record<string, any> = {
    organization: req.tenantContext!.organizationId,
  };

  // filter by role (optional)
  if (role.trim() !== '') {
    filter.role = role;
  }

  // search: name, email, institutionalID
  if (search.trim() !== '') {
    const regex = { $regex: escapeRegex(search), $options: 'i' };
    filter.$or = [
      { name: regex },
      { email: regex },
      { institutionalID: regex },
    ];
  }

  /** ---------------------
   *     FETCH DATA
   *  --------------------*/
  const users = await UserModel.find(filter)
    .populate('rbacRole')
    .skip(skip)
    .limit(limit)
    .exec();

  const total = await UserModel.countDocuments(filter);

  // calculate pagination
  const next = skip + limit < total ? numericPage + 1 : -1;
  const prev = numericPage > 1 ? numericPage - 1 : -1;

  res.json(
    new CustomPaginatedResponse(true, users, 'Users fetched', next, prev),
  );
});

/**
 * @route POST /api/v1/user
 */
export const createUser = asyncHandler(async (req, res) => {
  const { firstname, lastname, studentID, password, bio, email, rbacRole } =
    req.body;

  appAssert(
    firstname?.length && lastname?.length,
    BAD_REQUEST,
    'First name and last name are required',
  );

  // check if studentID is valid
  appAssert(
    parseInt(studentID).toString().length === 10,
    BAD_REQUEST,
    `Student ID must be 10 numbers and should not contain characters to be valid`,
  );

  // check if studentID already exist
  const existingUser = await UserModel.findOne({
    studentID: studentID,
    organization: req.tenantContext!.organizationId,
  }).exec();
  appAssert(
    !existingUser,
    BAD_REQUEST,
    `User with student ID ${studentID} already exist`,
  );

  // check for errors in form validation
  if (email?.length) {
    appAssert(validateEmail(email), BAD_REQUEST, 'Email must be valid');
  }

  // check if role exists
  const role = await RoleModel.findOne({
    _id: rbacRole,
    organization: req.tenantContext!.organizationId,
  }).exec();
  appAssert(role, BAD_REQUEST, 'Role not found');

  appAssert(password?.length, BAD_REQUEST, 'Password is required');

  // hash password
  const hashedPassword = await bcrypt.hash(password, parseInt(BCRYPT_SALT));

  // set default profile picture
  let profileURL =
    'https://res.cloudinary.com/diirvhsym/image/upload/v1728426644/user/zl85ljimxkrs1uqnqrvu.webp';
  let profilePublicID = 'user/al85leemxkrs2qwnqrvU';

  const user = await UserModel.create({
    firstname: firstname,
    lastname: lastname,
    studentID: studentID,
    password: hashedPassword,
    email: email,
    rbacRole: role._id,
    roleManuallyAssigned: true,
    role: 'org-admin',
    bio: bio,
    verified: true,
    organization: req.tenantContext!.organizationId,
    profile: {
      url: profileURL,
      publicID: profilePublicID,
    },
  });

  res.json(new CustomResponse(true, user, 'User created successfully!'));
});

/**
 * @route DELETE /api/v1/user
 * @param userID
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { userID } = req.params;

  const user = await UserModel.findOneAndDelete({
    _id: userID,
    organization: req.tenantContext!.organizationId,
  }).exec();

  appAssert(user, NOT_FOUND, 'User not found');

  res.json(new CustomResponse(true, user, 'User deleted successfully!'));
});

/**
 * @route GET /api/v1/user/:userID
 */
export const getSingleUser = asyncHandler(async (req, res) => {
  const { userID } = req.params;

  const user = await UserModel.findOne({
    _id: userID,
    organization: req.tenantContext!.organizationId,
  })
    .populate('rbacRole')
    .exec();

  appAssert(user, NOT_FOUND, 'User not found');

  res.json(new CustomResponse(true, user, 'User found'));
});

export const adminUpdateUser = asyncHandler(async (req, res) => {
  const { userID } = req.params;
  const {
    firstname,
    lastname,
    studentID,
    bio,
    rbacRole,
    email,
    activeSchoolYearDB,
    activeSemDB,
  }: adminUpdateUserBody = req.body;

  const user = await UserModel.findOne({
    _id: userID,
    organization: req.tenantContext!.organizationId,
  });
  appAssert(user, NOT_FOUND, `User with ID: ${userID} not found`);

  const year = parseInt(activeSchoolYearDB);

  appAssert(
    year >= 2000 && year <= 3000,
    BAD_REQUEST,
    'Year must only be between 2000 and 3000',
  );

  if (activeSemDB.length > 0) {
    appAssert(
      activeSemDB === '1' || activeSemDB === '2',
      BAD_REQUEST,
      'Semester can only be 1 or 2',
    );
  }

  if (email?.length) {
    appAssert(validateEmail(email), BAD_REQUEST, 'Email must be valid');
  }

  const role = await RoleModel.findOne({
    _id: rbacRole,
    organization: req.tenantContext!.organizationId,
  }).exec();
  appAssert(role, BAD_REQUEST, 'Role not found');

  const update: UpdateQuery<IUser> = {
    firstname: firstname,
    lastname: lastname,
    studentID: studentID,
    bio: bio,
    rbacRole: role._id,
    roleManuallyAssigned: true,
    email: email,
    activeSchoolYearDB: activeSchoolYearDB || user.activeSchoolYearDB,
    activeSemDB: activeSemDB || user.activeSemDB,
  };

  const result = await UserModel?.findByIdAndUpdate(user._id, update, {
    new: true,
  }).exec();

  res.json(new CustomResponse(true, result, 'User updated successfully!'));
});

/**
 * @route PATCH /api/v1/user/:userID/password
 */
export const updateUserPassword = asyncHandler(async (req, res) => {
  const { userID } = req.params;
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  const user = await UserModel.findOne({
    _id: userID,
    organization: req.tenantContext!.organizationId,
  });
  appAssert(user, NOT_FOUND, `User with ID: ${userID} not found`);

  const isOldPasswordValid = await bcrypt.compare(
    currentPassword,
    user.password,
  );
  appAssert(isOldPasswordValid, BAD_REQUEST, 'Current password is incorrect');

  appAssert(
    newPassword === confirmNewPassword,
    BAD_REQUEST,
    'Passwords do not match',
  );

  const hashedPassword = await bcrypt.hash(newPassword, parseInt(BCRYPT_SALT));

  const update: UpdateQuery<IUser> = {
    password: hashedPassword,
  };

  const result = await UserModel?.findByIdAndUpdate(user._id, update, {
    new: true,
  }).exec();

  const safeUser = result?.omitPassword();

  res.json(
    new CustomResponse(true, safeUser, 'Password updated successfully!'),
  );
});

/**
 * @route PUT /api/v1/user/complete-onboarding
 */
export const completeOnboarding = asyncHandler(async (req, res) => {
  const userID = req.currentUser?._id;
  appAssert(userID, UNAUTHORIZED, 'User not authenticated');

  const update: UpdateQuery<IUser> = {
    isOnboardingCompleted: true,
  };

  const result = await UserModel.findByIdAndUpdate(userID, update, {
    new: true,
  }).exec();

  res.json(new CustomResponse(true, result, 'Onboarding completed!'));
});
