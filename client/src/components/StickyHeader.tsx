import { PropsWithChildren } from 'react';

export default function StickyHeader({ children }: PropsWithChildren) {
	return (
		<div className='bg-background py-5 z-50 flex justify-between sticky top-0'>
			{children}
		</div>
	);
}
