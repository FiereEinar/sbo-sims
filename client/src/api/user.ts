import { SignupFormValues } from '@/components/forms/SignupForm';
import { APIResponse } from '@/types/api-response';
import axiosInstance from './axiosInstance';
import { LoginFormValues } from '@/components/forms/LoginForm';
import { User } from '@/types/user';
import { UserFormValues } from '@/components/forms/AddUserForm';

export const submitSignupForm = async (
	formData: SignupFormValues,
): Promise<APIResponse<User> | undefined> => {
	try {
		const { data } = await axiosInstance.post('/auth/signup', formData);

		return data;
	} catch (err: any) {
		throw err;
	}
};

type DeviceTypes = 'desktop' | 'mobile' | 'tablet';

export const submitLoginForm = async (
	formData: LoginFormValues,
): Promise<
	| APIResponse<{ user: User; accessToken: string; device: DeviceTypes }>
	| undefined
> => {
	try {
		const { data } = await axiosInstance.post('/auth/login', formData);

		return data;
	} catch (err: any) {
		throw err;
	}
};

export const submitUserForm = async (
	formData: UserFormValues,
): Promise<APIResponse<User> | undefined> => {
	try {
		const { data } = await axiosInstance.post('/user', formData);

		return data;
	} catch (err: any) {
		throw err;
	}
};

export const submitUpdateUserForm = async (
	userID: string,
	formData: UserFormValues,
): Promise<APIResponse<User> | undefined> => {
	try {
		const { data } = await axiosInstance.put(`/user/${userID}`, formData);

		return data;
	} catch (err: any) {
		throw err;
	}
};

export const submitAdminUpdateUserForm = async (
	userID: string,
	formData: UserFormValues,
): Promise<APIResponse<User> | undefined> => {
	try {
		const { data } = await axiosInstance.put(`/user/${userID}/admin`, formData);

		return data;
	} catch (err: any) {
		throw err;
	}
};

export const fetchUserByID = async (
	userID: string,
): Promise<User | undefined> => {
	try {
		const { data } = await axiosInstance.get(`/user/${userID}`);

		return data.data;
	} catch (err: any) {
		throw err;
	}
};
