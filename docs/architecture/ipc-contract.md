# Host IPC Contract

The WebView must talk to the host through one declared command contract. Today the implementation is Tauri `invoke`. The contract is deliberately named as host IPC so it can survive the move to AppKit and WinUI.

Source of truth:

- `src/native/host-contract.ts`

Guardrail:

- `src/native/host-contract.test.ts` scans non-test `src/` files for literal `invoke("command")` calls and verifies they are represented in the contract.

## Ownership

Commands owned by `native-shell` should be implemented separately on macOS and Windows:

- `exit_app`
- `hide_main_window`
- `read_file`
- `update_transfer_monitor_title`

Commands owned by `backend` should be implemented once behind the host boundary:

- qBittorrent login/session commands
- torrent reads and mutations
- preferences
- transfer data

## Rule

New WebView-to-host calls must be added to `HOST_COMMANDS` first. If a command is platform behavior, assign it to `native-shell`. If it is product or qBittorrent behavior, assign it to `backend`.

Avoid dynamic command names in UI code. They are harder to audit and generate clients for. Prefer explicit functions such as `setTorrentDownloadLimit` and `setTorrentUploadLimit` in the future host client.
