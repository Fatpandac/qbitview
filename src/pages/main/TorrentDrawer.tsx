import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Torrent, TorrentProperty } from "./types";
import { formatBytes, formatEta, formatSpeed } from "./utils";
import { PiecesCanvas } from "./PiecesCanvas";

interface TorrentDrawerProps {
  torrent: Torrent;
  onClose: () => void;
}

function formatTime(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatDate(unix?: number | null): string {
  if (!unix || unix <= 0) return "—";
  return new Date(unix * 1000).toLocaleString();
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium break-all">{value}</p>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <div className={cn("size-2.5 rounded-sm", color)} />
      {label}
    </div>
  );
}

export function TorrentDrawer({ torrent, onClose }: TorrentDrawerProps) {
  const [property, setProperty] = useState<TorrentProperty | null>(null);
  const [pieces, setPieces] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const piecesIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!torrent.hash) return;
    setLoading(true);
    setProperty(null);
    setPieces([]);

    Promise.all([
      invoke<TorrentProperty>("get_torrent_properties", { hash: torrent.hash }),
      invoke<number[]>("get_torrent_pieces_states", { hash: torrent.hash }),
    ])
      .then(([props, pcs]) => {
        setProperty(props);
        setPieces(pcs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Refresh pieces every 3s while drawer is open
    piecesIntervalRef.current = setInterval(async () => {
      try {
        const pcs = await invoke<number[]>("get_torrent_pieces_states", { hash: torrent.hash! });
        setPieces(pcs);
      } catch {}
    }, 3000);

    return () => {
      if (piecesIntervalRef.current) clearInterval(piecesIntervalRef.current);
    };
  }, [torrent.hash]);

  const downloaded = pieces.filter((p) => p === 2).length;
  const downloading = pieces.filter((p) => p === 1).length;
  const pct = pieces.length > 0 ? ((downloaded / pieces.length) * 100).toFixed(1) : "0";

  return (
    <div className="w-80 xl:w-96 shrink-0 border-l bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-4 py-3 border-b shrink-0">
        <div className="min-w-0">
          <h2 className="font-semibold text-sm leading-snug" title={torrent.name ?? ""}>
            {torrent.name ?? "—"}
          </h2>
          <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
            {torrent.hash}
          </p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            Loading…
          </div>
        ) : !property ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            No data available
          </div>
        ) : (
          <div className="p-4 space-y-5 text-sm">
            {/* Save path */}
            {property.save_path && (
              <InfoItem label="Save Path" value={property.save_path} />
            )}

            {/* Comment */}
            {property.comment && property.comment !== "None" && (
              <InfoItem label="Comment" value={property.comment} />
            )}

            <div className="h-px bg-border" />

            {/* File info */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <InfoItem label="Total Size" value={formatBytes(property.total_size ?? undefined)} />
              <InfoItem label="Piece Size" value={formatBytes(property.piece_size ?? undefined)} />
              <InfoItem
                label="Pieces"
                value={`${property.pieces_have ?? 0} / ${property.pieces_num ?? 0}`}
              />
              <InfoItem label="Share Ratio" value={property.share_ratio?.toFixed(3) ?? "—"} />
              <InfoItem
                label="Seeds"
                value={`${property.seeds ?? 0} / ${property.seeds_total ?? 0}`}
              />
              <InfoItem
                label="Peers"
                value={`${property.peers ?? 0} / ${property.peers_total ?? 0}`}
              />
              <InfoItem
                label="Connections"
                value={`${property.nb_connections ?? 0} / ${property.nb_connections_limit ?? 0}`}
              />
              <InfoItem label="ETA" value={formatEta(property.eta ?? undefined)} />
            </div>

            <div className="h-px bg-border" />

            {/* Transfer */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <InfoItem
                label="Downloaded"
                value={formatBytes(property.total_downloaded ?? undefined)}
              />
              <InfoItem
                label="Uploaded"
                value={formatBytes(property.total_uploaded ?? undefined)}
              />
              <InfoItem
                label="↓ Speed"
                value={formatSpeed(property.dl_speed ?? undefined)}
              />
              <InfoItem
                label="↑ Speed"
                value={formatSpeed(property.up_speed ?? undefined)}
              />
              <InfoItem
                label="Avg ↓"
                value={formatSpeed(property.dl_speed_avg ?? undefined)}
              />
              <InfoItem
                label="Avg ↑"
                value={formatSpeed(property.up_speed_avg ?? undefined)}
              />
              <InfoItem label="Active Time" value={formatTime(property.time_elapsed)} />
              <InfoItem label="Seeding Time" value={formatTime(property.seeding_time)} />
            </div>

            <div className="h-px bg-border" />

            {/* Meta */}
            <div className="space-y-3">
              {property.created_by && (
                <InfoItem label="Created By" value={property.created_by} />
              )}
              <InfoItem label="Added" value={formatDate(property.addition_date)} />
              {(property.completion_date ?? 0) > 0 && (
                <InfoItem label="Completed" value={formatDate(property.completion_date)} />
              )}
            </div>

            <div className="h-px bg-border" />

            {/* Pieces visualization */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold">Pieces</p>
                <p className="text-xs text-muted-foreground">
                  {downloaded.toLocaleString()} / {pieces.length.toLocaleString()} ({pct}%)
                </p>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <LegendItem color="bg-blue-500" label="Downloaded" />
                <LegendItem color="bg-amber-400" label="Downloading" />
                <LegendItem color="bg-[#374151]" label="Missing" />
              </div>

              {pieces.length > 0 ? (
                <PiecesCanvas pieces={pieces} />
              ) : (
                <p className="text-xs text-muted-foreground">No piece data</p>
              )}

              {downloading > 0 && (
                <p className="text-xs text-amber-500 mt-2">
                  {downloading.toLocaleString()} piece{downloading > 1 ? "s" : ""} currently downloading
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
