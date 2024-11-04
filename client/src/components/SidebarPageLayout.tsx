import { PropsWithChildren } from 'react';

export default function SidebarPageLayout({ children }: PropsWithChildren) {
	return (
		<div className='space-y-3 h-dvh relative overflow-x-hidden px-1'>
			{children}
		</div>
	);
}
