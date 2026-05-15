# Native Shell Architecture

qbitview is currently a Tauri app. The target architecture for a native-feel macOS + Windows app is a native host shell that owns platform behavior and a shared WebView renderer that owns product UI.

This follows T1, place the boundary at the rendering surface:

- Below the WebView: write platform-native code.
- Above the WebView: keep shared React and TypeScript.

## Target Layers

### Layer 1: Native Host Shell

macOS uses Swift + AppKit. Windows uses C# + WPF or WinUI 3.

The shell owns:

- Window lifecycle, restoration, focus, sizing, and title bar behavior.
- macOS menu bar, Windows system menu, tray or menu bar item.
- Native shortcuts, app close behavior, Dock or Taskbar activation.
- Native open/save panels, file-drop handling, URL schemes, file associations.
- Native notifications, updater, crash reporting, and platform materials.
- WebView creation, configuration, and process supervision.

The shell must not own product UI that can stay shared in React.

### Layer 2: Shared WebView UI

The current `src/` React app becomes the shared WebView layer. It should stay unaware of whether the host is Tauri, AppKit, or WinUI.

The WebView may own:

- Torrent list, drawer, settings form, command palette, and visual components.
- View state, filtering, formatting, keyboard navigation inside the content surface.

The WebView must not own:

- App quit/hide policy.
- Window restoration.
- Native notifications.
- File system picker UX.
- Platform material effects.

### Layer 3: Backend

The current qBittorrent bridge in `src-tauri/src/lib.rs` should move behind the host IPC contract. It can remain Rust during migration, or become a long-lived Node backend if qbitview later needs plugins, extensions, or richer shared TypeScript business logic.

Current backend-owned domains:

- `qbit-session`
- `torrent-data`
- `torrent-mutation`
- `preferences`
- most of `transfer-monitor`

### Layer 4: Rust Core

Keep Rust for work that benefits from one cross-platform implementation:

- qBittorrent API bridge if it remains stable and independent.
- File parsing or transfer metadata processing.
- Future CPU-heavy indexing or search.

Do not add Rust only as ceremony. If a subsystem is small and host-specific, keep it in the native shell.

## Migration Order

1. Stabilize the Host IPC contract in `src/native/host-contract.ts`.
2. Move direct `@tauri-apps/api` usage behind a small host client module.
3. Split app-shell commands from qBittorrent backend commands.
4. Build the macOS AppKit shell that can load the Vite/WebView bundle and answer app-shell commands.
5. Move backend commands behind a process or library boundary.
6. Build the Windows shell against the same IPC contract.
7. Retire Tauri once both shells pass feature parity.

## Non-Goals

- Do not rewrite the React UI in Swift and C#.
- Do not hide native shell behavior behind a broad cross-platform abstraction.
- Do not add Node until there is a real plugin, extension, or long-lived business logic need.
