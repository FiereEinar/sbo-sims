import { Transaction } from '@/types/transaction';
import axiosInstance from './axiosInstance';
import { Category, CategoryWithTransactions } from '@/types/category';

export const fetchCategories = async (): Promise<
	CategoryWithTransactions[] | undefined
> => {
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
