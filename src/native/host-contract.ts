export type HostCommandDomain =
  | "app-shell"
  | "file-system"
  | "preferences"
  | "qbit-session"
  | "torrent-data"
  | "torrent-mutation"
  | "transfer-monitor";

export interface HostCommandDefinition {
  name: string;
  domain: HostCommandDomain;
  owner: "native-shell" | "backend";
}

export const HOST_COMMANDS = [
  { name: "login", domain: "qbit-session", owner: "backend" },
  { name: "get_version", domain: "qbit-session", owner: "backend" },

  { name: "get_torrents", domain: "torrent-data", owner: "backend" },
  { name: "get_torrent_properties", domain: "torrent-data", owner: "backend" },
  { name: "get_torrent_pieces_states", domain: "torrent-data", owner: "backend" },
  { name: "get_torrent_trackers", domain: "torrent-data", owner: "backend" },
  { name: "get_torrent_peers", domain: "torrent-data", owner: "backend" },
  { name: "get_torrent_web_seeds", domain: "torrent-data", owner: "backend" },
  { name: "get_torrent_contents", domain: "torrent-data", owner: "backend" },
  { name: "export_torrent", domain: "torrent-data", owner: "backend" },

  { name: "add_torrent_urls", domain: "torrent-mutation", owner: "backend" },
  { name: "add_torrent_file", domain: "torrent-mutation", owner: "backend" },
  { name: "stop_torrents", domain: "torrent-mutation", owner: "backend" },
  { name: "start_torrents", domain: "torrent-mutation", owner: "backend" },
  { name: "delete_torrents", domain: "torrent-mutation", owner: "backend" },
  { name: "recheck_torrents", domain: "torrent-mutation", owner: "backend" },
  { name: "reannounce_torrents", domain: "torrent-mutation", owner: "backend" },
  { name: "set_torrent_download_limit", domain: "torrent-mutation", owner: "backend" },
  { name: "set_torrent_upload_limit", domain: "torrent-mutation", owner: "backend" },

  { name: "get_transfer_info", domain: "transfer-monitor", owner: "backend" },
  { name: "get_global_speed_limits", domain: "transfer-monitor", owner: "backend" },
  { name: "update_transfer_monitor_title", domain: "transfer-monitor", owner: "native-shell" },

  { name: "get_preferences", domain: "preferences", owner: "backend" },
  { name: "set_preferences", domain: "preferences", owner: "backend" },

  { name: "read_file", domain: "file-system", owner: "native-shell" },
  { name: "exit_app", domain: "app-shell", owner: "native-shell" },
  { name: "hide_main_window", domain: "app-shell", owner: "native-shell" },
] as const satisfies readonly HostCommandDefinition[];

export const HOST_COMMAND_NAMES = HOST_COMMANDS.map((command) => command.name);

export type HostCommandName = (typeof HOST_COMMAND_NAMES)[number];
