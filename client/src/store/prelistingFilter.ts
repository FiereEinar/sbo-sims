import { PrelistingFilterValues } from '@/types/prelisting';
import { create } from 'zustand';

interface PrelistingFiltersState extends PrelistingFilterValues {
	setFilters: (filters: PrelistingFilterValues) => void;
	setPage: (page: number) => void;
	setCourse: (course: string) => void;
	setCategory: (category: string) => void;
	setStartDate: (date?: Date) => void;
	setEndDate: (date?: Date) => void;
	setSearch: (search: string) => void;
	getFilterValues: () => PrelistingFilterValues;
}

export const usePrelistingFilterStore = create<PrelistingFiltersState>(
	(set, get) => ({
		page: 1,
		pageSize: 10,
		course: 'All',
		category: 'All',
		startDate: undefined,
		endDate: undefined,
		search: '',
		setPage: (page) => set({ page: page }),
		setCourse: (course) => set({ course: course }),
		setCategory: (category) => set({ category: category }),
		setStartDate: (date) => set({ startDate: date }),
		setEndDate: (date) => set({ endDate: date }),
		setSearch: (search) => set({ search: search }),
		getFilterValues: () => ({
			search: get().search,
			page: get().page,
			pageSize: get().pageSize,
			course: get().course,
			category: get().category,
			startDate: get().startDate,
			endDate: get().endDate,
		}),
		setFilters: (filters) =>
			set(() => ({
				page: filters.page,
				pageSize: filters.pageSize,
				course: filters.course,
				category: filters.category,
				startDate: filters.startDate,
				endDate: filters.endDate,
			})),
	})
);
