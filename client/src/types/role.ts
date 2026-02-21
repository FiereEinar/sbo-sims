import { User } from './user';

export type Role = {
	_id: string;
	name: string;
	description?: string;
	permissions: string[];
	createdBy: User; // admin who created the role
	createdAt: Date;
	updatedAt: Date;
};
