import { PropsWithChildren } from 'react';

export default function SidebarPageLayout({ children }: PropsWithChildren) {
	return (
		<div className='animate-appear space-y-3 h-[calc(100dvh-4rem)] relative overflow-x-hidden overflow-y-auto p-3 sm:p-5 bg-card/40'>
			{children}
			<div className='h-5' />
		</div>
	);
}
