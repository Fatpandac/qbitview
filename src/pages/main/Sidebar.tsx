import { ArrowDownIcon, ArrowUpIcon, NetworkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { FilterKey, TransferInfo } from "./types";
import { FILTERS, formatSpeed } from "./utils";

interface SidebarProps {
  version: string;
  filter: FilterKey;
  onFilterChange: (key: FilterKey) => void;
  transferInfo: TransferInfo | null;
}

export function Sidebar({ version, filter, onFilterChange, transferInfo }: SidebarProps) {
  return (
    <aside className="w-44 shrink-0 flex flex-col border-r bg-muted/30">
      {/* Draggable title bar zone — sits over the macOS traffic lights area */}
      <div
        data-tauri-drag-region
        className="shrink-0 border-b select-none"
        style={{ height: "52px", WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <div className="flex flex-col justify-end h-full px-4 pb-2" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          <h1 className="font-bold text-sm tracking-tight leading-none">qBitView</h1>
          {version && (
            <p className="text-xs text-muted-foreground mt-0.5">{version}</p>
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
            {label}
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
