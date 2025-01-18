import { PropsWithChildren } from 'react';

type HeaderSize = 'lg' | 'md' | 'sm';

type HeaderProps = PropsWithChildren & {
	size?: HeaderSize;
};

export default function Header({ children, size = 'lg' }: HeaderProps) {
	return (
		<>
			{size === 'lg' && (
				<h1 className='text-3xl font-bold text-popover-foreground'>
					{children}
				</h1>
			)}
			{size === 'md' && (
				<h1 className='text-2xl font-bold text-popover-foreground'>
					{children}
				</h1>
			)}
			{size === 'sm' && (
				<h1 className='text-xl font-bold text-popover-foreground'>
					{children}
				</h1>
			)}
		</>
	);
}
