import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  primaryColor: string | null; // HSL value like "221.2 83.2% 53.3%" or null to use default
  setPrimaryColor: (color: string | null) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      primaryColor: null,
      setPrimaryColor: (color) => set({ primaryColor: color }),
    }),
    {
      name: 'theme-storage',
    }
  )
);
