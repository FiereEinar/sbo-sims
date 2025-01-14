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
import { BAD_REQUEST, NOT_FOUND, OK } from '../../constants/http';

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
			.expect(OK);

		const deleteRes = await supertest(app)
			.delete(`/transaction/${res.body.data._id}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.expect(OK);
	});

	it('should not delete a transaction with invalid id', async () => {
		const res = await supertest(app)
			.delete(`/transaction/123`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.expect(BAD_REQUEST);
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
			.expect(OK);

		const deleteRes = await supertest(app)
			.delete(`/transaction/${res.body.data._id}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.expect(OK);

		const deleteRes2 = await supertest(app)
			.delete(`/transaction/${res.body.data._id}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.expect(NOT_FOUND);
	});
});
