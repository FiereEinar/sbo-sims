import { PropsWithChildren } from 'react';

export default function StickyHeader({ children }: PropsWithChildren) {
	return (
		<div className='transition-all sm:py-5 bg-background flex flex-wrap justify-between sm:sticky sm:top-0'>
			{children}
		</div>
	);
}
