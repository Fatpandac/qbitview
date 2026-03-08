import { cn } from "@/lib/utils";
import { Torrent } from "./types";
import { formatBytes, formatEta, formatSpeed, getStateLabel } from "./utils";

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

interface TorrentTableProps {
  torrents: Torrent[];
  selected: Set<string>;
  activeTorrentHash?: string;
  onToggleSelect: (hash: string) => void;
  onSelectAll: (checked: boolean) => void;
  onRowClick: (torrent: Torrent) => void;
}

export function TorrentTable({
  torrents,
  selected,
  activeTorrentHash,
  onToggleSelect,
  onSelectAll,
  onRowClick,
}: TorrentTableProps) {
  const allSelected = torrents.length > 0 && torrents.every((t) => selected.has(t.hash ?? ""));
  const someSelected = !allSelected && torrents.some((t) => selected.has(t.hash ?? ""));

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
          <tr className="text-muted-foreground text-xs uppercase tracking-wide">
            <th className="px-3 py-2 w-8">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => { if (el) el.indeterminate = someSelected; }}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="size-4 cursor-pointer accent-primary"
              />
            </th>
            <th className="text-left px-2 py-2 font-medium w-1/3">Name</th>
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
              <td colSpan={11} className="text-center py-16 text-muted-foreground">
                No torrents found
              </td>
            </tr>
          )}
          {torrents.map((t) => {
            const hash = t.hash ?? "";
            const isSelected = selected.has(hash);
            const isActive = hash === activeTorrentHash;
            const { label, color } = getStateLabel(t.state);
            return (
              <tr
                key={hash}
                onClick={(e) => {
                  // Don't trigger row click if clicking the checkbox cell
                  const target = e.target as HTMLElement;
                  if (target.tagName === "INPUT") return;
                  onRowClick(t);
                }}
                className={cn(
                  "border-b border-border/40 cursor-pointer transition-colors hover:bg-muted/50",
                  isSelected && "bg-accent/60 hover:bg-accent/70",
                  isActive && "ring-1 ring-inset ring-primary/50",
                )}
              >
                <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(hash)}
                    onClick={(e) => e.stopPropagation()}
                    className="size-4 cursor-pointer accent-primary"
                  />
                </td>
                <td className="px-2 py-2 truncate max-w-0">
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
  );
}
