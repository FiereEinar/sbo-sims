import { Entity } from './entity';

export type signupUserBody = Entity & {
	studentID: string;
	password: string;
	confirmPassword: string;
	bio?: string;
};
