import { useState } from 'react';
import { DarkModeSwitch } from 'react-toggle-dark-mode';

export default function DarkModeToggle({
	text,
}: {
	text?: string | undefined;
}) {
	const [isDarkMode, setDarkMode] = useState(
		localStorage.getItem('theme') === 'dark'
	);

	const toggleDarkMode = () => {
		const newMode = !isDarkMode;
		setDarkMode(newMode);
		if (newMode) {
			document.documentElement.classList.add('dark');
			localStorage.setItem('theme', 'dark');
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.setItem('theme', 'light');
		}
	};

	return (
		<button
			className='flex items-center justify-start sm:justify-center md:justify-start gap-2'
			onClick={toggleDarkMode}
		>
			<DarkModeSwitch
				sunColor='#64748b'
				moonColor='#64748b'
				checked={isDarkMode}
				onChange={toggleDarkMode}
				size={20}
			/>
			{text && <p className='flex sm:hidden md:flex'>{text}</p>}
		</button>
	);
}
