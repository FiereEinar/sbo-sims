// import { StudentFilterValues } from "@/types/student";

// export function useStudentsFilter(): {filters: StudentFilterValues} {
//   const [search, setSearch] = useState<StudentFilterValues['search']>('');
// 	const debouncedSearch = useDebounce(search);

// 	const [course, setCourse] = useState<StudentFilterValues['course']>(
// 		courses[0]
// 	);

// 	const [gender, setGender] = useState<StudentFilterValues['gender']>('All');
// 	const gendersOptions = ['All', 'M', 'F'];

// 	const [year, setYear] = useState<StudentFilterValues['year']>('All');
// 	const yearsOptions = ['All', '1', '2', '3', '4'];

// 	// having issues implementing this, it just defaults to acsending for now
// 	const [sortBy, setSortBy] = useState<StudentFilterValues['sortBy']>('asc');
// 	const sortingOptions = ['asc', 'dec'];

// 	useEffect(() => {
// 		onChange({ search: debouncedSearch, course, gender, year, sortBy });
//   }, [debouncedSearch, course, gender, year, sortBy]);

//   return {
//     filters: {
//       search, course, gender, year, sortBy,

//     }
//   }
// }
