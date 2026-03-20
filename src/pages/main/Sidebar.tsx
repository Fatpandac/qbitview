import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderTreeIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  Settings2Icon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { isMacOS } from "@/lib/platform";
import { FilterKey } from "./types";
import { CategoryCount, FILTERS } from "./utils";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "sidebar-collapsed";
const SIDEBAR_CATEGORIES_COLLAPSED_STORAGE_KEY = "sidebar-categories-collapsed";

interface SidebarProps {
  version: string;
  filter: FilterKey;
  counts: Record<FilterKey, number>;
  categories?: CategoryCount[];
  activeCategory: string | null;
  onFilterChange: (key: FilterKey) => void;
  onCategoryChange: (category: string | null) => void;
  onOpenSettings: () => void;
}

export function Sidebar({
  version,
  filter,
  counts,
  categories = [],
  activeCategory,
  onFilterChange,
  onCategoryChange,
  onOpenSettings,
}: SidebarProps) {
  const isMac = isMacOS();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true");
  const [categoriesCollapsed, setCategoriesCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_CATEGORIES_COLLAPSED_STORAGE_KEY) === "true",
  );
  const titleLeftPadding = isMac ? "92px" : "12px";
  const widthClassName = collapsed ? (isMac ? "w-20" : "w-16") : "w-44";

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_CATEGORIES_COLLAPSED_STORAGE_KEY, String(categoriesCollapsed));
  }, [categoriesCollapsed]);

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
        <div className="py-2">
          <nav>
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

          {!collapsed && categories.length > 0 && (
            <section className="mt-3 border-t pt-3">
              <div className="flex items-center gap-1 px-2">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label={categoriesCollapsed ? "Expand categories" : "Collapse categories"}
                  onClick={() => setCategoriesCollapsed((value) => !value)}
                >
                  {categoriesCollapsed ? <ChevronRightIcon className="size-4" /> : <ChevronDownIcon className="size-4" />}
                  <FolderTreeIcon className="size-4 shrink-0" />
                  <span className="truncate text-left">Categories</span>
                </button>
              </div>

              {!categoriesCollapsed && (
                <div className="mt-2 space-y-1 px-2">
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      activeCategory === null && "bg-accent text-accent-foreground font-medium",
                    )}
                    aria-label="All categories"
                    onClick={() => onCategoryChange(null)}
                  >
                    <span className="flex-1 truncate text-left">All categories</span>
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.label}
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                        activeCategory === category.label && "bg-accent text-accent-foreground font-medium",
                      )}
                      aria-label={category.label}
                      title={category.label}
                      onClick={() => onCategoryChange(category.label)}
                    >
                      <span className="flex-1 truncate text-left">{category.label}</span>
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs leading-none text-muted-foreground">
                        {category.count}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </ScrollArea>

      {collapsed ? (
        <div className="p-2 flex flex-col items-center gap-2">
          <button
            type="button"
            className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Open settings"
            title="Open settings"
            onClick={onOpenSettings}
          >
            <Settings2Icon className="size-4 shrink-0" />
          </button>
          <button
            type="button"
            className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Expand sidebar"
            title="Expand sidebar"
            onClick={() => setCollapsed(false)}
          >
            <PanelLeftOpenIcon className="size-4" />
          </button>
        </div>
      ) : (
        <div className="p-2 flex items-center justify-between gap-2">
          <button
            type="button"
            className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            onClick={() => setCollapsed(true)}
          >
            <PanelLeftCloseIcon className="size-4" />
          </button>
          <button
            type="button"
            className="ml-auto flex items-center gap-2 rounded-md px-2.5 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="Open settings"
            title="Open settings"
            onClick={onOpenSettings}
          >
            <Settings2Icon className="size-4 shrink-0" />
            <span className="text-sm whitespace-nowrap">Settings</span>
          </button>
        </div>
      )}
    </aside>
  );
}
