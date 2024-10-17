import { PropsWithChildren } from 'react';

export default function StickyHeader({ children }: PropsWithChildren) {
	return (
		<div className='transition-all py-5 bg-background z-50 flex justify-between sticky top-0'>
			{children}
		</div>
	);
}
