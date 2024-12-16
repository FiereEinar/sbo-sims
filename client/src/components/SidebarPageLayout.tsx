import { PropsWithChildren } from 'react';

export default function SidebarPageLayout({ children }: PropsWithChildren) {
	return (
		<div className='animate-appear space-y-3 h-[88dvh] sm:h-dvh relative overflow-x-hidden overflow-y-auto px-2'>
			{children}
			<div className='h-5' />
		</div>
	);
}
