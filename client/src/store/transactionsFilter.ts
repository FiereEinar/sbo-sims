import {
	TransactionPeriodFilter,
	TransactionsFilterValues,
} from '@/types/transaction';
import { create } from 'zustand';

interface StudentFiltersState extends TransactionsFilterValues {
	setFilters: (filters: TransactionsFilterValues) => void;
	setPage: (page: number) => void;
	setCourse: (course: string) => void;
	setCategory: (category: string) => void;
	setStartDate: (date?: Date) => void;
	setEndDate: (date?: Date) => void;
	setPeriod: (period: string) => void;
	setStatus: (status?: boolean) => void;
	setSearch: (search: string) => void;
}

export const useTransactionFilterStore = create<StudentFiltersState>((set) => ({
	page: 1,
	pageSize: 10,
	course: 'All',
	category: 'All',
	startDate: undefined,
	endDate: undefined,
	period: 'all',
	status: undefined,
	search: '',
	setPage: (page) => set({ page: page }),
	setCourse: (course) => set({ course: course }),
	setCategory: (category) => set({ category: category }),
	setStartDate: (date) => set({ startDate: date }),
	setEndDate: (date) => set({ endDate: date }),
	setPeriod: (period) => set({ period: period as TransactionPeriodFilter }),
	setStatus: (status) => set({ status: status }),
	setSearch: (search) => set({ search: search }),
	setFilters: (filters) =>
		set(() => ({
			page: filters.page,
			pageSize: filters.pageSize,
			course: filters.course,
			category: filters.category,
			startDate: filters.startDate,
			endDate: filters.endDate,
			period: filters.period,
			status: filters.status,
		})),
}));
