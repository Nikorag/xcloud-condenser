import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { XCloudGame, SelectedGame, AppSettings, SteamGridArt } from "@/types";

interface AppState {
  // Game catalog
  games: XCloudGame[];
  gamesLoading: boolean;
  gamesError: string | null;
  gamesLastFetched: number | null;
  setGames: (games: XCloudGame[]) => void;
  setGamesLoading: (loading: boolean) => void;
  setGamesError: (error: string | null) => void;

  // Selected games
  selectedGames: SelectedGame[];
  toggleGameSelection: (game: XCloudGame) => void;
  removeSelectedGame: (gameId: string) => void;
  clearSelectedGames: () => void;
  updateGameArt: (gameId: string, art: SteamGridArt) => void;

  // Search and filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // UI state
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  exportDialogOpen: boolean;
  setExportDialogOpen: (open: boolean) => void;
}

function getDefaultChromePath(): string {
  if (typeof window !== "undefined") {
    const platform = navigator.platform.toLowerCase();
    if (platform.includes("win")) {
      return "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
    } else if (platform.includes("mac")) {
      return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    }
  }
  return "/usr/bin/google-chrome";
}

function getDefaultSteamPath(): string {
  if (typeof window !== "undefined") {
    const platform = navigator.platform.toLowerCase();
    if (platform.includes("win")) {
      return "C:\\Program Files (x86)\\Steam";
    } else if (platform.includes("mac")) {
      return "~/Library/Application Support/Steam";
    }
  }
  return "~/.local/share/Steam";
}

const defaultSettings: AppSettings = {
  chromePath: getDefaultChromePath(),
  steamGridDbApiKey: "f80f92019254471cca9d62ff91c21eee",
  steamUserId: "",
  steamPath: getDefaultSteamPath(),
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Game catalog
      games: [],
      gamesLoading: false,
      gamesError: null,
      gamesLastFetched: null,
      setGames: (games) =>
        set({ games, gamesLastFetched: Date.now(), gamesError: null }),
      setGamesLoading: (loading) => set({ gamesLoading: loading }),
      setGamesError: (error) => set({ gamesError: error }),

      // Selected games
      selectedGames: [],
      toggleGameSelection: (game) => {
        const { selectedGames } = get();
        const exists = selectedGames.find((g) => g.id === game.id);
        if (exists) {
          set({ selectedGames: selectedGames.filter((g) => g.id !== game.id) });
        } else {
          set({ selectedGames: [...selectedGames, { ...game }] });
        }
      },
      removeSelectedGame: (gameId) => {
        set({
          selectedGames: get().selectedGames.filter((g) => g.id !== gameId),
        });
      },
      clearSelectedGames: () => set({ selectedGames: [] }),
      updateGameArt: (gameId, art) => {
        set({
          selectedGames: get().selectedGames.map((g) =>
            g.id === gameId ? { ...g, steamGridArt: { ...g.steamGridArt, ...art } } : g
          ),
        });
      },

      // Search and filters
      searchQuery: "",
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Settings
      settings: defaultSettings,
      updateSettings: (newSettings) =>
        set({ settings: { ...get().settings, ...newSettings } }),

      // UI state
      settingsOpen: false,
      setSettingsOpen: (open) => set({ settingsOpen: open }),
      exportDialogOpen: false,
      setExportDialogOpen: (open) => set({ exportDialogOpen: open }),
    }),
    {
      name: "xcloud-condenser-storage",
      partialize: (state) => ({
        selectedGames: state.selectedGames,
        settings: state.settings,
        games: state.games,
        gamesLastFetched: state.gamesLastFetched,
      }),
    }
  )
);
