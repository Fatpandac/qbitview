import { Fzf } from "fzf";
import type { FilterKey } from "@/pages/main/types";
import type { CommandPaletteContext, CommandPaletteItem, SettingsTargetId } from "./command-palette.types";

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function getSearchText(item: CommandPaletteItem) {
  switch (item.type) {
    case "torrent":
      return `${item.title} ${item.subtitle}`;
    case "filter":
      return `${item.title} ${item.subtitle} ${item.filter}`;
    case "setting":
      return `${item.title} ${item.subtitle} ${item.target}`;
  }
}

function getTypePriority(currentPath: string | undefined, item: CommandPaletteItem) {
  if (currentPath === "/setting") {
    if (item.type === "setting") return 0;
    if (item.type === "torrent") return 1;
    return 2;
  }

  if (item.type === "torrent") return 0;
  if (item.type === "filter") return 1;
  return 2;
}

export const SETTINGS_COMMANDS: Array<{ id: SettingsTargetId; title: string; subtitle: string }> = [
  { id: "savePath", title: "Settings: Save path", subtitle: "Jump to the default download location" },
  { id: "tempPath", title: "Settings: Temporary path", subtitle: "Jump to incomplete download storage" },
  { id: "listenPort", title: "Settings: Listen port", subtitle: "Jump to the incoming connection port" },
  { id: "downloadLimit", title: "Settings: Download limit", subtitle: "Jump to the global download rate limit" },
  { id: "uploadLimit", title: "Settings: Upload limit", subtitle: "Jump to the global upload rate limit" },
  { id: "maxActiveDownloads", title: "Settings: Max active downloads", subtitle: "Jump to queue limits" },
  { id: "maxConnections", title: "Settings: Max connections", subtitle: "Jump to connection limits" },
  { id: "encryption", title: "Settings: Encryption mode", subtitle: "Jump to BitTorrent protocol privacy" },
  { id: "maxRatio", title: "Settings: Maximum ratio", subtitle: "Jump to seeding stop conditions" },
  { id: "maxSeedingTime", title: "Settings: Seeding time", subtitle: "Jump to the seeding time limit" },
];

export function buildCommandPaletteItems(context: CommandPaletteContext, rawQuery: string) {
  const query = normalize(rawQuery);
  const items: CommandPaletteItem[] = [];

  for (const torrent of context.torrents) {
    const hash = torrent.hash ?? "";
    const name = torrent.name ?? "Unnamed torrent";
    if (!hash) continue;
    items.push({
      id: `torrent:${hash}`,
      type: "torrent",
      title: name,
      subtitle: [hash, torrent.category, torrent.state].filter(Boolean).join(" · "),
      hash,
    });
  }

  for (const filter of context.filters) {
    items.push({
      id: `filter:${filter.key}`,
      type: "filter",
      title: `Category: ${filter.label}`,
      subtitle: `Switch to the ${filter.label.toLowerCase()} list`,
      filter: filter.key,
    });
  }

  for (const setting of context.settings) {
    items.push({
      id: `setting:${setting.id}`,
      type: "setting",
      title: setting.title,
      subtitle: setting.subtitle,
      target: setting.id,
    });
  }

  if (!query) return items;

  const fzf = new Fzf(items, {
    selector: (item) => getSearchText(item),
    casing: "case-insensitive",
  });

  return fzf
    .find(query)
    .sort((a, b) => {
      const priorityDiff =
        getTypePriority(context.currentPath, a.item) -
        getTypePriority(context.currentPath, b.item);
      if (priorityDiff !== 0) return priorityDiff;
      return b.score - a.score;
    })
    .map((entry) => entry.item);
}

export function getCommandHref(item: CommandPaletteItem) {
  switch (item.type) {
    case "torrent":
      return `/main?torrent=${encodeURIComponent(item.hash)}&filter=${encodeURIComponent("all")}`;
    case "filter":
      return `/main?filter=${encodeURIComponent(item.filter)}`;
    case "setting":
      return `/setting?target=${encodeURIComponent(item.target)}`;
  }
}

export function parseFilterFromSearch(search: string): FilterKey | null {
  const value = new URLSearchParams(search).get("filter");
  if (!value) return null;
  const filters: FilterKey[] = ["all", "downloading", "completed", "paused", "active", "inactive", "stalled", "errored"];
  return filters.includes(value as FilterKey) ? (value as FilterKey) : null;
}

export function parseTorrentFromSearch(search: string) {
  return new URLSearchParams(search).get("torrent");
}

export function parseSettingsTargetFromSearch(search: string) {
  const value = new URLSearchParams(search).get("target");
  if (!value) return null;
  return SETTINGS_COMMANDS.some((entry) => entry.id === value) ? (value as SettingsTargetId) : null;
}
