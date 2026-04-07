# XCloud Condenser

A desktop app that adds Xbox Cloud Gaming titles to your Steam library with custom artwork. Works on macOS, Linux, and Steam Deck.

## What It Does

1. Fetches the full Xbox Game Pass cloud gaming catalog
2. Lets you pick which games to add to Steam
3. Automatically generates launcher scripts that open each game in Chrome's app mode
4. Downloads matching artwork (grid, hero, logo, icon) from SteamGridDB
5. Writes everything directly into Steam's config files — just restart Steam and your games appear with full artwork

## Screenshots

*Coming soon*

## Installation

### Pre-built Binaries

Download the latest release from the [Releases](https://github.com/Nikorag/xcloud-condenser/releases) page:

- **macOS**: `.dmg`
- **Linux / Steam Deck**: `.AppImage`

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
  libappindicator3-dev \
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
pnpm tauri:dev
```

This starts the Next.js dev server with hot reload and launches the Tauri window.

## How It Works

### Game Catalog

The app fetches the Xbox Game Pass cloud gaming catalog in two steps:

1. **Game IDs** from `catalog.gamepass.com/sigls/v2`
2. **Game details** (title, images) from `displaycatalog.mp.microsoft.com/v7.0/products` in batches of 20

### Adding to Steam

When you click "Add to Steam":

1. **Detects your Steam installation** and user profiles automatically
2. **Generates launcher scripts** (`.sh` on Linux/macOS, `.bat` on Windows) that open each game in Chrome's fullscreen app mode pointing at the XCloud URL
3. **Searches SteamGridDB** for matching artwork and downloads grid, hero, logo, and icon images
4. **Writes Steam's `shortcuts.vdf`** with properly generated shortcut IDs (CRC32-based, matching Steam's own algorithm)
5. **Saves artwork** to Steam's `grid/` folder with the correct filenames so Steam picks them up automatically

### Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS, shadcn/ui, Zustand
- **Backend**: Tauri v2, Rust
- **APIs**: Xbox Game Pass Catalog, SteamGridDB

## Configuration

Open Settings (gear icon) to configure:

- **Chrome Path** — Path to your Chrome/Chromium executable (auto-detected)
- **Steam Path** — Steam installation directory (auto-detected)
- **Steam User ID** — Fallback if auto-detection doesn't find your profile

## Credits

- [SteamGridDB](https://www.steamgriddb.com/) for game artwork
- [cpp-steam-tools](https://github.com/Nikorag/cpp-steam-tools) for the original Steam integration logic
- Built with [Tauri](https://tauri.app/), [Next.js](https://nextjs.org/), and [Rust](https://www.rust-lang.org/)

## License

MIT
