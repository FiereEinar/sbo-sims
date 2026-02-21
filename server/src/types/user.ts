import { Entity } from './entity';

export type signupUserBody = Entity & {
	studentID: string;
	password: string;
	confirmPassword: string;
	bio?: string;
};

export type loginUserBody = {
	studentID: string;
	password: string;
};

export type updateUserBody = Entity & {
	studentID: string;
	bio?: string;
	activeSchoolYearDB: string;
	activeSemDB: string;
};

export type adminUpdateUserBody = updateUserBody & {
	rbacRole: string;
};
