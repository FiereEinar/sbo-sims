import { PropsWithChildren } from 'react';

export default function Header({ children }: PropsWithChildren) {
	return (
		<h1 className='text-3xl font-bold text-popover-foreground'> {children}</h1>
	);
}
