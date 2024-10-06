import { Button } from './components/ui/button';

function App() {
	return (
		<main className='dark p-5 bg-background'>
			<div className='bg-card p-3'>
				<h1 className='text-red-500'>Hello World!</h1>
				<Button size='sm'>Click Me!</Button>
			</div>
		</main>
	);
}

export default App;
