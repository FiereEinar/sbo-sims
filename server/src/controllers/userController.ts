import asyncHandler from 'express-async-handler';
import { CustomRequest } from '../types/request';
import { updateUserBody } from '../types/user';
import { UpdateQuery } from 'mongoose';
import { IUser } from '../models/user';
import CustomResponse from '../types/response';
import { BAD_REQUEST, NOT_FOUND } from '../constants/http';
import { validateEmail } from '../utils/utils';
import appAssert from '../errors/appAssert';

export const update_user = asyncHandler(async (req: CustomRequest, res) => {
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

	const user = await req.UserModel?.findById(userID);
	appAssert(user, NOT_FOUND, `User with ID: ${userID} not found`);

	const year = parseInt(activeSchoolYearDB);
	appAssert(
		year >= 2000 || year <= 3000,
		BAD_REQUEST,
		'Year must only be between 2000 and 3000'
	);

	if (activeSemDB.length > 0) {
		appAssert(
			activeSemDB === '1' || activeSemDB === '2',
			BAD_REQUEST,
			'Semester can only be 1 or 2'
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

	const result = await req.UserModel?.findByIdAndUpdate(user._id, update, {
		new: true,
	}).exec();

	res.json(new CustomResponse(true, result, 'User updated successfully!'));
});
