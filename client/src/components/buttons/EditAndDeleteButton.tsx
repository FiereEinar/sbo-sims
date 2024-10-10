import { Button } from '../ui/button';

export default function EditAndDeleteButton() {
	return (
		<div className='space-x-2 flex'>
			<Button className='flex gap-1' size='sm' variant='ocean'>
				<img src='/icons/edit.svg' className='size-5' alt='' />
				<p>Edit</p>
			</Button>
			<Button className='flex gap-1' size='sm' variant='destructive'>
				<img src='/icons/delete.svg' className='size-5' alt='' />
				<p>Delete</p>
			</Button>
		</div>
	);
}
