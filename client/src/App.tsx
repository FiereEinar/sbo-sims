import { Outlet } from 'react-router-dom';
import LeftSidebar from './components/LeftSidebar';

function App() {
	return (
		<main className='transition-all bg-background flex h-dvh'>
			<LeftSidebar />
			<div className='px-5 overflow-y-auto'>
				<Outlet />
			</div>
		</main>
	);
}

export default App;
