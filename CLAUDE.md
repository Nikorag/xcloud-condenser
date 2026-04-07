# CLAUDE.md

## IMPORTANT: Keep Documentation Updated

After every change, update both `README.md` and `CLAUDE.md` to reflect the current state of the project. This includes new files, changed architecture, new features, modified commands, and updated data flows. These files are the source of truth for the project.

## Project Overview

XCloud Condenser is a Tauri v2 desktop app that adds Xbox Cloud Gaming titles and streaming services to Steam with artwork from SteamGridDB. It targets macOS and Linux (Steam Deck).

## Architecture

- **Frontend**: Next.js 16 (static export via `output: "export"`) + React 19 + Tailwind CSS 4 + shadcn/ui
- **Backend**: Tauri v2 with Rust commands for all API calls and filesystem operations
- **State**: Zustand with localStorage persistence
- **Package manager**: pnpm

The frontend is a static site served by Tauri's webview. All HTTP requests (Xbox catalog, SteamGridDB) and filesystem operations (writing shortcuts.vdf, artwork) happen in Rust via `invoke()` from `@tauri-apps/api/core`.

## Key Commands

```bash
pnpm install              # Install frontend deps
source "$HOME/.cargo/env" # Ensure cargo is in PATH (if needed)
pnpm tauri:dev            # Dev mode with hot reload
pnpm tauri:build          # Production build (.dmg on macOS, .AppImage on Linux)
pnpm build                # Next.js static export only (outputs to out/)
cargo build               # Rust backend only (run from src-tauri/)
cargo check               # Quick Rust type check (run from src-tauri/)
```

## Project Structure

```
app/
  page.tsx                  Main page with tabs (XCloud Games / Streaming)
  layout.tsx                Root layout with metadata
components/
  game-browser.tsx          XCloud game catalog grid with search + incremental rendering
  game-card.tsx             Memoized game card with lazy loading
  streaming-service-browser.tsx  Streaming services grid with SteamGridDB artwork lookup
  add-service-dialog.tsx    Multi-step dialog: add custom service with artwork from SteamGridDB
  selected-games-panel.tsx  Right sidebar with selection + "Add to Steam" button
  export-dialog.tsx         Steam user picker + progress/results dialog
  artwork-dialog.tsx        SteamGridDB artwork browser per game
  settings-dialog.tsx       Chrome path, Steam path, Steam user ID, backup/restore
  about-dialog.tsx          App info and credits
  ui/                       shadcn/ui primitives (tabs, dialog, button, input, etc.)
lib/
  store.ts                  Zustand store (games, selection, settings, custom services)
  streaming-services.ts     Built-in streaming service definitions with optional steamGridDbId
  utils.ts                  cn() helper
types/
  index.ts                  All TypeScript interfaces
src-tauri/
  src/
    main.rs                 Entry point
    lib.rs                  Tauri command registration (7 commands)
    crc32.rs                CRC32 IEEE + generate_shortcut_id(exe, app_name)
    vdf.rs                  Binary VDF reader/writer for shortcuts.vdf
    commands/
      xcloud_games.rs       Two-step Xbox catalog fetch (sigls → displaycatalog)
      steamgriddb.rs        SteamGridDB search + image fetch
      steam_integration.rs  detect_steam_config, add_games_to_steam, backup/restore
  Cargo.toml                Rust deps: tauri, reqwest, serde, tokio, dirs, urlencoding
  tauri.conf.json           App config, 1200x800 window, bundle targets
public/
  icon.png                  App icon (used in header and about dialog)
  icon.svg                  SVG version of app icon
```

## Tauri Commands (Rust → Frontend IPC)

| Command | Purpose |
|---------|---------|
| `fetch_xcloud_games` | Fetches game IDs from sigls API, then details from displaycatalog API |
| `search_steamgriddb` | Searches SteamGridDB by game name |
| `fetch_steamgriddb_images` | Gets grid/hero/logo/icon artwork for a game by SteamGridDB ID |
| `detect_steam_config` | Finds Steam install path (resolves symlinks) + enumerates user profiles |
| `add_games_to_steam` | Creates shortcuts in shortcuts.vdf, downloads artwork to grid/ |
| `list_shortcuts_backups` | Lists timestamped backups of shortcuts.vdf |
| `restore_shortcuts_backup` | Restores a backup to shortcuts.vdf |

