import asyncHandler from 'express-async-handler';

export const adminAuth = asyncHandler(async (req, res, next) => {
	const user = req.currentUser;

	if (user === undefined) {
		res.sendStatus(401);
		return;
	}

	if (user.role !== 'admin') {
		res.sendStatus(403);
		return;
	}

	next();
});
