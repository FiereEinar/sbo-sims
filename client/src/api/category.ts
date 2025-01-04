import { Transaction } from '@/types/transaction';
import axiosInstance from './axiosInstance';
import { Category, CategoryWithTransactions } from '@/types/category';
import { CategoryFormValues } from '@/components/forms/AddCategoryForm';
import { APIPaginatedResponse, APIResponse } from '@/types/api-response';

export const fetchCategories = async (): Promise<Category[] | undefined> => {
	try {
		const { data } = await axiosInstance.get(`/category`);

		return data.data;
	} catch (err: any) {
		throw err;
	}
};

export const fetchCategoriesWithTransactions = async (): Promise<
	CategoryWithTransactions[] | undefined
> => {
	try {
		const { data } = await axiosInstance.get(`/category/with-transactions`);

		return data.data;
	} catch (err: any) {
		throw err;
	}
};

interface CategoryAndTransactionsObject {
	category: Category;
	categoryTransactions: Transaction[];
}

export const fetchCategoryAndTransactions = async (
	categoryID: string,
	page: number = 1,
	pageSize: number = 50
): Promise<APIPaginatedResponse<CategoryAndTransactionsObject | undefined>> => {
	try {
		const { data } = await axiosInstance.get(
			`/category/${categoryID}?page=${page}&pageSize=${pageSize}&category=${categoryID}`
		);

		return data;
	} catch (err: any) {
		throw err;
	}
};

export const submitCategoryForm = async (
	formData: CategoryFormValues
): Promise<APIResponse<Category> | undefined> => {
	try {
		const { data } = await axiosInstance.post(`/category`, formData);

		return data;
	} catch (err: any) {
		throw err;
	}
};

export const requestDeleteCategory = async (
	categoryID: string
): Promise<APIResponse<Category> | undefined> => {
	try {
		const { data } = await axiosInstance.delete(`/category/${categoryID}`);

		return data;
	} catch (err: any) {
		throw err;
	}
};

export const submitUpdateCategoryForm = async (
	categoryID: string,
	formData: CategoryFormValues
): Promise<APIResponse<Category> | undefined> => {
	try {
		const { data } = await axiosInstance.put(
			`/category/${categoryID}`,
			formData
		);

		return data;
	} catch (err: any) {
		throw err;
	}
};
