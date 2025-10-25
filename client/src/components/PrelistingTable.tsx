import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from './ui/table';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DateText from './ui/date-text';
import _ from 'lodash';
import CategoryPicker from './CategoryPicker';
import { Category } from '@/types/category';
import { fetchCategories } from '@/api/category';
import { QUERY_KEYS } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select';
import { fetchAvailableCourses } from '@/api/student';
import TableLoading from './loading/TableLoading';
import { queryClient } from '@/main';
import { Prelisting } from '@/types/prelisting';
import { usePrelistingFilterStore } from '@/store/prelistingFilter';
import { fetchPrelistings } from '@/api/prelisting';

type PrelistingTableProps = {
	prelistings?: Prelisting[];
	isLoading: boolean;
	disableFiltes?: boolean;
	disableCategories?: boolean;
	disableCourse?: boolean;
};

export default function PrelistingTable({
	prelistings,
	isLoading,
	disableFiltes = false,
	disableCourse = false,
	disableCategories = false,
}: PrelistingTableProps) {
	const navigate = useNavigate();

	return (
		<Table>
			{/* <TableCaption>A list of your recent invoices.</TableCaption> */}
			<TableHeader>
				<TableRow className='select-none'>
					<TableHead className='w-[100px]'>Student ID</TableHead>
					<TableHead className='w-[200px]'>Fullname</TableHead>
					<TableHead className='w-[75px]'>
						{disableFiltes || disableCourse ? (
							'Course'
						) : (
							<TableHeadCoursePicker />
						)}
					</TableHead>
					<TableHead className='w-[175px]'>Date</TableHead>
					<TableHead className='w-[300px]'>
						{disableFiltes || disableCategories ? (
							'Category'
						) : (
							<TableHeadCategoryPicker />
						)}
					</TableHead>
				</TableRow>
			</TableHeader>

			<TableBody>
				{isLoading && <TableLoading colSpan={7} />}
				{!prelistings?.length && !isLoading && (
					<TableRow>
						<TableCell colSpan={7}>No prelistings</TableCell>
					</TableRow>
				)}
				{prelistings &&
					prelistings.map((prelisting) => {
						return (
							<TableRow
								onClick={() => navigate(`/prelisting/${prelisting._id}`)}
								className='cursor-pointer'
								key={prelisting._id}
							>
								<TableCell className=''>{prelisting.owner.studentID}</TableCell>
								<TableCell className=''>
									{_.startCase(
										`${prelisting.owner.firstname} ${
											prelisting.owner.middlename ?? ''
										} ${prelisting.owner.lastname}`
									)}
								</TableCell>
								<TableCell className=''>{prelisting.owner.course}</TableCell>
								<TableCell className=''>
									<DateText date={new Date(prelisting.date ?? '')} />
								</TableCell>
								<TableCell className=''>
									{prelisting.category.organization.name} -{' '}
									{prelisting.category.name}
								</TableCell>
							</TableRow>
						);
					})}
			</TableBody>

			<TableFooter>
				<TableRow>
					{/* <TableCell colSpan={6}>Total</TableCell>
					<TableCell className='text-right'>
						P{numberWithCommas(totalAmount)}
					</TableCell> */}
				</TableRow>
			</TableFooter>
		</Table>
	);
}

function TableHeadCoursePicker() {
	const { course, setCourse, getFilterValues, page, pageSize } =
		usePrelistingFilterStore((state) => state);
	const { data: courses } = useQuery({
		queryKey: [QUERY_KEYS.STUDENT_COURSES],
		queryFn: fetchAvailableCourses,
	});

	const prefetch = (selectedCourse: string) => {
		if (selectedCourse === 'All') return;

		const filters = { ...getFilterValues(), course: selectedCourse };
		const data = queryClient.getQueryData([QUERY_KEYS.PRELISTING, filters]);

		if (data) return;

		queryClient.prefetchQuery({
			queryKey: [QUERY_KEYS.PRELISTING, filters],
			queryFn: () => fetchPrelistings(filters, page, pageSize),
		});
	};

	return (
		<div className='flex flex-col justify-end items-start gap-2'>
			<Select defaultValue={course} onValueChange={(value) => setCourse(value)}>
				<SelectTrigger className='w-full border-none pl-0 focus:ring-0'>
					<SelectValue placeholder='Course' />
				</SelectTrigger>
				<SelectContent>
					{courses &&
						['All'].concat(courses).map((course, i) => (
							<SelectItem
								key={i}
								value={course}
								onMouseEnter={() => prefetch(course)}
							>
								{course === 'All' ? course + ' Courses' : course}
							</SelectItem>
						))}
				</SelectContent>
			</Select>
		</div>
	);
}

function TableHeadCategoryPicker() {
	const { category, setCategory } = usePrelistingFilterStore((state) => state);
	const [cat, setCat] = useState<Category | undefined>(undefined);
	const { data: categories } = useQuery({
		queryKey: [QUERY_KEYS.CATEGORY],
		queryFn: fetchCategories,
	});

	useEffect(() => {
		if (cat) setCategory(cat._id);
	}, [cat]);

	return (
		<CategoryPicker
			clean={true}
			error={undefined}
			defaultValue={category ?? 'All'}
			setCategory={setCat}
			categories={[
				{
					_id: 'All',
					name: 'All Categories',
					__v: 0,
					fee: 0,
					organization: '',
				} as unknown as Category,
			].concat(categories || [])}
		/>
	);
}
