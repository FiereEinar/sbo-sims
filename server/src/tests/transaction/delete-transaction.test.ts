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

let accessToken: string;
let mongoServer: MongoMemoryServer;

// mock entities
let user: IUser;
let organization: IOrganization;
let category: ICategory;
let student: IStudent;

beforeAll(async () => {
	mongoServer = await MongoMemoryServer.create();
	process.env.ME_CONFIG_MONGODB_URL = mongoServer.getUri();

	const res = await createMockUser();
	user = res.user;
	accessToken = res.accessToken;

	organization = await createMockOrganization(accessToken);
	category = await createMockCategory(accessToken, organization._id);
	student = await createMockStudent(accessToken);
});

afterAll(async () => {
	await mongoServer.stop();
});

describe('DELETE - Delete Transaction', () => {
	it('should delete a transaction', async () => {
		const transaction = {
			amount: 100,
			categoryID: category._id,
			studentID: student.studentID,
		};

		const res = await supertest(app)
			.post(`/transaction`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(transaction)
			.expect(200);

		expect(res.body.success).toBe(true);

		const deleteRes = await supertest(app)
			.delete(`/transaction/${res.body.data._id}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.expect(200);

		expect(deleteRes.body.success).toBe(true);
	});

	it('should not delete a transaction with invalid id', async () => {
		const res = await supertest(app)
			.delete(`/transaction/123`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.expect(200);

		expect(res.body.success).toBe(false);
	});

	it('should not delete a transaction that no longer exists', async () => {
		const transaction = {
			amount: 100,
			categoryID: category._id,
			studentID: student.studentID,
		};

		const res = await supertest(app)
			.post(`/transaction`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(transaction)
			.expect(200);

		expect(res.body.success).toBe(true);

		const deleteRes = await supertest(app)
			.delete(`/transaction/${res.body.data._id}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.expect(200);

		expect(deleteRes.body.success).toBe(true);

		const deleteRes2 = await supertest(app)
			.delete(`/transaction/${res.body.data._id}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.expect(200);

		expect(deleteRes2.body.success).toBe(false);
	});
});
