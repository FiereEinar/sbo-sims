import { useState } from 'react';
import { DarkModeSwitch } from 'react-toggle-dark-mode';

export default function DarkModeToggle({
	text,
}: {
	text?: string | undefined;
}) {
	const [isDarkMode, setDarkMode] = useState(
		document.querySelector('body')?.classList.contains('dark') || false
	);

	const toggleDarkMode = () => {
		setDarkMode(!isDarkMode);
		document.querySelector('body')?.classList.toggle('dark');
	};

	return (
		<button
			className='flex items-center justify-center md:justify-start gap-2'
			onClick={toggleDarkMode}
		>
			<DarkModeSwitch
				sunColor='#64748b'
				moonColor='#64748b'
				checked={isDarkMode}
				onChange={toggleDarkMode}
				size={20}
			/>
			<p className='hidden md:flex'>{text}</p>
		</button>
	);
}
