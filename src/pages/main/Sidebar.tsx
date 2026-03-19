import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { isMacOS } from "@/lib/platform";
import { FilterKey } from "./types";
import { FILTERS } from "./utils";

interface SidebarProps {
  version: string;
  filter: FilterKey;
  counts: Record<FilterKey, number>;
  onFilterChange: (key: FilterKey) => void;
}

export function Sidebar({ version, filter, counts, onFilterChange }: SidebarProps) {
  const titleLeftPadding = isMacOS() ? "76px" : "12px";

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
          style={{ paddingLeft: titleLeftPadding }}
        >
          <h1 data-tauri-drag-region className="font-bold text-sm tracking-tight leading-none pointer-events-none">qBitView</h1>
          {version && (
            <p data-tauri-drag-region className="text-xs text-muted-foreground mt-0.5 pointer-events-none">{version}</p>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <nav className="py-2">
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
      </ScrollArea>
    </aside>
  );
}
