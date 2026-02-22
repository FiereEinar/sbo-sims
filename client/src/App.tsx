import { Outlet, useNavigate } from 'react-router-dom';
import LeftSidebar from './components/LeftSidebar';
import TopNavbar from './components/TopNavbar';
import { setNavigate } from './lib/navigate';
import { usePefetchValues } from './hooks/usePrefetchValues';
import { useEffect } from 'react';
import { useViewModeStore } from './store/viewModeStore';
import { useMediaQuery } from './hooks/useMediaQuery';

function App() {
	const isMobile = useMediaQuery('(max-width: 768px)');
	const { setViewMode } = useViewModeStore();
	const navigate = useNavigate();
	setNavigate(navigate);

	usePefetchValues();

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
				<div className='flex sm:hidden '>
					<TopNavbar />
				</div>
				<Outlet />
			</div>
		</main>
	);
}

export default App;
