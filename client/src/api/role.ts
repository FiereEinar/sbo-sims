import { RoleFormValues } from '@/components/forms/AddRoleForm';
import { Role } from '@/types/role';
import axiosInstance from './axiosInstance';

export const submitRoleForm = async (
	formData: RoleFormValues,
): Promise<Role | undefined> => {
	try {
		const { data } = await axiosInstance.post('/role', formData);

		return data.data;
	} catch (err: any) {
		throw err;
	}
};

export const submitUpdateRoleForm = async (
	roleID: string,
	formData: RoleFormValues,
): Promise<Role | undefined> => {
	try {
		const { data } = await axiosInstance.patch(`/role/${roleID}`, formData);

		return data.data;
	} catch (err: any) {
		throw err;
	}
};

export const submitUpdateRolePermissions = async (
	roleID: string,
	formData: { permissions: string[] },
): Promise<Role | undefined> => {
	try {
		const { data } = await axiosInstance.patch(`/role/${roleID}`, formData);

		return data.data;
	} catch (err: any) {
		throw err;
	}
};

export const fetchRoleByID = async (
	roleID: string,
): Promise<Role | undefined> => {
	try {
		const { data } = await axiosInstance.get(`/role/${roleID}`);

		return data.data;
	} catch (err: any) {
		throw err;
	}
};
