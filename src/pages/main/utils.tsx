import {
  CircleCheckIcon,
  CirclePauseIcon,
  CirclePlayIcon,
  CircleXIcon,
  DownloadIcon,
  HardDriveIcon,
  NetworkIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { FilterKey } from "./types";

export const FILTERS: { key: FilterKey; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All", icon: <HardDriveIcon className="size-4" /> },
  { key: "downloading", label: "Downloading", icon: <DownloadIcon className="size-4" /> },
  { key: "completed", label: "Completed", icon: <CircleCheckIcon className="size-4" /> },
  { key: "paused", label: "Paused", icon: <CirclePauseIcon className="size-4" /> },
  { key: "active", label: "Active", icon: <CirclePlayIcon className="size-4" /> },
  { key: "inactive", label: "Inactive", icon: <NetworkIcon className="size-4" /> },
  { key: "stalled", label: "Stalled", icon: <TriangleAlertIcon className="size-4" /> },
  { key: "errored", label: "Errored", icon: <CircleXIcon className="size-4" /> },
];

export interface CategoryCount {
  label: string;
  count: number;
}

export function normalizeCategoryLabel(category?: string | null) {
  const normalized = category?.trim();
  return normalized ? normalized : "未分类";
}

export function formatBytes(bytes?: number): string {
  if (bytes == null) return "—";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function formatSpeed(bytesPerSec?: number): string {
  if (!bytesPerSec) return "0 B/s";
  return `${formatBytes(bytesPerSec)}/s`;
}

export function formatEta(eta?: number): string {
  if (eta == null || eta < 0 || eta >= 8640000) return "∞";
  if (eta === 0) return "Done";
  const h = Math.floor(eta / 3600);
  const m = Math.floor((eta % 3600) / 60);
  const s = eta % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function filterTorrents(torrents: import("./types").Torrent[], key: import("./types").FilterKey) {
  if (key === "all") return torrents;
  return torrents.filter((t) => {
    const s = t.state ?? "";
    switch (key) {
      case "downloading": return ["downloading","forcedDL","metaDL"].includes(s);
      case "completed":   return ["pausedUP","stoppedUP","uploading","forcedUP"].includes(s);
      case "paused":      return ["pausedDL","stoppedDL","pausedUP","stoppedUP"].includes(s);
      case "active":      return (t.dlspeed ?? 0) > 0 || (t.upspeed ?? 0) > 0;
      case "inactive":    return (t.dlspeed ?? 0) === 0 && (t.upspeed ?? 0) === 0;
      case "stalled":     return ["stalledDL","stalledUP"].includes(s);
      case "errored":     return ["error","missingFiles"].includes(s);
      default:            return true;
    }
  });
}

export function countByFilter(torrents: import("./types").Torrent[]): Record<import("./types").FilterKey, number> {
  const keys: import("./types").FilterKey[] = ["all","downloading","completed","paused","active","inactive","stalled","errored"];
  return Object.fromEntries(keys.map((k) => [k, filterTorrents(torrents, k).length])) as Record<import("./types").FilterKey, number>;
}

export function countByCategory(torrents: import("./types").Torrent[]): CategoryCount[] {
  const counts = new Map<string, number>();

  torrents.forEach((torrent) => {
    const label = normalizeCategoryLabel(torrent.category);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => {
      if (a.label === "未分类") return 1;
      if (b.label === "未分类") return -1;
      return a.label.localeCompare(b.label);
    });
}

export function filterTorrentsByCategory(
  torrents: import("./types").Torrent[],
  category: string | null,
) {
  if (!category) return torrents;
  return torrents.filter((torrent) => normalizeCategoryLabel(torrent.category) === category);
}

export function getStateLabel(state?: string): { label: string; color: string } {
  switch (state) {
    case "downloading":
    case "forcedDL":
    case "metaDL":
      return { label: "Downloading", color: "text-blue-500" };
    case "uploading":
    case "forcedUP":
      return { label: "Seeding", color: "text-green-500" };
    case "pausedDL":
    case "stoppedDL":
      return { label: "Paused", color: "text-yellow-500" };
    case "pausedUP":
    case "stoppedUP":
      return { label: "Completed", color: "text-gray-400" };
    case "stalledDL":
      return { label: "Stalled ↓", color: "text-orange-400" };
    case "stalledUP":
      return { label: "Stalled ↑", color: "text-orange-400" };
    case "checkingDL":
    case "checkingUP":
    case "checkingResumeData":
      return { label: "Checking", color: "text-purple-400" };
    case "queuedDL":
    case "queuedUP":
      return { label: "Queued", color: "text-slate-400" };
    case "error":
      return { label: "Error", color: "text-red-500" };
    case "missingFiles":
      return { label: "Missing Files", color: "text-red-500" };
    case "moving":
      return { label: "Moving", color: "text-cyan-400" };
    case "allocating":
      return { label: "Allocating", color: "text-cyan-400" };
    default:
      return { label: state ?? "Unknown", color: "text-muted-foreground" };
  }
}
