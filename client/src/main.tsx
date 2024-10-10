import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Route from './Route.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/toaster.tsx';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<Route />
			<Toaster />
		</QueryClientProvider>
	</StrictMode>
);
