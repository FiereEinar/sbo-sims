import supertest from 'supertest';
import { IStudent } from '../models/student';
import { accessTokenCookieName } from '../constants';
import app from '../app';
import { expect } from 'vitest';
import { IOrganization } from '../models/organization';
import { ICategory } from '../models/category';
import { IUser } from '../models/user';
import { SECRET_ADMIN_KEY } from '../constants/env';
import { OK } from '../constants/http';

export const createMockUser = async (): Promise<{
	user: IUser;
	accessToken: string;
}> => {
	const userData = {
		studentID: '2301106533',
		password: '123123',
		confirmPassword: '123123',
		firstname: 'Jhon',
		lastname: 'Doe',
		email: 'jhon@gmail.com',
	};

	let res = await supertest(app).post('/auth/signup').send(userData).expect(OK);

	expect(res.body.success).toBe(true);

	// set mock user to admin
	await supertest(app)
		.put('/auth/admin')
		.send({ secretAdminKey: SECRET_ADMIN_KEY, userID: res.body.data._id })
		.expect(OK);

	// sign in mock user
	res = await supertest(app).post('/auth/login').send(userData).expect(OK);

	// get access token
	const accessToken = res.body.data.accessToken;

	expect(res.body.success).toBe(true);

	return { user: res.body.data.user as IUser, accessToken };
};

export const createMockStudent = async (
	accessToken: string,
	id?: string
): Promise<IStudent> => {
	const studentData = {
		studentID: id ?? '2301106599',
		firstname: 'Jhon',
		lastname: 'Doe',
		email: 'jhon@email.com',
		course: 'BSIT',
		gender: 'M',
		middlename: 'G',
		year: 1,
	};

	const res = await supertest(app)
		.post('/student')
		.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
		.send(studentData)
		.expect(OK);

	expect(res.body.success).toBe(true);

	return res.body.data as IStudent;
};

export const createMockOrganization = async (
	accessToken: string
): Promise<IOrganization> => {
	const organizationData = {
		name: 'University of the Philippines',
		governor: 'Jhon Doe',
		treasurer: 'Jane Doe',
		departments: ['BSIT', 'BSEMC-DAT'],
	};

	const res = await supertest(app)
		.post('/organization')
		.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
		.send(organizationData)
		.expect(OK);

	expect(res.body.success).toBe(true);

	return res.body.data as IOrganization;
};

export const createMockCategory = async (
	accessToken: string,
	orgID: string
): Promise<ICategory> => {
	const categoryData = {
		name: 'Tuition Fee',
		fee: 1000,
		organizationID: orgID,
	};

	const res = await supertest(app)
		.post('/category')
		.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
		.send(categoryData)
		.expect(OK);

	expect(res.body.success).toBe(true);

	return res.body.data as ICategory;
};
