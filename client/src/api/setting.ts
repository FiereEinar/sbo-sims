import axiosInstance from './axiosInstance';
import { APIResponse } from '@/types/api-response';
import { AppSetting } from '@/types/appSetting';

export const fetchSettings = async (): Promise<AppSetting> => {
	const { data } = await axiosInstance.get<APIResponse<AppSetting>>('/setting');
	return data.data;
};

export const updateSettings = async (
	settings: Partial<AppSetting>
): Promise<AppSetting> => {
	const { data } = await axiosInstance.put<APIResponse<AppSetting>>(
		'/setting',
		settings
	);
	return data.data;
};
