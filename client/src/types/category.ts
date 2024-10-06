import { MongoEntity } from './mongoEntity';

export type Category = MongoEntity & {
	name: string;
};
