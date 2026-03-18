import type { FilterKey, Torrent } from "@/pages/main/types";

export type SettingsTargetId =
  | "savePath"
  | "tempPath"
  | "listenPort"
  | "downloadLimit"
  | "uploadLimit"
  | "maxActiveDownloads"
  | "maxConnections"
  | "encryption"
  | "maxRatio"
  | "maxSeedingTime";

export type CommandPaletteItem =
  | {
      id: string;
      type: "torrent";
      title: string;
      subtitle: string;
      hash: string;
    }
  | {
      id: string;
      type: "filter";
      title: string;
      subtitle: string;
      filter: FilterKey;
    }
  | {
      id: string;
      type: "setting";
      title: string;
      subtitle: string;
      target: SettingsTargetId;
    };

export interface CommandPaletteContext {
  torrents: Torrent[];
  filters: Array<{ key: FilterKey; label: string }>;
  settings: Array<{ id: SettingsTargetId; title: string; subtitle: string }>;
  currentPath?: string;
}
