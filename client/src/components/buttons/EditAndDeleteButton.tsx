import { Button } from '../ui/button';

export default function EditAndDeleteButton() {
	return (
		<div className='space-x-2'>
			<Button size='sm' variant='ocean'>
				Edit
			</Button>
			<Button size='sm' variant='destructive'>
				Delete
			</Button>
		</div>
	);
}
