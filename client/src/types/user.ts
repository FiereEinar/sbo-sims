import { MongoEntity } from './mongoEntity';

type Image = {
	url: string;
	publicID: string;
};

export type UserRoles =
	| 'governor'
	| 'treasurer'
	| 'auditor'
	| 'regular'
	| 'admin';

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
	bio: string;
	token: string;
	activeSchoolYearDB: string;
	activeSemDB: '1' | '2';
	createdAt: Date;
	updatedAt: Date;
};
