import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  commandPaletteOpen: boolean
  setSidebarOpen: (open: boolean) => void
  setCommandPaletteOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  commandPaletteOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
}))
