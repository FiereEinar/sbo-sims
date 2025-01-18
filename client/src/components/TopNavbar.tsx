import TopNavbarSheet from './TopNavbarSheet';

export default function TopNavbar() {
	return (
		<div className='w-full sticky top-0 z-50 bg- p-3 border-b'>
			<div className='flex justify-between items-center gap-5'>
				<img
					className='size-14 rounded-full border'
					src='/images/SBO_LOGO.jpg'
					alt=''
				/>
				<TopNavbarSheet />
			</div>
		</div>
	);
}
