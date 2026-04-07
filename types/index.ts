export interface XCloudGame {
  id: string;
  name: string;
  imageUrl: string;
  launchUrl: string;
}

export interface SteamGridArt {
  grid?: string;
  hero?: string;
  logo?: string;
  icon?: string;
}

export interface SelectedGame extends XCloudGame {
  steamGridArt?: SteamGridArt;
}

export interface AppSettings {
  chromePath: string;
  steamGridDbApiKey: string;
  steamUserId: string;
  steamPath: string;
}

export interface SteamUser {
  id: string;
  persona: string;
}

export interface SteamConfig {
  steamPath: string;
  users: SteamUser[];
}

export interface GameResult {
  name: string;
  success: boolean;
  error?: string;
}

export interface AddToSteamResult {
  totalGames: number;
  successCount: number;
  failCount: number;
  results: GameResult[];
}

export interface SteamGridDBSearchResult {
  id: number;
  name: string;
  types: string[];
  verified: boolean;
}

export interface SteamGridDBImage {
  id: number;
  url: string;
  thumb: string;
  style: string;
  width: number;
  height: number;
}
