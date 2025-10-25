import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Route from './Route.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/toaster.tsx';

export const queryClient = new QueryClient();
const rootElement = document.getElementById('root') as HTMLElement;

let root = (rootElement as any)._reactRoot ?? createRoot(rootElement);
(rootElement as any)._reactRoot = root;

root.render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<Route />
			<Toaster />
		</QueryClientProvider>
	</StrictMode>
);
