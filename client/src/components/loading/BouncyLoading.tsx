import Header from '../ui/header';
import { bouncy } from 'ldrs';
bouncy.register();

type BouncyLoadingProps = {
	text?: string;
};

export default function BouncyLoading({ text }: BouncyLoadingProps) {
	return (
		<div
			className={`h-[20rem] w-full flex flex-col gap-2 justify-center items-center`}
		>
			<l-bouncy size='45' speed='1.75' color='#737373'></l-bouncy>
			<Header className='text-muted-foreground' size='md'>
				{text ? text : 'Loading Contents'}
			</Header>
		</div>
	);
}
