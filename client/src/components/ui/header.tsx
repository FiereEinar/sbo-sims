import { cn } from '@/lib/utils';
import { PropsWithChildren } from 'react';

type HeaderSize = 'lg' | 'md' | 'sm';

type HeaderProps = PropsWithChildren & {
	size?: HeaderSize;
	className?: string;
};

export default function Header({
	children,
	size = 'lg',
	className,
}: HeaderProps) {
	return (
		<>
			{size === 'lg' && (
				<h1
					className={cn(
						'text-3xl font-bold text-popover-foreground',
						className
					)}
				>
					{children}
				</h1>
			)}
			{size === 'md' && (
				<h1
					className={cn(
						'text-2xl font-bold text-popover-foreground',
						className
					)}
				>
					{children}
				</h1>
			)}
			{size === 'sm' && (
				<h1
					className={cn('text-xl font-bold text-popover-foreground', className)}
				>
					{children}
				</h1>
			)}
		</>
	);
}
