import { PropsWithChildren } from 'react';

export default function Header({ children }: PropsWithChildren) {
	return <h1 className='text-2xl'> {children}</h1>;
}
