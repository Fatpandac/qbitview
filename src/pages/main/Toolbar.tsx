import { Button } from "@/components/ui/button";
import { CirclePauseIcon, CirclePlayIcon, PlusIcon, Trash2Icon } from "lucide-react";

interface ToolbarProps {
  totalCount: number;
  selectedCount: number;
  onAdd: () => void;
  onPause: () => void;
  onResume: () => void;
  onDelete: () => void;
}

export function Toolbar({
  totalCount,
  selectedCount,
  onAdd,
  onPause,
  onResume,
  onDelete,
}: ToolbarProps) {
  const hasSelection = selectedCount > 0;

  return (
    <div
      data-tauri-drag-region
      className="flex items-center gap-2 px-4 border-b shrink-0"
      style={{ height: "52px", WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties} className="flex items-center gap-2">
        <Button size="sm" onClick={onAdd}>
          <PlusIcon className="size-4" />
          Add
        </Button>

        <div className="w-px h-5 bg-border mx-1" />

        <Button size="sm" variant="outline" disabled={!hasSelection} onClick={onPause}>
          <CirclePauseIcon className="size-4" />
          Pause
        </Button>
        <Button size="sm" variant="outline" disabled={!hasSelection} onClick={onResume}>
          <CirclePlayIcon className="size-4" />
          Resume
        </Button>
        <Button size="sm" variant="destructive" disabled={!hasSelection} onClick={onDelete}>
          <Trash2Icon className="size-4" />
          Delete
        </Button>
      </div>

      <span className="ml-auto text-xs text-muted-foreground" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
        {totalCount} torrents
        {hasSelection && ` · ${selectedCount} selected`}
      </span>
    </div>
  );
}
