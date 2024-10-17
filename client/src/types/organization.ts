import { Category } from './category';
import { MongoEntity } from './mongoEntity';

export type Organization = MongoEntity & {
	name: string;
	governor: string;
	treasurer: string;
	departments: string[];
};

export type OrganizationWithCategory = Organization & {
	categories: Category[];
};
