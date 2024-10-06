import { Outlet } from 'react-router-dom';
import LeftSidebar from './components/LeftSidebar';

function App() {
	return (
		<main className='transition-all bg-background flex'>
			<LeftSidebar />
			<div className='p-5'>
				<Outlet />
			</div>
		</main>
	);
}

export default App;