## Data Flow

1. **XCloud tab**: `fetch_xcloud_games` → catalog.gamepass.com/sigls/v2 (get IDs) → displaycatalog.mp.microsoft.com (get details in batches of 20)
2. **Streaming tab**: Built-in services from `streaming-services.ts` + custom services from Zustand store. Artwork fetched from SteamGridDB on tab load (pinned IDs or name search).
3. User selects games/services across either tab, clicks "Add to Steam"
4. `detect_steam_config` → scans Steam/userdata/ for user directories (resolves symlinks via `canonicalize()`), reads persona names from localconfig.vdf
5. `add_games_to_steam` → for each game:
   - **Linux**: Creates shortcut with exe=`/usr/bin/flatpak`, launch options = Flatpak Chrome args + kiosk mode + game URL
   - **Windows/macOS**: Creates shortcut with exe=Chrome path, launch options = `--app` mode + fullscreen flags
   - Backs up existing shortcuts.vdf with timestamp
   - Computes CRC32 shortcut ID, fetches artwork (portrait 600x900 + landscape 920x430 grids, hero, logo, icon)
   - Sets icon path in shortcut entry
   - Writes updated shortcuts.vdf

## Streaming Services

Built-in services are defined in `lib/streaming-services.ts`. Each has:
- `id`, `name`, `url`, `color` (required)
- `steamGridDbId` (optional) — pinned SteamGridDB game ID for accurate artwork lookup

Services with a pinned `steamGridDbId` skip the name search and fetch artwork directly by ID. Others fall back to searching by name.

Custom services are stored in Zustand (persisted to localStorage). Users add them via the "Add Custom" dialog which supports SteamGridDB artwork lookup.

## Steam Artwork Files

Steam uses these filenames in `userdata/{id}/config/grid/`:
- `{shortcutId}p.png` — Portrait grid (600x900)
- `{shortcutId}.png` — Landscape grid (920x430)
- `{shortcutId}_hero.png` — Hero banner
- `{shortcutId}_logo.png` — Logo overlay
- `{shortcutId}_icon.png` — Icon (also set in shortcut's `icon` field)

## Important Details

- SteamGridDB API key is hardcoded: `f80f92019254471cca9d62ff91c21eee` (in `steam_integration.rs`, `store.ts`, `artwork-dialog.tsx`, `streaming-service-browser.tsx`, `add-service-dialog.tsx`)
- No API routes exist — all HTTP goes through Rust (`reqwest`)
- `next.config.mjs` has `output: "export"` and `images.unoptimized: true`
- The `out/` directory is the frontend dist served by Tauri
- Steam VDF format is binary: 0x00=Map, 0x01=String, 0x02=UInt32, 0x08=End
- Shortcut IDs: `crc32(exe + appName) | 0x80000000`
- Steam path detection resolves symlinks via `std::fs::canonicalize()` and expands `~` via `dirs::home_dir()`
- `resolve_path()` helper in `steam_integration.rs` handles `~` expansion + symlink resolution for all path inputs
- Game browser uses incremental rendering (36 cards per batch via IntersectionObserver) for performance on Steam Deck
- GameCard is wrapped in `React.memo` with granular Zustand selectors to minimize re-renders
- Shortcuts.vdf is backed up automatically before each write; backups are timestamped in `xcloud-backups/`

## Performance Optimizations

- **Incremental rendering**: Game browser renders 36 cards initially, loads more on scroll via IntersectionObserver
- **React.memo**: GameCard components only re-render when their selection state changes
- **Granular Zustand selectors**: Each card subscribes to its own selection state, not the full array
- **`loading="lazy"` + `decoding="async"`**: Images decoded off main thread
- **Module-level artwork cache**: Streaming service artwork cached in memory across tab switches
- **Batch artwork fetching**: Streaming services fetch artwork 4 at a time with progressive rendering

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

`.github/workflows/build-appimage.yml`:
- Builds Linux AppImage on ubuntu-22.04 using `tauri-apps/tauri-action`
- Generates SHA256 checksums (`SHA256SUMS.txt`)
- Creates Sigstore build provenance attestation
- Auto-creates GitHub Release with artifacts on `v*` tags
- Permissions: `contents: write`, `id-token: write`, `attestations: write`
