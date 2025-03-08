import { Category } from '@/types/category';
import { Label } from './ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select';
import ErrorText from './ui/error-text';
import { useTransactionFilterStore } from '@/store/transactionsFilter';
import { queryClient } from '@/main';
import { QUERY_KEYS } from '@/constants';
import { fetchTransactions } from '@/api/transaction';

type CategoryPickerProps = {
	setCategory: React.Dispatch<React.SetStateAction<Category | undefined>>;
	categories: Category[];
	error: string | undefined;
	defaultValue?: string;
	clean?: boolean;
};

export default function CategoryPicker({
	categories,
	setCategory,
	error,
	defaultValue,
	clean = false,
}: CategoryPickerProps) {
	const { getFilterValues, page, pageSize } = useTransactionFilterStore(
		(state) => state
	);

	const prefetch = (selectedCategory: string) => {
		if (selectedCategory === 'All') return;

		const filters = { ...getFilterValues(), category: selectedCategory };
		const data = queryClient.getQueryData([QUERY_KEYS.TRANSACTION, filters]);

		if (data) return;

		queryClient.prefetchQuery({
			queryKey: [QUERY_KEYS.TRANSACTION, filters],
			queryFn: () => fetchTransactions(filters, page, pageSize),
		});
	};

	return (
		<div className='text-muted-foreground space-y-1 select-none'>
			<Label>{!clean && 'Category:'}</Label>
			<Select
				defaultValue={defaultValue ?? undefined}
				onValueChange={(value) =>
					setCategory(categories.find((c) => c._id === value))
				}
			>
				<SelectTrigger
					className={`w-full focus:ring-0 ${clean && 'border-none pl-0'}`}
				>
					<SelectValue placeholder='Select a category' />
				</SelectTrigger>
				<SelectContent>
					{categories.map((category, i) => (
						<SelectItem
							className='pointer-events-auto'
							key={category._id ?? i}
							value={category._id}
							onMouseEnter={() => prefetch(category._id)}
						>
							{category.organization.name}{' '}
							{category.organization.name ? '-' : ''} {category.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{error && <ErrorText>{error}</ErrorText>}
		</div>
	);
}
