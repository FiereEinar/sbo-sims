import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import supertest from 'supertest';
import app from '../../app';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { accessTokenCookieName } from '../../constants';
import { IUser } from '../../models/user';
import { IOrganization } from '../../models/organization';
import { ICategory } from '../../models/category';
import { IStudent } from '../../models/student';
import {
	createMockCategory,
	createMockOrganization,
	createMockStudent,
	createMockUser,
} from '..';
import { ITransaction } from '../../models/transaction';
import { BAD_REQUEST, CREATED, NOT_FOUND, OK } from '../../constants/http';

let accessToken: string;
let mongoServer: MongoMemoryServer;

// mock entities
let user: IUser;
let organization: IOrganization;
let category: ICategory;
let student: IStudent;
let transaction: ITransaction;

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	process.env.ME_CONFIG_MONGODB_URL = mongoServer.getUri();

	const res = await createMockUser();
	user = res.user;
	accessToken = res.accessToken;

	organization = await createMockOrganization(accessToken);
	category = await createMockCategory(accessToken, organization._id);
	student = await createMockStudent(accessToken);

	// create a mock transaction
	const transactionData = {
		amount: 100,
		categoryID: category._id,
		studentID: student.studentID,
	};

	const res2 = await supertest(app)
		.post(`/transaction`)
		.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
		.send(transactionData)
		.expect(OK);

	transaction = res2.body.data as ITransaction;
});

afterAll(async () => {
	await mongoServer.stop();
});

describe('PUT - Update Transaction', () => {
	it('should update transaction amount', async () => {
		const updateData = {
			amount: 200,
			categoryID: category._id,
			studentID: student.studentID,
		};

		const res = await supertest(app)
			.put(`/transaction/${transaction._id}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(updateData)
			.expect(OK);

		expect(res.body.data.amount).toBe(updateData.amount);
	});

	it('should update transaction category', async () => {
		const newCategory = await createMockCategory(accessToken, organization._id);

		const updateData = {
			amount: 200,
			categoryID: newCategory._id,
			studentID: student.studentID,
		};

		const res = await supertest(app)
			.put(`/transaction/${transaction._id}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(updateData)
			.expect(OK);

		expect(res.body.data.category).toBe(updateData.categoryID);
	});

	it('should update transaction student', async () => {
		const newStudent = await createMockStudent(accessToken, '2301106598');

		const updateData = {
			amount: 200,
			categoryID: category._id,
			studentID: newStudent.studentID,
		};

		const res = await supertest(app)
			.put(`/transaction/${transaction._id}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(updateData)
			.expect(OK);

		expect(res.body.data.owner).toBe(newStudent._id);
	});

	it('should not update transaction with invalid studentID', async () => {
		const updateData = {
			amount: 200,
			categoryID: category._id,
			studentID: '2301106577',
		};

		const res = await supertest(app)
			.put(`/transaction/${transaction._id}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(updateData)
			.expect(NOT_FOUND);
	});

	it('should not update transaction with invalid categoryID', async () => {
		const updateData = {
			amount: 200,
			categoryID: '60f1d1f6c9d9b6a5c8b5e7d9',
			studentID: student.studentID,
		};

		const res = await supertest(app)
			.put(`/transaction/${transaction._id}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(updateData)
			.expect(NOT_FOUND);
	});

	it('should not update transaction with invalid amount', async () => {
		const updateData = {
			amount: -1,
			categoryID: category._id,
			studentID: student.studentID,
		};

		const res = await supertest(app)
			.put(`/transaction/${transaction._id}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(updateData)
			.expect(BAD_REQUEST);
	});
});
