import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import supertest, { Response } from 'supertest';
import app from '../../app';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { accessTokenCookieName } from '../../constants';
import { SECRET_ADMIN_KEY } from '../../constants/env';
import {
	CREATED,
	NOT_FOUND,
	OK,
	UNPROCESSABLE_ENTITY,
} from '../../constants/http';
import { ICategory } from '../../models/category';
import { IOrganization } from '../../models/organization';
import { create } from 'lodash';
import { createMockCategory, createMockOrganization } from '..';

let accessToken: string;
let mongoServer: MongoMemoryServer;
let category: ICategory;
let organization: IOrganization;

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	process.env.ME_CONFIG_MONGODB_URL = mongoServer.getUri();

	const user = {
		studentID: '2301106533',
		password: '123123',
		confirmPassword: '123123',
		firstname: 'Jhon',
		lastname: 'Doe',
		email: 'jhon@gmail.com',
	};

	let res: Response;

	// sign in mock user
	res = await supertest(app).post('/auth/signup').send(user).expect(200);

	// set mock user to admin
	await supertest(app)
		.put('/auth/admin')
		.send({ secretAdminKey: SECRET_ADMIN_KEY, userID: res.body.data._id })
		.expect(OK);

	// sign in mock user
	res = await supertest(app).post('/auth/login').send(user).expect(OK);

	// get access token
	accessToken = res.body.data.accessToken;

	// create a student
	res = await supertest(app)
		.post(`/student`)
		.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
		.send(student)
		.expect(OK);

	organization = await createMockOrganization(accessToken);
	category = await createMockCategory(accessToken, organization._id);
});

afterAll(async () => {
	await mongoServer.stop();
});

const student = {
	studentID: '2301106599',
	firstname: 'Jhon',
	lastname: 'Doe',
	email: 'jhon@gmail.com',
	course: 'BSIT',
	gender: 'M',
	middlename: 'G',
	year: 1,
};

describe('DELETE - Delete Student', () => {
	it('should delete a student', async () => {
		const res = await supertest(app)
			.delete(`/student/${student.studentID}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.expect(OK);
	});

	it('should not delete a student that does not exist', async () => {
		const res = await supertest(app)
			.delete(`/student/2301106598`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.expect(NOT_FOUND);
	});

	it('should not delete a student with transactions', async () => {
		// create a student to delete
		let res = await supertest(app)
			.post(`/student`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(student)
			.expect(OK);

		const transaction = {
			amount: 100,
			categoryID: category._id,
			studentID: student.studentID,
		};

		res = await supertest(app)
			.post(`/transaction`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(transaction)
			.expect(OK);

		const deleteRes = await supertest(app)
			.delete(`/student/${student.studentID}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.expect(UNPROCESSABLE_ENTITY);
	});
});
