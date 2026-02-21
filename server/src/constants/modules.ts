export const MODULES = {
	USER_CREATE: 'user:create',
	USER_READ: 'user:read',
	USER_UPDATE: 'user:update',
	USER_DELETE: 'user:delete',

	STUDENT_CREATE: 'student:create',
	STUDENT_READ: 'student:read',
	STUDENT_UPDATE: 'student:update',
	STUDENT_DELETE: 'student:delete',
	STUDENT_IMPORT: 'student:import',

	TRANSACTION_CREATE: 'transaction:create',
	TRANSACTION_READ: 'transaction:read',
	TRANSACTION_UPDATE: 'transaction:update',
	TRANSACTION_DELETE: 'transaction:delete',
	TRANSACTION_IMPORT: 'transaction:import',
	TRANSACTION_DOWNLOAD: 'transaction:download',

	PRELISTING_CREATE: 'prelisting:create',
	PRELISTING_READ: 'prelisting:read',
	PRELISTING_UPDATE: 'prelisting:update',
	PRELISTING_DELETE: 'prelisting:delete',

	ORGANIZATION_CREATE: 'organization:create',
	ORGANIZATION_READ: 'organization:read',
	ORGANIZATION_UPDATE: 'organization:update',
	ORGANIZATION_DELETE: 'organization:delete',

	CATEGORY_CREATE: 'category:create',
	CATEGORY_READ: 'category:read',
	CATEGORY_UPDATE: 'category:update',
	CATEGORY_DELETE: 'category:delete',

	ROLE_CREATE: 'role:create',
	ROLE_READ: 'role:read',
	ROLE_UPDATE: 'role:update',
	ROLE_DELETE: 'role:delete',
	ROLE_ASSIGN: 'role:assign',
};

export type Modules = (typeof MODULES)[keyof typeof MODULES];
