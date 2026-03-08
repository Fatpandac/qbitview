import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CircleCheckIcon,
  CirclePauseIcon,
  CirclePlayIcon,
  CircleXIcon,
  DownloadIcon,
  HardDriveIcon,
  NetworkIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Torrent {
  hash?: string;
  name?: string;
  size?: number;
  progress?: number;
  dlspeed?: number;
  upspeed?: number;
  state?: string;
  eta?: number;
  num_seeds?: number;
  num_leechs?: number;
  category?: string;
  downloaded?: number;
  uploaded?: number;
  ratio?: number;
  added_on?: number;
}

interface TransferInfo {
  dl_info_speed: number;
  up_info_speed: number;
  dl_info_data: number;
  up_info_data: number;
  dht_nodes: number;
}

type FilterKey =
  | "all"
  | "downloading"
  | "completed"
  | "paused"
  | "active"
  | "inactive"
  | "stalled"
  | "errored";

const FILTERS: { key: FilterKey; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All", icon: <HardDriveIcon className="size-4" /> },
  { key: "downloading", label: "Downloading", icon: <DownloadIcon className="size-4" /> },
  { key: "completed", label: "Completed", icon: <CircleCheckIcon className="size-4" /> },
  { key: "paused", label: "Paused", icon: <CirclePauseIcon className="size-4" /> },
  { key: "active", label: "Active", icon: <CirclePlayIcon className="size-4" /> },
  { key: "inactive", label: "Inactive", icon: <NetworkIcon className="size-4" /> },
  { key: "stalled", label: "Stalled", icon: <TriangleAlertIcon className="size-4" /> },
  { key: "errored", label: "Errored", icon: <CircleXIcon className="size-4" /> },
];

