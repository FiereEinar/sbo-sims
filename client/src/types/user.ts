import { MongoEntity } from './mongoEntity';

type Image = {
	url: string;
	publicID: string;
};

export type UserRoles =
	| 'student'
	| 'org-admin'
	| 'central-admin';

export interface Role {
	_id: string;
	name: string;
	description?: string;
	permissions?: string[];
	createdAt: string;
	updatedAt: string;
}

export type User = MongoEntity & {
	studentID: string;
	firstname: string;
	lastname: string;
	email: string;
	password: string;
	profile: Image;
	role: UserRoles;
	rbacRole: Role;
	roleManuallyAssigned: boolean;
	bio: string;
	token: string;
	verified: boolean;
	isOnboardingCompleted: boolean;
	activeSchoolYearDB: string;
	activeSemDB: '1' | '2';
	organization?: {
		_id: string;
		name: string;
		slug: string;
	};
	createdAt: Date;
	updatedAt: Date;
};
