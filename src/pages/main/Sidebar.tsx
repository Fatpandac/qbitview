import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { isMacOS } from "@/lib/platform";
import { FilterKey } from "./types";
import { FILTERS } from "./utils";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "sidebar-collapsed";

interface SidebarProps {
  version: string;
  filter: FilterKey;
  counts: Record<FilterKey, number>;
  onFilterChange: (key: FilterKey) => void;
}

export function Sidebar({ version, filter, counts, onFilterChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true");
  const titleLeftPadding = isMacOS() ? "76px" : "12px";
  const widthClassName = collapsed ? "w-16" : "w-44";

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  return (
    <aside className={cn("shrink-0 flex flex-col border-r bg-muted/30 transition-[width]", widthClassName)}>
      {/* Draggable title bar zone */}
      <div
        data-tauri-drag-region
        className="shrink-0 border-b select-none"
        style={{ height: "52px" }}
      >
        <div
          className={cn("flex items-end h-full pb-2", collapsed ? "justify-center px-2" : "pr-2")}
          style={collapsed ? undefined : { paddingLeft: titleLeftPadding }}
        >
          <div
            data-tauri-drag-region
            className={cn("min-w-0", collapsed ? "hidden" : "flex flex-col justify-end h-full")}
          >
            <h1 data-tauri-drag-region className="font-bold text-sm tracking-tight leading-none pointer-events-none">qBitView</h1>
            {version && (
              <p data-tauri-drag-region className="text-xs text-muted-foreground mt-0.5 pointer-events-none">{version}</p>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <nav className="py-2">
          {FILTERS.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => onFilterChange(key)}
              title={collapsed ? label : undefined}
              className={cn(
                "w-full flex items-center text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                collapsed ? "justify-center gap-1 px-2 py-2.5" : "gap-2.5 px-4 py-2",
                filter === key && "bg-accent text-accent-foreground font-medium",
              )}
            >
              {icon}
              {!collapsed && <span className="flex-1 text-left">{label}</span>}
              {(collapsed || counts[key] > 0) && (
                <span className={cn(
                  "text-xs tabular-nums rounded-full leading-none",
                  collapsed ? "min-w-[1.5rem] px-1 py-0.5 text-center" : "px-1.5 py-0.5",
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

      <div className="p-2">
        <button
          type="button"
          className={cn(
            "rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
            collapsed ? "ml-auto flex" : "ml-auto flex",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed((prev) => !prev)}
        >
          {collapsed ? <PanelLeftOpenIcon className="size-4" /> : <PanelLeftCloseIcon className="size-4" />}
        </button>
      </div>
    </aside>
  );
}
