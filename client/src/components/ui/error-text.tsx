import { PropsWithChildren } from 'react';

export default function ErrorText({ children }: PropsWithChildren) {
	return <p className='text-xs text-red-500'>{children}</p>;
}
