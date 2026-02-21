import { ShieldX, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function NoPermission() {
	return (
		<div className='flex flex-col items-center justify-center min-h-[60vh] px-6 text-center'>
			<ShieldX className='w-16 h-16 text-destructive mb-4' />

			<h2 className='text-2xl font-semibold'>Access Denied</h2>

			<p className='text-sm text-muted-foreground mt-2 max-w-sm'>
				You don’t have permission to view this page or perform this action.
			</p>

			<Link to='/' className='mt-6'>
				<Button variant='outline'>
					<ArrowLeft className='w-4 h-4 mr-2' />
					Go back home
				</Button>
			</Link>
		</div>
	);
}
