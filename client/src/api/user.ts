import { SignupFormValues } from '@/components/forms/SignupForm';
import { APIResponse } from '@/types/api-response';
import axiosInstance from './axiosInstance';

export const submitSignupForm = async (
	formData: SignupFormValues
): Promise<APIResponse | undefined> => {
	try {
		const { data } = await axiosInstance.post('/auth/signup', formData);

		return data;
	} catch (err: any) {
		console.error('Failed to submit signup form', err);
	}
};
