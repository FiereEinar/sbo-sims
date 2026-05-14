import { Button } from '@/components/ui/button';
import { Link, useRouteError } from 'react-router-dom';

export default function ErrorPage() {
	const error = useRouteError() as any;

	const message =
		error?.statusText ||
		error?.message ||
		'An unexpected error occurred.';

	return (
		<div className='h-screen flex items-center justify-center bg-background'>
			<div className='max-w-md mx-auto p-6 text-popover-foreground rounded-xl shadow-2xl bg-card border border-border'>
				<div className='flex items-center gap-3 mb-4'>
					<div className='flex items-center justify-center size-10 rounded-full bg-destructive/15 text-destructive text-lg font-bold'>
						!
					</div>
					<h1 className='text-2xl font-bold'>Something went wrong</h1>
				</div>
				<p className='text-muted-foreground mb-6 text-sm leading-relaxed'>
					{message}
				</p>
				<div className='flex gap-3'>
					<Link to='/'>
						<Button className='font-bold py-2 px-4'>Return to Home</Button>
					</Link>
					<Button
						variant='outline'
						className='font-bold py-2 px-4'
						onClick={() => window.location.reload()}
					>
						Reload Page
					</Button>
				</div>
			</div>
		</div>
	);
}
