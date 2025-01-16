import { StudentFilterValues } from '@/types/student';
import { create } from 'zustand';

interface StudentFiltersState extends StudentFilterValues {
	setFilters: (filters: StudentFilterValues) => void;
	setPage: (page: number) => void;
	setSearch: (search: string) => void;
	setCourse: (course: string) => void;
	setYear: (year: StudentFilterValues['year']) => void;
	setGender: (gender: StudentFilterValues['gender']) => void;
	getFilterValues: () => StudentFilterValues;
}

export const useStudentFilterStore = create<StudentFiltersState>(
	(set, get) => ({
		page: 1,
		pageSize: 10,
		course: 'All',
		gender: 'All',
		search: '',
		sortBy: 'asc',
		year: 'All',
		setPage: (page) => set({ page: page }),
		setSearch: (search) => set({ search: search, page: 1 }),
		setCourse: (course) => set({ course: course }),
		setYear: (year) => set({ year: year }),
		setGender: (gender) => set({ gender: gender }),
		getFilterValues: () => ({
			page: get().page,
			pageSize: get().pageSize,
			search: get().search,
			gender: get().gender,
			course: get().course,
			year: get().year,
			sortBy: get().sortBy,
		}),
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
	})
);
