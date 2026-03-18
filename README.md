# qbitview

[中文说明](./README_CN.md)

![screenshot](https://github.com/Fatpandac/qbitview/blob/main/assets/screenshot.png?raw=true)

qbitview is a desktop client for qBittorrent built with Tauri, React, and TypeScript. It focuses on a fast local UI for browsing torrents, managing transfers, inspecting torrent details, and jumping through app commands without leaving the keyboard.

## Features

- View and refresh the full torrent list with status-based filters
- Open a detail drawer for each torrent to inspect:
  - basic metadata and transfer stats
  - trackers
  - peers
  - web seeds
  - file content tree with progress
- Add torrents from URLs, `.torrent` files, or drag and drop
- Download the original `.torrent` file from the context menu
- Pause, resume, reannounce, recheck, and delete torrents
- Adjust global speed limits and other qBittorrent preferences from the Settings page
- Configure BitTorrent-related options including:
  - default save path
  - temporary path
  - listen port
  - global download and upload limits
  - queue limits
  - connection limits
  - encryption mode
  - seeding stop conditions such as ratio and seeding time
- Use the command palette with fuzzy search to:
  - find torrents
  - jump to filters
  - open specific settings sections
- Keyboard shortcuts for common navigation:
  - `Cmd+,` opens Settings
  - `Cmd+K` opens the command palette
  - `Esc` closes dialogs and the torrent drawer where supported

## Tech Stack

- [Tauri](https://tauri.app/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)

## Getting Started

### Requirements

- Node.js
- pnpm or npm
- Rust toolchain
- Tauri development prerequisites for your platform
- A reachable qBittorrent Web UI endpoint

### Install

```bash
pnpm install
```

If you use npm instead:

```bash
npm install
```

### Run in development

```bash
pnpm tauri:dev
```

Or with npm:

```bash
npm run tauri:dev
```

### Run tests

```bash
pnpm test
```

Or:

```bash
npm test
```

### Build

```bash
pnpm tauri build
```

Or:

```bash
npm run tauri build
```

## Project Structure

```text
src/
  components/       Shared UI and command palette
  pages/main/       Torrent list, drawer, toolbar, status bar, modals
  pages/setting/    qBittorrent settings page
  sotres/           Zustand stores
src-tauri/
  src/lib.rs        Tauri commands and qBittorrent bridge
```

## Notes

- qbitview talks to qBittorrent through the Web API.
- Settings are backed by qBittorrent preferences, so changes apply to the connected server.
- The app is designed around a desktop workflow and supports mouse and keyboard navigation together.
