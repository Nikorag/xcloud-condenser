# XCloud Condenser

A desktop app that adds Xbox Cloud Gaming titles and streaming services to your Steam library with custom artwork. Works on macOS, Linux, and Steam Deck.

## What It Does

1. Fetches the full Xbox Game Pass cloud gaming catalog
2. Includes 15+ built-in streaming services (Netflix, Disney+, Prime Video, etc.) with artwork from SteamGridDB
3. Lets you add custom services with URL, color, and SteamGridDB artwork lookup
4. Lets you pick which games and services to add to Steam
5. Creates Steam shortcuts that launch directly in Chrome/Flatpak Chrome — no intermediate scripts
6. Downloads matching artwork (portrait grid, landscape grid, hero, logo, icon) from SteamGridDB
7. Writes everything directly into Steam's config files — just restart Steam and your games appear with full artwork

## Screenshots

*Coming soon*

## Installation

### Pre-built Binaries

Download the latest release from the [Releases](https://github.com/Nikorag/xcloud-condenser/releases) page:

- **macOS**: `.dmg`
- **Linux / Steam Deck**: `.AppImage`

### Verifying Your Download

Each release includes SHA256 checksums and a build provenance attestation so you can verify the binary hasn't been tampered with.

**Checksum verification:**
```bash
sha256sum -c SHA256SUMS.txt
```

**Provenance verification** (requires [GitHub CLI](https://cli.github.com/)):
```bash
gh attestation verify xcloud-condenser*.AppImage --repo Nikorag/xcloud-condenser
```

This cryptographically proves the binary was built in GitHub Actions from the source code in this repository.

### Steam Deck

1. Download the `.AppImage` from Releases
2. Make it executable: `chmod +x XCloud-Condenser_*.AppImage`
3. Run it in Desktop Mode
4. Select your games, click "Add to Steam", pick your profile
5. Restart Steam — your XCloud games are in the library

## Building From Source

### Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/)
- Platform-specific dependencies (see below)

#### Linux

```bash
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  librsvg2-dev \
  patchelf \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev
```

#### macOS

Xcode Command Line Tools:
```bash
xcode-select --install
```

### Build

```bash
git clone https://github.com/Nikorag/xcloud-condenser.git
cd xcloud-condenser
pnpm install
pnpm tauri:build
```

The built app will be in `src-tauri/target/release/bundle/`.

### Development

```bash
pnpm install
source "$HOME/.cargo/env"  # if cargo is not in PATH
pnpm tauri:dev
```

This starts the Next.js dev server with hot reload and launches the Tauri window.

## How It Works

### Tabs

The app has two tabs:

- **XCloud Games** — Browse and select from the full Xbox Game Pass cloud gaming catalog
- **Streaming** — Built-in streaming services (Netflix, Disney+, Prime Video, YouTube, etc.) plus custom user-added services. Artwork is fetched automatically from SteamGridDB.

### Game Catalog

The app fetches the Xbox Game Pass cloud gaming catalog in two steps:

1. **Game IDs** from `catalog.gamepass.com/sigls/v2`
2. **Game details** (title, images) from `displaycatalog.mp.microsoft.com/v7.0/products` in batches of 20

### Streaming Services

Built-in services have optional pinned SteamGridDB IDs for accurate artwork lookup. Services without a pinned ID fall back to a name search. Users can add custom services with a name, URL, and color — artwork is looked up from SteamGridDB during creation.

### Adding to Steam

When you click "Add to Steam":

1. **Detects your Steam installation** and user profiles automatically (resolves symlinks, e.g. `~/.steam/steam` → real path)
2. **Creates Steam shortcuts** that launch Chrome directly with the game/service URL — no intermediate launcher scripts:
   - **Linux / Steam Deck**: Uses Flatpak Chrome (`/usr/bin/flatpak run com.google.Chrome`) in kiosk mode with Steam Deck-optimized scaling
   - **Windows / macOS**: Launches the Chrome binary directly with `--app` mode and fullscreen flags
3. **Backs up `shortcuts.vdf`** automatically before making changes (timestamped backups with restore from Settings)
4. **Searches SteamGridDB** for matching artwork and downloads:
   - Portrait grid (600x900) → `{id}p.png`
   - Landscape grid (920x430) → `{id}.png`
   - Hero, logo, and icon images
5. **Sets the icon path** in the shortcut entry so Steam displays it in the library
6. **Writes Steam's `shortcuts.vdf`** with properly generated shortcut IDs (CRC32-based, matching Steam's own algorithm)
7. **Saves artwork** to Steam's `grid/` folder with the correct filenames so Steam picks them up automatically

### Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS, shadcn/ui, Zustand
- **Backend**: Tauri v2, Rust
- **APIs**: Xbox Game Pass Catalog, SteamGridDB

## Configuration

Open Settings (gear icon) to configure:

- **Chrome Path** — Path to your Chrome/Chromium executable (auto-detected)
- **Steam Path** — Steam installation directory (auto-detected)
- **Steam User ID** — Fallback if auto-detection doesn't find your profile
- **Shortcuts Backup** — View and restore timestamped backups of `shortcuts.vdf`

## Credits

- [SteamGridDB](https://www.steamgriddb.com/) for game artwork
- [cpp-steam-tools](https://github.com/Nikorag/cpp-steam-tools) for the original Steam integration logic
- Built with [Tauri](https://tauri.app/), [Next.js](https://nextjs.org/), and [Rust](https://www.rust-lang.org/)

## License

MIT
