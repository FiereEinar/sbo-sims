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
import {
	BAD_REQUEST,
	NOT_FOUND,
	OK,
	UNPROCESSABLE_ENTITY,
} from '../../constants/http';

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

describe('DELETE - Delete Category', () => {
	it('should delete a category', async () => {
		const newCategory = await createMockCategory(accessToken, organization._id);

		const res = await supertest(app)
			.delete(`/category/${newCategory._id}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.expect(OK);
	});

	it('should return 404 if category does not exist', async () => {
		const res = await supertest(app)
			.delete(`/category/60f4b4e4f2f4e2d8b8b4b4e4`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.expect(NOT_FOUND);
	});

	it('should return 400 if category id is invalid', async () => {
		const res = await supertest(app)
			.delete(`/category/invalid_id`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.expect(BAD_REQUEST);
	});

	it('should return 400 if category has existing transactions', async () => {
		const transaction = {
			studentID: student.studentID,
			categoryID: category._id,
			amount: 100,
		};

		await supertest(app)
			.post('/transaction')
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(transaction)
			.expect(OK);

		await supertest(app)
			.delete(`/category/${category._id}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.expect(UNPROCESSABLE_ENTITY);
	});
});
