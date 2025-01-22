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

describe('POST - Create Organization', () => {
	it('should create an organization', async () => {
		const organization = {
			name: 'ACM',
			governor: 'Jhon Doe',
			viceGovernor: 'Jane Doe',
			treasurer: 'Jhonny Doe',
			auditor: 'Jhane Doe',
			departments: ['BSIT', 'BSEMC-DAT'],
		};

		const res = await supertest(app)
			.post(`/organization`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(organization)
			.expect(OK);

		expect(res.body.data.name).toBe(organization.name);
		expect(res.body.data.governor).toBe(organization.governor.toLowerCase());
	});

	it('should return 400 if no department is provided', async () => {
		const organization = {
			name: 'ACM',
			governor: 'Jhon Doe',
			viceGovernor: 'Jane Doe',
			treasurer: 'Jhonny Doe',
			auditor: 'Jhane Doe',
			departments: [],
		};

		const res = await supertest(app)
			.post(`/organization`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(organization)
			.expect(BAD_REQUEST);
	});

	it('should return 400 if department is empty', async () => {
		const organization = {
			name: 'ACM',
			governor: 'Jhon Doe',
			viceGovernor: 'Jane Doe',
			treasurer: 'Jhonny Doe',
			auditor: 'Jhane Doe',
		};

		const res = await supertest(app)
			.post(`/organization`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(organization)
			.expect(BAD_REQUEST);
	});

	it('should return 400 if department is not an array', async () => {
		const organization = {
			name: 'ACM',
			governor: 'Jhon Doe',
			viceGovernor: 'Jane Doe',
			treasurer: 'Jhonny Doe',
			auditor: 'Jhane Doe',
			departments: 'BSIT',
		};

		const res = await supertest(app)
			.post(`/organization`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(organization)
			.expect(BAD_REQUEST);
	});

	it('should return 400 if department is not a string', async () => {
		const organization = {
			name: 'ACM',
			governor: 'Jhon Doe',
			viceGovernor: 'Jane Doe',
			treasurer: 'Jhonny Doe',
			auditor: 'Jhane Doe',
			departments: [1],
		};

		const res = await supertest(app)
			.post(`/organization`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(organization)
			.expect(BAD_REQUEST);
	});

	it('should return 400 if name is empty', async () => {
		const organization = {
			name: '',
			governor: 'Jhon Doe',
			viceGovernor: 'Jane Doe',
			treasurer: 'Jhonny Doe',
			auditor: 'Jhane Doe',
			departments: ['BSIT'],
		};

		const res = await supertest(app)
			.post(`/organization`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(organization)
			.expect(BAD_REQUEST);
	});

	it('should return 400 if governor is empty', async () => {
		const organization = {
			name: 'ACM',
			governor: '',
			viceGovernor: 'Jane Doe',
			treasurer: 'Jhonny Doe',
			auditor: 'Jhane Doe',
			departments: ['BSIT'],
		};

		const res = await supertest(app)
			.post(`/organization`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(organization)
			.expect(BAD_REQUEST);
	});

	it('should return 400 if viceGovernor is empty', async () => {
		const organization = {
			name: 'ACM',
			governor: 'Jhon Doe',
			viceGovernor: '',
			treasurer: 'Jhonny Doe',
			auditor: 'Jhane Doe',
			departments: ['BSIT'],
		};

		const res = await supertest(app)
			.post(`/organization`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(organization)
			.expect(BAD_REQUEST);
	});

	it('should return 400 if treasurer is empty', async () => {
		const organization = {
			name: 'ACM',
			governor: 'Jhon Doe',
			viceGovernor: 'Jane Doe',
			treasurer: '',
			auditor: 'Jhane Doe',
			departments: ['BSIT'],
		};

		const res = await supertest(app)
			.post(`/organization`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(organization)
			.expect(BAD_REQUEST);
	});

	it('should return 400 if auditor is empty', async () => {
		const organization = {
			name: 'ACM',
			governor: 'Jhon Doe',
			viceGovernor: 'Jane Doe',
			treasurer: 'Jhonny Doe',
			auditor: '',
			departments: ['BSIT'],
		};

		const res = await supertest(app)
			.post(`/organization`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(organization)
			.expect(BAD_REQUEST);
	});
});
