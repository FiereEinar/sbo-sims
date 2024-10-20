import { Student, StudentWithTransactions } from '@/types/student';
import axiosInstance from './axiosInstance';
import { Transaction } from '@/types/transaction';
import { APIPaginatedResponse, APIResponse } from '@/types/api-response';
import { StudentFormValues } from '@/components/forms/AddStudentForm';

export const fetchStudents = async (): Promise<
	StudentWithTransactions[] | undefined
> => {
	try {
		const { data } = await axiosInstance.get<
			APIPaginatedResponse<StudentWithTransactions[]>
		>('/student?page=1&pageSize=50');

		console.log(data);
		console.log(typeof data.prev);
		console.log(typeof data.next);

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
	formData: StudentFormValues
): Promise<APIResponse<Student> | undefined> => {
	try {
		const { data } = await axiosInstance.post('/student', formData);

		return data;
	} catch (err: any) {
		console.error('Failed to submit student form', err);
	}
};

export const submitUpdateStudentForm = async (
	studentID: string,
	formData: StudentFormValues
): Promise<APIResponse<Student> | undefined> => {
	try {
		const { data } = await axiosInstance.put(`/student/${studentID}`, formData);

		return data;
	} catch (err: any) {
		console.error('Failed to submit update student form', err);
	}
};

export const requestDeleteStudent = async (
	studentID: string
): Promise<APIResponse<Student> | undefined> => {
	try {
		const { data } = await axiosInstance.delete(`/student/${studentID}`);

		return data;
	} catch (err: any) {
		console.error('Failed to send request delete student', err);
	}
};
