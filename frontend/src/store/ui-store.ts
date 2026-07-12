import { create } from "zustand";

interface UiState {
  sidebarOpen: boolean;
  globalSearch: string;
  setSidebarOpen: (open: boolean) => void;
  setGlobalSearch: (search: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  globalSearch: "",
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setGlobalSearch: (globalSearch) => set({ globalSearch })
}));
