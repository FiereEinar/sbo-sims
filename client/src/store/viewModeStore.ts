import { create } from 'zustand';

export type ViewMode = 'table' | 'cards';

interface ViewModeState {
	viewMode: ViewMode;
	setViewMode: (mode: ViewMode) => void;
	toggleMode: () => void;
}

export const useViewModeStore = create<ViewModeState>((set) => ({
	viewMode: 'table', // default
	setViewMode: (viewMode) => set(() => ({ viewMode })),
	toggleMode: () =>
		set((state) => ({
			viewMode: state.viewMode === 'table' ? 'cards' : 'table',
		})),
}));