function formatBytes(bytes?: number): string {
  if (bytes == null) return "—";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatSpeed(bytesPerSec?: number): string {
  if (!bytesPerSec) return "0 B/s";
  return `${formatBytes(bytesPerSec)}/s`;
}

function formatEta(eta?: number): string {
  if (eta == null || eta < 0 || eta >= 8640000) return "∞";
  if (eta === 0) return "Done";
  const h = Math.floor(eta / 3600);
  const m = Math.floor((eta % 3600) / 60);
  const s = eta % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function getStateLabel(state?: string): { label: string; color: string } {
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

function ProgressBar({ value }: { value?: number }) {
  const pct = Math.min(100, Math.max(0, (value ?? 0) * 100));
  return (
    <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full bg-primary rounded-full transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Main() {
  const [version, setVersion] = useState<string>("");
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [transferInfo, setTransferInfo] = useState<TransferInfo | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteFiles, setDeleteFiles] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchData() {
    try {
      const filterArg = filter === "all" ? null : filter;
      const [ts, ti] = await Promise.all([
        invoke<Torrent[]>("get_torrents", { filter: filterArg }),
        invoke<TransferInfo>("get_transfer_info"),
      ]);
      setTorrents(ts);
      setTransferInfo(ti);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    invoke<string>("get_version")
      .then(setVersion)
      .catch(console.error);
  }, []);

  useEffect(() => {
    setSelected(new Set());
    fetchData();
    intervalRef.current = setInterval(fetchData, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [filter]);

  function toggleSelect(hash: string, e: React.MouseEvent) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        next.has(hash) ? next.delete(hash) : next.add(hash);
      } else {
        if (next.size === 1 && next.has(hash)) {
          next.clear();
        } else {
          next.clear();
          next.add(hash);
        }
      }
      return next;
    });
  }

  const selectedHashes = Array.from(selected);

  async function handleStop() {
    if (!selectedHashes.length) return;
    await invoke("stop_torrents", { hashes: selectedHashes });
    fetchData();
  }

  async function handleStart() {
    if (!selectedHashes.length) return;
    await invoke("start_torrents", { hashes: selectedHashes });
    fetchData();
  }

  async function handleDelete(withFiles: boolean) {
    if (!selectedHashes.length) return;
    await invoke("delete_torrents", { hashes: selectedHashes, deleteFiles: withFiles });
    setSelected(new Set());
    setShowDeleteModal(false);
    fetchData();
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-44 shrink-0 flex flex-col border-r bg-muted/30">
        <div className="px-4 py-3 border-b">
          <h1 className="font-bold text-base tracking-tight">qBitView</h1>
          {version && (
            <p className="text-xs text-muted-foreground mt-0.5">v{version}</p>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {FILTERS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                filter === key && "bg-accent text-accent-foreground font-medium",
              )}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>
        {/* Transfer stats in sidebar bottom */}
        {transferInfo && (
          <div className="p-3 border-t text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5">
              <ArrowDownIcon className="size-3 text-blue-500" />
              <span>{formatSpeed(transferInfo.dl_info_speed)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowUpIcon className="size-3 text-green-500" />
              <span>{formatSpeed(transferInfo.up_info_speed)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <NetworkIcon className="size-3" />
              <span>{transferInfo.dht_nodes} nodes</span>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b shrink-0">
          <Button
            size="sm"
            variant="outline"
            disabled={!selectedHashes.length}
            onClick={handleStop}
          >
            <CirclePauseIcon className="size-4" />
            Pause
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!selectedHashes.length}
            onClick={handleStart}
          >
            <CirclePlayIcon className="size-4" />
            Resume
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={!selectedHashes.length}
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2Icon className="size-4" />
            Delete
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            {torrents.length} torrents
            {selectedHashes.length > 0 && ` · ${selectedHashes.length} selected`}
          </span>
        </div>

        {/* Torrent table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
              <tr className="text-muted-foreground text-xs uppercase tracking-wide">
                <th className="text-left px-4 py-2 font-medium w-1/3">Name</th>
                <th className="text-right px-3 py-2 font-medium w-20">Size</th>
                <th className="text-left px-3 py-2 font-medium w-28">Progress</th>
                <th className="text-left px-3 py-2 font-medium w-28">Status</th>
                <th className="text-right px-3 py-2 font-medium w-24">↓ Speed</th>
                <th className="text-right px-3 py-2 font-medium w-24">↑ Speed</th>
                <th className="text-right px-3 py-2 font-medium w-16">Seeds</th>
                <th className="text-right px-3 py-2 font-medium w-16">Peers</th>
                <th className="text-right px-3 py-2 font-medium w-20">ETA</th>
                <th className="text-right px-3 py-2 font-medium w-16">Ratio</th>
              </tr>
            </thead>
            <tbody>
              {torrents.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-muted-foreground">
                    No torrents found
                  </td>
                </tr>
              )}
              {torrents.map((t) => {
                const hash = t.hash ?? "";
                const isSelected = selected.has(hash);
                const { label, color } = getStateLabel(t.state);
                return (
                  <tr
                    key={hash}
                    onClick={(e) => toggleSelect(hash, e)}
                    className={cn(
                      "border-b border-border/40 cursor-pointer transition-colors hover:bg-muted/50",
                      isSelected && "bg-accent/60 hover:bg-accent/70",
                    )}
                  >
                    <td className="px-4 py-2 truncate max-w-0">
                      <span className="truncate block" title={t.name ?? ""}>
                        {t.name ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground whitespace-nowrap">
                      {formatBytes(t.size)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1">
                        <ProgressBar value={t.progress} />
                        <span className="text-xs text-muted-foreground text-right">
                          {((t.progress ?? 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className={cn("px-3 py-2 whitespace-nowrap text-xs font-medium", color)}>
                      {label}
                    </td>
                    <td className="px-3 py-2 text-right text-blue-500 whitespace-nowrap">
                      {t.dlspeed ? formatSpeed(t.dlspeed) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-green-500 whitespace-nowrap">
                      {t.upspeed ? formatSpeed(t.upspeed) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {t.num_seeds ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {t.num_leechs ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground whitespace-nowrap">
                      {formatEta(t.eta)}
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {t.ratio != null ? t.ratio.toFixed(2) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Status bar */}
        {transferInfo && (
          <div className="flex items-center gap-6 px-4 py-1.5 border-t bg-muted/30 text-xs text-muted-foreground shrink-0">
            <span className="flex items-center gap-1">
              <ArrowDownIcon className="size-3 text-blue-500" />
              {formatSpeed(transferInfo.dl_info_speed)}
              <span className="text-muted-foreground/60 ml-1">
                ({formatBytes(transferInfo.dl_info_data)} total)
              </span>
            </span>
            <span className="flex items-center gap-1">
              <ArrowUpIcon className="size-3 text-green-500" />
              {formatSpeed(transferInfo.up_info_speed)}
              <span className="text-muted-foreground/60 ml-1">
                ({formatBytes(transferInfo.up_info_data)} total)
              </span>
            </span>
            <span className="flex items-center gap-1 ml-auto">
              <NetworkIcon className="size-3" />
              DHT: {transferInfo.dht_nodes} nodes
            </span>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-background rounded-lg shadow-xl border p-6 w-80 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-semibold text-base">Delete Torrent{selectedHashes.length > 1 ? "s" : ""}</h2>
            <p className="text-sm text-muted-foreground">
              Remove {selectedHashes.length} torrent{selectedHashes.length > 1 ? "s" : ""}?
            </p>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={deleteFiles}
                onChange={(e) => setDeleteFiles(e.target.checked)}
                className="rounded"
              />
              Also delete downloaded files
            </label>
            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(deleteFiles)}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Main;
