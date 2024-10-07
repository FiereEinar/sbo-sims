import { Student, StudentWithTransactions } from '@/types/student';
import axiosInstance from './axiosInstance';
import { Transaction } from '@/types/transaction';
import { APIResponse } from '@/types/api-response';

export const fetchStudents = async (): Promise<
	StudentWithTransactions[] | undefined
> => {
	try {
		const { data } = await axiosInstance.get('/student');

		return data.data;
	} catch (err: any) {
		console.error('Failed to fetch students', err);
	}
};

export const fetchStudentByID = async (
	studentID: string
): Promise<Student | undefined> => {
	try {
		const { data } = await axiosInstance.get(`/student/${studentID}`);

		return data.data;
	} catch (err: any) {
		console.error(`Failed to fetch student with ID ${studentID}`, err);
	}
};

export const fetchStudentTransactions = async (
	studentID: string
): Promise<Transaction[] | undefined> => {
	try {
		const { data } = await axiosInstance.get(
			`/student/${studentID}/transaction`
		);

		return data.data;
	} catch (err: any) {
		console.error(
			`Failed to fetch transactions of student with ID ${studentID}`,
			err
		);
	}
};

export const submitStudentForm = async (
	formData: Student
): Promise<APIResponse | undefined> => {
	try {
		const { data } = await axiosInstance.post('/student', formData);

		return data;
	} catch (err: any) {
		console.error('Failed to submit student form', err);
	}
};
