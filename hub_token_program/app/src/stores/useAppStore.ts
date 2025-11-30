import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // Theme
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Network
  network: 'devnet' | 'mainnet-beta' | 'localnet';
  setNetwork: (network: 'devnet' | 'mainnet-beta' | 'localnet') => void;

  // UI State
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Theme
      isDarkMode: true,
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      // Network
      network: 'devnet',
      setNetwork: (network) => set({ network }),

      // UI State
      isSidebarOpen: false,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    }),
    {
      name: 'hub-token-app',
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        network: state.network,
      }),
    }
  )
);
