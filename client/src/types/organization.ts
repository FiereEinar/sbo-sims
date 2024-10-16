import { Category } from './category';
import { MongoEntity } from './mongoEntity';

export type Organization = MongoEntity & {
	categories: Category[];
	name: string;
	governor: string;
	treasurer: string;
};
