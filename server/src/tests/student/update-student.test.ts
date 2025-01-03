import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
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

	// create a student
	res = await supertest(app)
		.post(`/student`)
		.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
		.send(student)
		.expect(200);

	expect(res.body.success).toBe(true);
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

// beforeEach(async () => {
// 	const res = await supertest(app)
// 		.post(`/student`)
// 		.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
// 		.send(student)
// 		.expect(200);

// 	expect(res.body.success).toBe(true);
// });

describe('PUT - Update Student', () => {
	it('should update a student', async () => {
		const updatedStudent = {
			firstname: 'jane',
			lastname: 'doe',
		};

		const res = await supertest(app)
			.put(`/student/${student.studentID}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(updatedStudent)
			.expect(200);

		expect(res.body.success).toBe(true);
		expect(res.body.data.firstname).toBe(updatedStudent.firstname);
		expect(res.body.data.lastname).toBe(updatedStudent.lastname);
	});

	it('should not modify the studentID', async () => {
		const updatedStudent = {
			studentID: '2301106588',
			firstname: 'jane',
			lastname: 'doe',
		};

		const res = await supertest(app)
			.put(`/student/${student.studentID}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(updatedStudent)
			.expect(200);

		expect(res.body.success).toBe(true);
		expect(res.body.data.studentID).toBe(student.studentID);
	});

	it('should not update a student with invalid data', async () => {
		const updatedStudent = {
			firstname: '',
			lastname: 'doe',
		};

		const res = await supertest(app)
			.put(`/student/${student.studentID}`)
			.set('Cookie', [`${accessTokenCookieName}=${accessToken}`])
			.send(updatedStudent)
			.expect(200);

		expect(res.body.success).toBe(false);
	});
});
