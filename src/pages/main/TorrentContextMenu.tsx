import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  CirclePauseIcon,
  CirclePlayIcon,
  Trash2Icon,
  RefreshCwIcon,
  RadioIcon,
  CheckIcon,
  ArrowDownIcon,
  ArrowUpIcon,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Torrent } from "./types";
import { formatSpeed } from "./utils";

interface TorrentContextMenuProps {
  torrent: Torrent;
  children: React.ReactNode;
  onAction: () => void;
  onDelete: (torrent: Torrent) => void;
}

const SPEED_PRESETS = [
  { label: "Unlimited", value: 0 },
  { label: "100 KB/s",  value: 100 * 1024 },
  { label: "500 KB/s",  value: 500 * 1024 },
  { label: "1 MB/s",   value: 1024 * 1024 },
  { label: "5 MB/s",   value: 5 * 1024 * 1024 },
  { label: "10 MB/s",  value: 10 * 1024 * 1024 },
];

function isPreset(value: number) {
  return SPEED_PRESETS.some((p) => p.value === value);
}

function formatLimit(bytes: number) {
  if (bytes <= 0) return "∞";
  return formatSpeed(bytes);
}

type SpeedType = "download" | "upload";

export function TorrentContextMenu({
  torrent,
  children,
  onAction,
  onDelete,
}: TorrentContextMenuProps) {
  const [speedDialog, setSpeedDialog] = useState<SpeedType | null>(null);
  const [customSpeed, setCustomSpeed] = useState("");

  const hash = torrent.hash ?? "";
  const isPaused = ["pausedDL", "stoppedDL", "pausedUP", "stoppedUP"].includes(torrent.state ?? "");

  // qBit returns -1 for "no limit"; normalise to 0
  const dlLimit = (torrent.dl_limit ?? 0) <= 0 ? 0 : (torrent.dl_limit ?? 0);
  const upLimit = (torrent.up_limit ?? 0) <= 0 ? 0 : (torrent.up_limit ?? 0);

  async function handlePause() {
    await invoke("stop_torrents", { hashes: [hash] }).catch(console.error);
    onAction();
  }
  async function handleResume() {
    await invoke("start_torrents", { hashes: [hash] }).catch(console.error);
    onAction();
  }
  async function handleRecheck() {
    await invoke("recheck_torrents", { hashes: [hash] }).catch(console.error);
    onAction();
  }
  async function handleReannounce() {
    await invoke("reannounce_torrents", { hashes: [hash] }).catch(console.error);
    onAction();
  }
  async function applySpeedLimit(type: SpeedType, bytes: number) {
    const cmd = type === "download" ? "set_torrent_download_limit" : "set_torrent_upload_limit";
    await invoke(cmd, { hashes: [hash], limit: bytes }).catch(console.error);
    onAction();
  }
  function openCustomSpeed(type: SpeedType) {
    const current = type === "download" ? dlLimit : upLimit;
    setCustomSpeed(current > 0 ? String(Math.round(current / 1024)) : "");
    setSpeedDialog(type);
  }
  async function submitCustomSpeed() {
    if (!speedDialog) return;
    const kb = parseFloat(customSpeed);
    if (isNaN(kb) || kb < 0) return;
    await applySpeedLimit(speedDialog, Math.round(kb * 1024));
    setSpeedDialog(null);
  }

  function SpeedSubmenu({ type }: { type: SpeedType }) {
    const current = type === "download" ? dlLimit : upLimit;
    const hasCustom = current > 0 && !isPreset(current);
    return (
      <ContextMenuSubContent className="w-48">
        {SPEED_PRESETS.map((p) => (
          <ContextMenuItem key={p.value} onClick={() => applySpeedLimit(type, p.value)}>
            <span className="w-4 shrink-0 flex items-center">
              {current === p.value && <CheckIcon className="size-3.5" />}
            </span>
            {p.label}
          </ContextMenuItem>
        ))}
        {hasCustom && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => applySpeedLimit(type, current)}>
              <span className="w-4 shrink-0 flex items-center">
                <CheckIcon className="size-3.5" />
              </span>
              {formatSpeed(current)}
            </ContextMenuItem>
          </>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => openCustomSpeed(type)}>
          <span className="w-4 shrink-0" />
          Custom…
        </ContextMenuItem>
      </ContextMenuSubContent>
    );
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-52">
          <ContextMenuLabel className="truncate max-w-[180px]">{torrent.name ?? "Torrent"}</ContextMenuLabel>
          <ContextMenuSeparator />

          {isPaused ? (
            <ContextMenuItem onClick={handleResume}>
              <CirclePlayIcon className="size-4 text-green-500" />
              Resume
            </ContextMenuItem>
          ) : (
            <ContextMenuItem onClick={handlePause}>
              <CirclePauseIcon className="size-4 text-yellow-500" />
              Pause
            </ContextMenuItem>
          )}

          <ContextMenuSeparator />

          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <ArrowDownIcon className="size-4 text-blue-500" />
              <span className="flex-1">Download Limit</span>
              <span className="text-xs text-muted-foreground">{formatLimit(dlLimit)}</span>
            </ContextMenuSubTrigger>
            <SpeedSubmenu type="download" />
          </ContextMenuSub>

          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <ArrowUpIcon className="size-4 text-green-500" />
              <span className="flex-1">Upload Limit</span>
              <span className="text-xs text-muted-foreground">{formatLimit(upLimit)}</span>
            </ContextMenuSubTrigger>
            <SpeedSubmenu type="upload" />
          </ContextMenuSub>

          <ContextMenuSeparator />

          <ContextMenuItem onClick={handleRecheck}>
            <RefreshCwIcon className="size-4" />
            Force Recheck
          </ContextMenuItem>
          <ContextMenuItem onClick={handleReannounce}>
            <RadioIcon className="size-4" />
            Force Reannounce
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem variant="destructive" onClick={() => onDelete(torrent)}>
            <Trash2Icon className="size-4" />
            Delete…
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Dialog open={speedDialog !== null} onOpenChange={(o) => !o && setSpeedDialog(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>
              {speedDialog === "download" ? "Download" : "Upload"} Speed Limit
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 py-2">
            <Input
              autoFocus
              type="number"
              min="0"
              placeholder="e.g. 512"
              value={customSpeed}
              onChange={(e) => setCustomSpeed(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitCustomSpeed()}
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">KB/s</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSpeedDialog(null)}>Cancel</Button>
            <Button onClick={submitCustomSpeed}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
