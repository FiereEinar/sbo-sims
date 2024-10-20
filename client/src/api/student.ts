import {
	Student,
	StudentFilterValues,
	StudentWithTransactions,
} from '@/types/student';
import axiosInstance from './axiosInstance';
import { Transaction } from '@/types/transaction';
import { APIPaginatedResponse, APIResponse } from '@/types/api-response';
import { StudentFormValues } from '@/components/forms/AddStudentForm';

export const fetchStudents = async (
	filters: StudentFilterValues,
	page: number,
	pageSize: number
): Promise<APIPaginatedResponse<StudentWithTransactions[]> | undefined> => {
	try {
		console.log(filters);
		let url = `/student?page=${page}&pageSize=${pageSize}`;
		if (filters.search) url = url + `&search=${filters.search}`;
		if (filters.course) url = url + `&course=${filters.course}`;
		if (filters.year) url = url + `&year=${filters.year}`;
		if (filters.gender) url = url + `&gender=${filters.gender}`;

		const { data } = await axiosInstance.get<
			APIPaginatedResponse<StudentWithTransactions[]>
		>(url);

		return data;
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

export const fetchAvailableCourses = async (): Promise<
	string[] | undefined
> => {
	try {
		const { data } = await axiosInstance.get(`/student/courses`);

		return data.data;
	} catch (err: any) {
		console.error('Failed to fetch student courses', err);
	}
};
