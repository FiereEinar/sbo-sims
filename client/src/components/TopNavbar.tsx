import TopNavbarSheet from './TopNavbarSheet';
import Header from './ui/header';

export default function TopNavbar() {
	return (
		<div className='w-full sticky top-0 z-50 bg- p-3 border-b'>
			<div className='flex justify-between items-center gap-5'>
				<div className='flex gap-3 items-center'>
					<img
						className='size-12 rounded-full border'
						src='/images/SBO_LOGO.jpg'
						alt=''
					/>
					<Header>SIMS</Header>
				</div>
				<TopNavbarSheet />
			</div>
		</div>
	);
}
