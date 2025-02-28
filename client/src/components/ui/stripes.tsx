export default function Stripes() {
	return (
		<>
			{/* top right */}
			<div className='absolute top-[4rem] right-[1rem] bg-custom-gradient-1 size-[12rem] rotate-[135deg]' />
			{/* bottom left */}
			<div className='absolute bottom-[1rem] left-[30rem] bg-custom-gradient-2 size-[10rem] rotate-[135deg]' />
			{/* top center */}
			<div className='absolute top-[1rem] left-[45%] bg-custom-gradient-2 size-[8rem] rotate-[135deg]' />
			{/* top left */}
			<div className='absolute top-[4rem] left-[3rem] bg-custom-gradient-2 size-[10rem] rotate-[135deg]' />
		</>
	);
}
