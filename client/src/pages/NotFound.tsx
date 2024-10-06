import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function NotFound() {
	return (
		<div className='h-screen flex items-center justify-center bg-background'>
			<div className='max-w-md mx-auto p-4 bg-dark-100 text-popover-foreground rounded shadow-2xl bg-card'>
				<h1 className='text-3xl font-bold mb-4'>404 Not Found</h1>
				<p className='text-muted-foreground mb-8'>
					Sorry, the page you&apos;re looking for doesn&apos;t exist.
				</p>
				<Link to='/'>
					<Button className='font-bold py-2 px-4'>Return to Home</Button>
				</Link>
			</div>
		</div>
	);
}
