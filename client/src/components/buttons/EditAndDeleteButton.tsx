import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';

export default function EditAndDeleteButton() {
	return (
		<div className='space-x-2 flex'>
			<Button className='flex gap-1' size='sm' variant='outline'>
				<Pencil className='size-4' />
				<p>Edit</p>
			</Button>
			<Button className='flex gap-1' size='sm' variant='destructive'>
				<Trash2 className='size-4' />
				<p>Delete</p>
			</Button>
		</div>
	);
}
