import { useEffect, useMemo, useRef, useState } from "react";
import { SearchIcon, FolderOpenIcon, HardDriveIcon, Settings2Icon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import useMainStore from "@/sotres/main";
import { FILTERS } from "@/pages/main/utils";
import { buildCommandPaletteItems, getCommandHref, SETTINGS_COMMANDS } from "./command-palette.utils";
import { cn } from "@/lib/utils";
import type { CommandPaletteItem } from "./command-palette.types";
import { useLocation, useNavigate } from "react-router";

function getIcon(item: CommandPaletteItem) {
  switch (item.type) {
    case "torrent":
      return <HardDriveIcon className="size-4" />;
    case "filter":
      return <FolderOpenIcon className="size-4" />;
    case "setting":
      return <Settings2Icon className="size-4" />;
  }
}

function isMoveDownKey(event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey">) {
  return event.key === "ArrowDown" || (event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === "j");
}

function isMoveUpKey(event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey">) {
  return event.key === "ArrowUp" || (event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === "k");
}

export function CommandPalette() {
  const navigate = useNavigate();
  const location = useLocation();
  const { torrents } = useMainStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mouseHoverEnabled, setMouseHoverEnabled] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const lastCompositionEndRef = useRef(0);

  const items = useMemo(
    () =>
      buildCommandPaletteItems(
        {
          torrents,
          filters: FILTERS.map(({ key, label }) => ({ key, label })),
          settings: SETTINGS_COMMANDS,
          currentPath: location.pathname,
        },
        query,
      ),
    [location.pathname, query, torrents],
  );

  function runItem(item?: CommandPaletteItem) {
    if (!item) return;
    const href = getCommandHref(item);
    setOpen(false);
    navigate(href, {
      state: {
        paletteFrom: `${location.pathname}${location.search}`,
      },
    });
  }

  function moveActiveIndex(next: number) {
    setHoveredIndex(null);
    setMouseHoverEnabled(false);
    setActiveIndex(next);
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;

      if (event.metaKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        return;
      }

      if (!open) return;
      if (isEditable) return;

      if (isMoveDownKey(event)) {
        event.preventDefault();
        moveActiveIndex(Math.min(activeIndex + 1, Math.max(items.length - 1, 0)));
      } else if (isMoveUpKey(event)) {
        event.preventDefault();
        moveActiveIndex(Math.max(activeIndex - 1, 0));
      } else if (event.key === "Enter" && !isEditable) {
        event.preventDefault();
        runItem(items[activeIndex]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, items, open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
      setHoveredIndex(null);
      setMouseHoverEnabled(false);
      setIsComposing(false);
      lastCompositionEndRef.current = 0;
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
    setHoveredIndex(null);
    setMouseHoverEnabled(false);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const node = itemRefs.current[activeIndex];
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl h-[480px] flex flex-col p-0 gap-0 overflow-hidden [&_[data-slot='dialog-close']]:top-3 [&_[data-slot='dialog-close']]:right-4 [&_[data-slot='dialog-close']]:-translate-y-0 [&_[data-slot='dialog-close']]:mt-0">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">
          Search torrents, categories, and settings, then press Enter to navigate.
        </DialogDescription>
        <div className="flex items-center gap-3 border-b px-4 py-3 pr-14">
          <SearchIcon className="size-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => {
              setIsComposing(false);
              lastCompositionEndRef.current = Date.now();
            }}
            onKeyDown={(event) => {
              const justCommittedComposition =
                Date.now() - lastCompositionEndRef.current < 80;
              const composing = isComposing || event.nativeEvent.isComposing;
              const isImeEnter =
                event.nativeEvent.keyCode === 229 || composing || justCommittedComposition;

              if (event.key === "Enter" && !isImeEnter) {
                event.preventDefault();
                runItem(items[activeIndex]);
              } else if (isMoveDownKey(event)) {
                event.preventDefault();
                moveActiveIndex(Math.min(activeIndex + 1, Math.max(items.length - 1, 0)));
              } else if (isMoveUpKey(event)) {
                event.preventDefault();
                moveActiveIndex(Math.max(activeIndex - 1, 0));
              }
            }}
            placeholder="Search torrents, categories, and settings..."
            className="border-0 shadow-none focus-visible:ring-0 px-0"
          />
          <span className="hidden sm:inline text-[11px] text-muted-foreground whitespace-nowrap">Enter to open</span>
        </div>
        <ScrollArea className="flex-1 min-h-0">
          <div
            className="p-2 min-h-full"
            onMouseMove={() => {
              if (!mouseHoverEnabled) {
                setMouseHoverEnabled(true);
              }
            }}
          >
            {items.length === 0 ? (
              <div className="px-3 py-8 text-sm text-center text-muted-foreground">
                No matching commands
              </div>
            ) : (
              items.map((item, index) => (
                <button
                  key={item.id}
                  ref={(node) => {
                    itemRefs.current[index] = node;
                  }}
                  type="button"
                  onMouseEnter={() => {
                    if (!mouseHoverEnabled) return;
                    setHoveredIndex(index);
                    setActiveIndex(index);
                  }}
                  onMouseLeave={() => {
                    if (!mouseHoverEnabled) return;
                    setHoveredIndex((current) => (current === index ? null : current));
                  }}
                  onClick={() => runItem(item)}
                  className={cn(
                    "w-full flex items-start gap-3 rounded-md px-3 py-2 text-left transition-colors",
                    index === activeIndex || index === hoveredIndex
                      ? "bg-accent text-accent-foreground"
                      : "",
                  )}
                >
                  <span className="mt-0.5 text-muted-foreground">{getIcon(item)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{item.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
