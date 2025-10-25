import { Category } from './category';
import { Student } from './student';

export type Prelisting = {
	_id: string;
	owner: Student;
	category: Category;
	description?: string;
	date?: Date;
	details: { [key: string]: string };
	createdAt: Date;
	updatedAt: Date;
};

export type PrelistingFilterValues = {
	search?: string;
	page?: number;
	pageSize?: number;
	course?: string;
	category?: string;
	startDate?: Date;
	endDate?: Date;
};
