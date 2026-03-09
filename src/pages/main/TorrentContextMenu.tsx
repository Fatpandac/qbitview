import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  CirclePauseIcon,
  CirclePlayIcon,
  Trash2Icon,
  RefreshCwIcon,
  RadioIcon,
  GaugeIcon,
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

interface TorrentContextMenuProps {
  torrent: Torrent;
  children: React.ReactNode;
  onAction: () => void;
  onDelete: (torrent: Torrent) => void;
}

const SPEED_PRESETS = [
  { label: "Unlimited", value: 0 },
  { label: "100 KB/s", value: 100 * 1024 },
  { label: "500 KB/s", value: 500 * 1024 },
  { label: "1 MB/s",  value: 1024 * 1024 },
  { label: "5 MB/s",  value: 5 * 1024 * 1024 },
  { label: "10 MB/s", value: 10 * 1024 * 1024 },
];

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
    setCustomSpeed("");
    setSpeedDialog(type);
  }

  async function submitCustomSpeed() {
    if (!speedDialog) return;
    const kb = parseFloat(customSpeed);
    if (isNaN(kb) || kb < 0) return;
    await applySpeedLimit(speedDialog, Math.round(kb * 1024));
    setSpeedDialog(null);
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
              Download Limit
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-40">
              {SPEED_PRESETS.map((p) => (
                <ContextMenuItem key={p.value} onClick={() => applySpeedLimit("download", p.value)}>
                  <GaugeIcon className="size-4" />
                  {p.label}
                </ContextMenuItem>
              ))}
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => openCustomSpeed("download")}>
                Custom…
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <ArrowUpIcon className="size-4 text-green-500" />
              Upload Limit
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-40">
              {SPEED_PRESETS.map((p) => (
                <ContextMenuItem key={p.value} onClick={() => applySpeedLimit("upload", p.value)}>
                  <GaugeIcon className="size-4" />
                  {p.label}
                </ContextMenuItem>
              ))}
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => openCustomSpeed("upload")}>
                Custom…
              </ContextMenuItem>
            </ContextMenuSubContent>
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

      {/* Custom speed dialog */}
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
