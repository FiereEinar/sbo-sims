import { Transaction } from '@/types/transaction';
import axiosInstance from './axiosInstance';
import { Category } from '@/types/category';
import { CategoryFormValues } from '@/components/forms/AddCategoryForm';
import { APIResponse } from '@/types/api-response';

export const fetchCategories = async (): Promise<Category[] | undefined> => {
	try {
		const { data } = await axiosInstance.get(`/category`);

		return data.data;
	} catch (err: any) {
		console.error('Failed to fetch categories', err);
	}
};

interface CategoryAndTransactionsObject {
	category: Category;
	categoryTransactions: Transaction[];
}

export const fetchCategoryAndTransactions = async (
	categoryID: string
): Promise<CategoryAndTransactionsObject | undefined> => {
	try {
		const { data } = await axiosInstance.get(`/category/${categoryID}`);

		return data.data;
	} catch (err: any) {
		console.error('Failed to fetch category and its transaction', err);
	}
};

export const submitCategoryForm = async (
	formData: CategoryFormValues
): Promise<APIResponse<Category> | undefined> => {
	try {
		const { data } = await axiosInstance.post(`/category`, formData);

		return data;
	} catch (err: any) {
		console.error('Failed to submit category form', err);
	}
};
