import { MongoEntity } from './mongoEntity';

type Image = {
	url: string;
	publicID: string;
};

export type User = MongoEntity & {
	studentID: string;
	password: string;
	profile: Image;
	role: 'admin' | 'regular';
	bio: string;
	token: string;
};
