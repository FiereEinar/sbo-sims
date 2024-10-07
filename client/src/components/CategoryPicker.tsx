import { Category } from '@/types/category';
import { Label } from './ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select';

type CategoryPickerProps = {
	setCategory: React.Dispatch<React.SetStateAction<string | undefined>>;
	categories: Category[];
	error: string | undefined;
};

export default function CategoryPicker({
	categories,
	setCategory,
	error,
}: CategoryPickerProps) {
	return (
		<div className='text-muted-foreground space-y-1'>
			<Label>Category:</Label>
			<Select onValueChange={(value) => setCategory(value)}>
				<SelectTrigger className='w-full'>
					<SelectValue placeholder='Select a category' />
				</SelectTrigger>
				<SelectContent>
					{categories.map((category) => (
						<SelectItem key={category._id} value={category._id}>
							{category.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{error && <p className='text-xs text-destructive'>{error}</p>}
		</div>
	);
}
