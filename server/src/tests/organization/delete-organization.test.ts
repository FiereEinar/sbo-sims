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

describe('DELETE - Delete Organization', () => {
	it('should delete an organization', async () => {
		const newOrganization = await createMockOrganization(accessToken);

		const res = await supertest(app)
			.delete(`/organization/${newOrganization._id}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.expect(OK);
	});

	it('should return 404 if organization not found', async () => {
		const res = await supertest(app)
			.delete(`/organization/60d9d4d7c3c1c9f6e9c0b7d2`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.expect(NOT_FOUND);
	});

	it('should return 400 if organization id is invalid', async () => {
		const res = await supertest(app)
			.delete(`/organization/invalid-id`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.expect(BAD_REQUEST);
	});

	it('should return 404 if organization id is not provided', async () => {
		const res = await supertest(app)
			.delete(`/organization/`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.expect(NOT_FOUND);
	});
});
