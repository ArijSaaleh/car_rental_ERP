import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
    theme: 'light' | 'dark' | 'system';
    language: 'fr' | 'ar' | 'en';
    sidebarOpen: boolean;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    setLanguage: (language: 'fr' | 'ar' | 'en') => void;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            theme: 'system',
            language: 'fr',
            sidebarOpen: true,

            setTheme: (theme) => set({ theme }),
            setLanguage: (language) => set({ language }),
            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
            setSidebarOpen: (open) => set({ sidebarOpen: open }),
        }),
        {
            name: 'app-storage',
        }
    )
);
