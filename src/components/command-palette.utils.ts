import { Fzf } from "fzf";
import type { FilterKey } from "@/pages/main/types";
import type { CommandPaletteContext, CommandPaletteItem, SettingsTargetId } from "./command-palette.types";
import { getLanguage, i18n } from "@/lib/language";

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

const SETTING_TARGET_IDS: SettingsTargetId[] = [
  "theme",
  "closeAction",
  "savePath",
  "tempPath",
  "listenPort",
  "downloadLimit",
  "uploadLimit",
  "maxActiveDownloads",
  "maxConnections",
  "encryption",
  "maxRatio",
  "maxSeedingTime",
];

export function getSettingsCommands(): Array<{ id: SettingsTargetId; title: string; subtitle: string }> {
  const commands = i18n[getLanguage()].settingsCommands;
  return SETTING_TARGET_IDS.map((id) => {
    const [title, subtitle] = commands[id];
    return { id, title, subtitle };
  });
}

export const SETTINGS_COMMANDS = getSettingsCommands();

export function buildCommandPaletteItems(context: CommandPaletteContext, rawQuery: string) {
  const query = normalize(rawQuery);
  const items: CommandPaletteItem[] = [];
  const t = i18n[getLanguage()];

  for (const torrent of context.torrents) {
    const hash = torrent.hash ?? "";
    const name = torrent.name ?? t.unnamedTorrent;
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
      title: t.commandCategoryTitle(filter.label),
      subtitle: t.commandSwitchFilter(filter.label),
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

  const fzf = new Fzf<CommandPaletteItem[]>(items, {
    selector: (item: CommandPaletteItem) => getSearchText(item),
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
  return SETTING_TARGET_IDS.includes(value as SettingsTargetId) ? (value as SettingsTargetId) : null;
}
