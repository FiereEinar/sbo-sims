import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from '@/components/ui/select';
import { useViewModeStore } from '@/store/viewModeStore';
import { LayoutGrid, List } from 'lucide-react';

// export type ViewMode = 'table' | 'cards';

// interface ViewModeToggleProps {
// 	value: ViewMode;
// 	onChange: (mode: ViewMode) => void;
// }

export default function ViewModeToggle() {
	const { viewMode, setViewMode } = useViewModeStore();

	return (
		<Select value={viewMode} onValueChange={(val) => setViewMode(val as any)}>
			<SelectTrigger className='w-12 h-10 p-0 flex items-center justify-center'>
				{viewMode === 'table' ? <List size={18} /> : <LayoutGrid size={18} />}
			</SelectTrigger>

			<SelectContent>
				<SelectItem value='table'>
					<div className='flex items-center gap-2'>
						<List size={16} />
						List
					</div>
				</SelectItem>

				<SelectItem value='cards'>
					<div className='flex items-center gap-2'>
						<LayoutGrid size={16} />
						Cards
					</div>
				</SelectItem>
			</SelectContent>
		</Select>
	);
}
