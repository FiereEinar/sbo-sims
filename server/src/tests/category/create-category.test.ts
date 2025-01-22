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

describe('POST - Create Category', () => {
	it('should create a category', async () => {
		const category = {
			name: 'College T-Shirt',
			fee: 400,
			organizationID: organization._id,
		};

		const res = await supertest(app)
			.post(`/category`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(category)
			.expect(OK);

		expect(res.body.data.name).toBe(category.name);
		expect(res.body.data.organization).toBe(organization._id);
	});

	it('should return 404 if organization does not exist', async () => {
		const category = {
			name: 'College T-Shirt',
			fee: 400,
			organizationID: '60e1f8d6a4c9e7e1c8c9e0f1',
		};

		const res = await supertest(app)
			.post(`/category`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(category)
			.expect(NOT_FOUND);
	});

	it('should return 400 if fee is negative', async () => {
		const category = {
			name: 'College T-Shirt',
			fee: -400,
			organizationID: organization._id,
		};

		const res = await supertest(app)
			.post(`/category`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(category)
			.expect(BAD_REQUEST);
	});

	it('should return 400 if fee is zero', async () => {
		const category = {
			name: 'College T-Shirt',
			fee: 0,
			organizationID: organization._id,
		};

		const res = await supertest(app)
			.post(`/category`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(category)
			.expect(BAD_REQUEST);
	});

	it('should return 400 if name is empty', async () => {
		const category = {
			name: '',
			fee: 400,
			organizationID: organization._id,
		};

		const res = await supertest(app)
			.post(`/category`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(category)
			.expect(BAD_REQUEST);
	});
});
