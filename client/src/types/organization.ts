import { Category } from './category';
import { MongoEntity } from './mongoEntity';

export type Organization = MongoEntity & {
	name: string;
	governor: string;
	viceGovernor: string;
	treasurer: string;
	auditor: string;
	departments: string[];
	createdAt: Date;
	updatedAt: Date;
};

export type OrganizationWithCategory = Organization & {
	categories: Category[];
};
