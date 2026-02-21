import expressAsyncHandler from 'express-async-handler';
import { Modules } from '../../constants/modules';
import appAssert from '../../errors/appAssert';
import { UNAUTHORIZED } from '../../constants/http';

export const hasRole = (requiredPermissions: Modules[]) => {
	return expressAsyncHandler(async (req, res, next) => {
		const userId = req.currentUser?._id;
		appAssert(userId, UNAUTHORIZED, 'User not authenticated');

		// Populate user's roles with permissions
		const user = await req.UserModel.findById(userId).populate({
			path: 'rbacRole',
			select: 'permissions',
		});

		appAssert(user, UNAUTHORIZED, 'User not found');

		if (user.role === 'admin') return next();

		// Collect all permissions from user's roles
		const userPermissions: string[] = [];
		const adminRole = user.adminRole as any;
		if (adminRole && adminRole.permissions) {
			adminRole.permissions.forEach((permission: string) => {
				userPermissions.push(permission);
			});
		}

		// Check if user has any of the required permissions
		const hasPermission = requiredPermissions.some((permission) =>
			userPermissions.includes(permission),
		);

		appAssert(hasPermission, UNAUTHORIZED, 'Insufficient permissions');

		next();
	});
};
