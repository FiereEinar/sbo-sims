import { SignupFormValues } from '@/components/forms/SignupForm';
import { APIResponse } from '@/types/api-response';
import axiosInstance from './axiosInstance';
import { LoginFormValues } from '@/components/forms/LoginForm';
import { User } from '@/types/user';

export const submitSignupForm = async (
	formData: SignupFormValues
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
	formData: LoginFormValues
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
