import { ArrowDownIcon, ArrowUpIcon, NetworkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { FilterKey, TransferInfo } from "./types";
import { FILTERS, formatSpeed } from "./utils";

interface SidebarProps {
  version: string;
  filter: FilterKey;
  counts: Record<FilterKey, number>;
  onFilterChange: (key: FilterKey) => void;
  transferInfo: TransferInfo | null;
}

export function Sidebar({ version, filter, counts, onFilterChange, transferInfo }: SidebarProps) {
  return (
    <aside className="w-44 shrink-0 flex flex-col border-r bg-muted/30">
      {/* Draggable title bar zone */}
      <div
        data-tauri-drag-region
        className="shrink-0 border-b select-none"
        style={{ height: "52px" }}
      >
        <div
          data-tauri-drag-region
          className="flex flex-col justify-end h-full pb-2"
          style={{ paddingLeft: "76px" }}
        >
          <h1 data-tauri-drag-region className="font-bold text-sm tracking-tight leading-none pointer-events-none">qBitView</h1>
          {version && (
            <p data-tauri-drag-region className="text-xs text-muted-foreground mt-0.5 pointer-events-none">{version}</p>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {FILTERS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            className={cn(
              "w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
              filter === key && "bg-accent text-accent-foreground font-medium",
            )}
          >
            {icon}
            <span className="flex-1 text-left">{label}</span>
            {counts[key] > 0 && (
              <span className={cn(
                "text-xs tabular-nums rounded-full px-1.5 py-0.5 leading-none",
                filter === key
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground",
              )}>
                {counts[key]}
              </span>
            )}
          </button>
        ))}
      </nav>

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
  );
}
