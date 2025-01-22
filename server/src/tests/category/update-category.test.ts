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

describe('PUT - Update Category', () => {
	it('should update a category', async () => {
		const res = await supertest(app)
			.put(`/category/${category._id}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send({
				name: 'College T-Shirt',
				fee: 500,
				organizationID: organization._id,
			})
			.expect(OK);

		expect(res.body.data.name).toBe('College T-Shirt');
		expect(res.body.data.fee).toBe(500);
	});

	it('should return 404 if organization does not exist', async () => {
		const res = await supertest(app)
			.put(`/category/${category._id}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send({
				name: 'College T-Shirt',
				fee: 500,
				organizationID: '60e1f8d6a4c9e7e1c8c9e0f1',
			})
			.expect(NOT_FOUND);
	});

	it('should return 400 if fee is negative', async () => {
		const res = await supertest(app)
			.put(`/category/${category._id}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send({
				name: 'College T-Shirt',
				fee: -500,
				organizationID: organization._id,
			})
			.expect(BAD_REQUEST);
	});

	it('should return 400 if fee is zero', async () => {
		const res = await supertest(app)
			.put(`/category/${category._id}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send({
				name: 'College T-Shirt',
				fee: 0,
				organizationID: organization._id,
			})
			.expect(BAD_REQUEST);
	});

	it('should return 400 if name is empty', async () => {
		const res = await supertest(app)
			.put(`/category/${category._id}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send({ name: '', fee: 0, organizationID: organization._id })
			.expect(BAD_REQUEST);
	});

	it('should return 404 if category does not exist', async () => {
		const res = await supertest(app)
			.put(`/category/60e1f8d6a4c9e7e1c8c9e0f1`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send({ name: 'Test', fee: 110, organizationID: organization._id })
			.expect(NOT_FOUND);
	});

	it('should return 400 if fee is not a number', async () => {
		const res = await supertest(app)
			.put(`/category/${category._id}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send({
				name: '',
				fee: 'not-a-number',
				organizationID: organization._id,
			})
			.expect(BAD_REQUEST);
	});
});
