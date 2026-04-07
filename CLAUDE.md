# CLAUDE.md

## Project Overview

XCloud Condenser is a Tauri v2 desktop app that adds Xbox Cloud Gaming titles to Steam with artwork from SteamGridDB. It targets macOS and Linux (Steam Deck).

## Architecture

- **Frontend**: Next.js 16 (static export via `output: "export"`) + React 19 + Tailwind CSS 4 + shadcn/ui
- **Backend**: Tauri v2 with Rust commands for all API calls and filesystem operations
- **State**: Zustand with localStorage persistence
- **Package manager**: pnpm

The frontend is a static site served by Tauri's webview. All HTTP requests (Xbox catalog, SteamGridDB) and filesystem operations (writing shortcuts.vdf, artwork, launcher scripts) happen in Rust via `invoke()` from `@tauri-apps/api/core`.

## Key Commands

```bash
pnpm install              # Install frontend deps
pnpm tauri:dev            # Dev mode (requires: source "$HOME/.cargo/env")
pnpm tauri:build          # Production build (.dmg on macOS, .AppImage on Linux)
pnpm build                # Next.js static export only (outputs to out/)
cargo build               # Rust backend only (run from src-tauri/)
```

## Project Structure

```
app/                        Next.js App Router (single page app)
components/                 React components + shadcn/ui
  game-browser.tsx          Game catalog grid with search
  selected-games-panel.tsx  Right sidebar with selection + "Add to Steam"
  export-dialog.tsx         Steam user picker + progress/results dialog
  artwork-dialog.tsx        SteamGridDB artwork browser
  settings-dialog.tsx       Chrome path, Steam path, Steam user ID
  about-dialog.tsx          App info and credits
  ui/                       shadcn/ui primitives
lib/
  store.ts                  Zustand store (games, selection, settings)
  utils.ts                  cn() helper
types/
  index.ts                  All TypeScript interfaces
src-tauri/
  src/
    main.rs                 Entry point
    lib.rs                  Tauri command registration
    crc32.rs                CRC32 for Steam shortcut IDs
    vdf.rs                  Binary VDF reader/writer for shortcuts.vdf
    commands/
      xcloud_games.rs       Two-step Xbox catalog fetch (sigls → displaycatalog)
      steamgriddb.rs        SteamGridDB search + image fetch
      steam_integration.rs  detect_steam_config + add_games_to_steam
  Cargo.toml                Rust deps: tauri, reqwest, serde, tokio, dirs
  tauri.conf.json           App config, window size, bundle targets
```

## Tauri Commands (Rust → Frontend IPC)

| Command | Purpose |
|---------|---------|
| `fetch_xcloud_games` | Fetches game IDs from sigls API, then details from displaycatalog API |
| `search_steamgriddb` | Searches SteamGridDB by game name |
| `fetch_steamgriddb_images` | Gets grid/hero/logo/icon artwork for a game |
| `detect_steam_config` | Finds Steam install path + enumerates user profiles |
| `add_games_to_steam` | Writes launcher scripts, shortcuts.vdf, and downloads artwork |

## Data Flow

1. `fetch_xcloud_games` → catalog.gamepass.com/sigls/v2 (get IDs) → displaycatalog.mp.microsoft.com (get details in batches of 20)
2. User selects games, clicks "Add to Steam"
3. `detect_steam_config` → scans Steam/userdata/ for user directories, reads persona names from localconfig.vdf
4. `add_games_to_steam` → for each game:
   - Generates .sh or .bat launcher (OS-detected via `std::env::consts::OS`)
   - Writes to `Steam/userdata/{id}/config/xcloud-launchers/`
   - Computes CRC32 shortcut ID, creates VDF entry
   - Searches SteamGridDB, downloads artwork to `Steam/userdata/{id}/config/grid/`
   - Writes updated shortcuts.vdf

## Important Details

- SteamGridDB API key is hardcoded in `steam_integration.rs` and `store.ts`
- No API routes exist — all HTTP goes through Rust (`reqwest`)
- `next.config.mjs` has `output: "export"` and `images.unoptimized: true`
- The `out/` directory is the frontend dist served by Tauri
- Steam VDF format is binary: 0x00=Map, 0x01=String, 0x02=UInt32, 0x08=End
- Shortcut IDs: `crc32(exe + appName) | 0x80000000`

## Testing Without Steam

Create a mock Steam directory:
```bash
mkdir -p test-steam/userdata/12345678/config/grid
```
Add a fake localconfig.vdf:
```
"UserLocalConfigStore" { "friends" { "PersonaName" "TestPlayer" } }
```
Set the Steam path in Settings to point at `test-steam/`.

## CI

`.github/workflows/build-appimage.yml` builds the Linux AppImage on ubuntu-22.04 using `tauri-apps/tauri-action`.
