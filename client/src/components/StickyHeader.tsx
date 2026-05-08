import { PropsWithChildren } from 'react';

export default function StickyHeader({ children }: PropsWithChildren) {
	return (
		<div className='transition-all flex gap-2 flex-wrap justify-between z-100 items-center '>
			{children}
		</div>
	);
}
