import { PropsWithChildren } from 'react';

export default function StickyHeader({ children }: PropsWithChildren) {
	return (
		<div className='transition-all bg-background flex gap-2 flex-wrap justify-between items-center sm:sticky sm:top-0'>
			{children}
		</div>
	);
}
