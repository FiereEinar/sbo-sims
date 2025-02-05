import { Outlet, useNavigate } from 'react-router-dom';
import LeftSidebar from './components/LeftSidebar';
import TopNavbar from './components/TopNavbar';
import { setNavigate } from './lib/navigate';
import { usePefetchValues } from './hooks/usePrefetchValues';

function App() {
	const navigate = useNavigate();
	setNavigate(navigate);

	usePefetchValues();

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
