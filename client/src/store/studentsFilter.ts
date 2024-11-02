import { StudentFilterValues } from '@/types/student';
import { create } from 'zustand';

interface StudentFiltersState extends StudentFilterValues {
	setFilters: (filters: StudentFilterValues) => void;
	setPage: (page: number) => void;
}

export const useStudentFilterStore = create<StudentFiltersState>((set) => ({
	page: 1,
	pageSize: 10,
	course: 'All',
	gender: 'All',
	search: '',
	sortBy: 'asc',
	year: 'All',
	setPage: (page) => set({ page: page }),
	setFilters: (filters) =>
		set(() => ({
			page: filters.page,
			pageSize: filters.pageSize,
			course: filters.course,
			gender: filters.gender,
			search: filters.search,
			sortBy: filters.sortBy,
			year: filters.year,
		})),
}));
