import { Outlet, useNavigate } from 'react-router-dom';
import LeftSidebar from './components/LeftSidebar';
import TopNavbar from './components/TopNavbar';
import { setNavigate } from './lib/navigate';
import { useEffect } from 'react';
import { useViewModeStore } from './store/viewModeStore';
import { useThemeStore } from './store/themeStore';
import { useMediaQuery } from './hooks/useMediaQuery';

function App() {
	const isMobile = useMediaQuery('(max-width: 768px)');
	const { setViewMode } = useViewModeStore();
	const { primaryColor } = useThemeStore();
	const navigate = useNavigate();
	setNavigate(navigate);

	useEffect(() => {
		if (primaryColor) {
			document.documentElement.style.setProperty('--primary', primaryColor);
		} else {
			document.documentElement.style.removeProperty('--primary');
		}
	}, [primaryColor]);

	// usePefetchValues();

	useEffect(() => {
		if (isMobile) {
			setViewMode('cards');
		} else {
			setViewMode('table');
		}
	}, [isMobile]);

	return (
		<main className='transition-all bg-background flex h-dvh'>
			<div className='hidden sm:flex'>
				<LeftSidebar />
			</div>
			<div className='overflow-hidden w-full'>
				<div className='flex w-full'>
					<TopNavbar />
				</div>
				<Outlet />
			</div>
		</main>
	);
}

export default App;
