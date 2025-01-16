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

type CategoryPickerProps = {
	setCategory:
		| React.Dispatch<React.SetStateAction<string | undefined>>
		| ((category: string) => void);
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
	return (
		<div className='text-muted-foreground space-y-1 select-none'>
			<Label>{!clean && 'Category:'}</Label>
			<Select
				defaultValue={defaultValue ?? undefined}
				onValueChange={(value) => setCategory(value)}
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
