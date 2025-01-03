import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import supertest, { Response } from 'supertest';
import app from '../../app';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { accessTokenCookieName } from '../../constants';
import { SECRET_ADMIN_KEY } from '../../constants/env';

let accessToken: string;
let mongoServer: MongoMemoryServer;

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
		.expect(200);

	// sign in mock user
	res = await supertest(app).post('/auth/login').send(user).expect(200);

	// get access token
	accessToken = res.body.data.accessToken;

	expect(res.body.success).toBe(true);
});

afterAll(async () => {
	await mongoServer.stop();
});

describe('POST - Create Student', () => {
	it('should create a student', async () => {
		const student = {
			studentID: '2301106599',
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
			.send(student)
			.expect(200);

		expect(res.body.success).toBe(true);
	});

	it('should not create a student with the same studentID', async () => {
		const student = {
			studentID: '2301106599',
			firstname: 'Jhon',
			lastname: 'Doe',
			email: 'jhon2@gmail.com',
			course: 'BSIT',
			gender: 'M',
			middlename: 'G',
			year: 1,
		};

		const res = await supertest(app)
			.post('/student')
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(student)
			.expect(200); // 200 because the request is successful, but the student is not created

		expect(res.body.success).toBe(false); // student is not created
	});

	it('should not create a student with invalid data', async () => {
		const student = {
			studentID: '2301106599',
			firstname: 'Jhon',
			lastname: 'Doe',
			email: '',
			course: 'BSIT',
			gender: 'M',
			middlename: 'G',
			year: 1,
		};

		const res = await supertest(app)
			.post('/student')
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(student)
			.expect(200);

		expect(res.body.success).toBe(false);
	});

	it('should not create a student without access token', async () => {
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

		const res = await supertest(app).post('/student').send(student).expect(401);

		expect(res.body.success).toBe(false);
	});

	it('should not create a student with invalid access token', async () => {
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

		const res = await supertest(app)
			.post('/student')
			.set('Cookie', [`${accessTokenCookieName}=invalid-token`])
			.send(student)
			.expect(401);

		expect(res.body.success).toBe(false);
	});

	it('should not create a student without studentID', async () => {
		const student = {
			firstname: 'Jhon',
			lastname: 'Doe',
			email: 'jhon@gmail.com',
			course: 'BSIT',
			gender: 'M',
			middlename: 'G',
			year: 1,
		};

		const res = await supertest(app)
			.post('/student')
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(student)
			.expect(200);

		expect(res.body.success).toBe(false);
	});

	it('should not create a student without firstname', async () => {
		const student = {
			studentID: '2301106599',
			lastname: 'Doe',
			email: 'jhon@gmail.com',
			course: 'BSIT',
			gender: 'M',
			middlename: 'G',
			year: 1,
		};

		const res = await supertest(app)
			.post('/student')
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(student)
			.expect(200);

		expect(res.body.success).toBe(false);
	});
});
