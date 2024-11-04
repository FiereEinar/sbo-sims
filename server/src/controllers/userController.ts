import asyncHandler from 'express-async-handler';
import { CustomRequest } from '../types/request';
import { updateUserBody } from '../types/user';
import { UpdateQuery } from 'mongoose';
import { IUser } from '../models/user';
import CustomResponse from '../types/response';

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

	if (!user) {
		res.json(
			new CustomResponse(false, null, `User with ID: ${userID} nto found`)
		);
		return;
	}

	const year = parseInt(activeSchoolYearDB);

	if (year < 2000 || year > 3000) {
		res.json(
			new CustomResponse(false, null, 'Year must only be between 2000 and 3000')
		);
		return;
	}

	if (activeSemDB.length > 0) {
		if (activeSemDB !== '1' && activeSemDB !== '2') {
			res.json(new CustomResponse(false, null, 'Semester can only be 1 or 2'));
			return;
		}
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
