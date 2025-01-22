import Header from '@/components/ui/header';

type AuthPageProps = {
	form: JSX.Element;
	title: string;
};

export default function AuthPage({ form, title }: AuthPageProps) {
	return (
		<main className='transition-all overflow-hidden bg-background relative h-dvh flex gap-16 justify-center items-center p-3 sm:p-5'>
			<div className='absolute bg-card w-[35rem] sm:w-[50rem] md:w-[55rem] h-[100rem] rotate-[135deg] shadow-2xl shadow-card' />

			<div className='relative flex flex-col gap-8 w-[95%] sm:w-[400px] z-50'>
				<div className='absolute top-[-5rem] flex items-center gap-2'>
					<img
						src='/images/SBO_LOGO.jpg'
						className='size-10 rounded-full'
						alt=''
					/>
					<Header size='sm'>SBO - SIMS</Header>
				</div>
				<Header>{title}</Header>
				{form}
			</div>
			<img
				src='/images/BUKSU_LOGO_WHITE.png'
				className='hidden sm:flex size-[15rem] md:size-[20rem] z-50'
				alt='BUKSU LOGO'
			/>
			{/* <Stripes /> */}
		</main>
	);
}
