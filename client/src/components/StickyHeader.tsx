import { PropsWithChildren } from 'react';

export default function StickyHeader({ children }: PropsWithChildren) {
	return (
		<div className='transition-all bg-background flex flex-wrap justify-between sm:sticky sm:top-0'>
			{children}
		</div>
	);
}
