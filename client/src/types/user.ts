import { MongoEntity } from './mongoEntity';

type Image = {
	url: string;
	publicID: string;
};

export type UserRoles = 'governor' | 'treasurer' | 'auditor' | 'regular';

export type User = MongoEntity & {
	studentID: string;
	firstname: string;
	lastname: string;
	email: string;
	password: string;
	profile: Image;
	role: UserRoles;
	bio: string;
	token: string;
	activeSchoolYearDB: string;
	activeSemDB: '1' | '2';
	createdAt: Date;
	updatedAt: Date;
};
