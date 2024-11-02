import { StudentFilterValues } from '@/types/student';
import { create } from 'zustand';

interface StudentFiltersState extends StudentFilterValues {}

export const useStudentFilterStore = create<StudentFiltersState>((set) => ({
	course: 'All',
	gender: 'All',
	search: '',
	sortBy: 'asc',
	year: 'All',
	setFilters: (filters: StudentFilterValues) =>
		set(() => ({
			course: filters.course,
			gender: filters.gender,
			search: filters.search,
			sortBy: filters.sortBy,
			year: filters.year,
		})),
}));
