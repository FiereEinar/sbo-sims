import { Outlet } from 'react-router-dom';
import LeftSidebar from './components/LeftSidebar';
import TopNavbar from './components/TopNavbar';

function App() {
	return (
		<main className='transition-all bg-background flex h-dvh'>
			<div className='hidden sm:flex'>
				<LeftSidebar />
			</div>
			<div className='overflow-hidden'>
				<div className='flex sm:hidden '>
					<TopNavbar />
				</div>
				<div className='overflow-y-hidden'>
					<Outlet />
				</div>
			</div>
		</main>
	);
}

export default App;
