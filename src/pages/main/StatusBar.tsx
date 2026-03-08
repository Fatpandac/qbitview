import { ArrowDownIcon, ArrowUpIcon, NetworkIcon } from "lucide-react";
import { TransferInfo } from "./types";
import { formatBytes, formatSpeed } from "./utils";

interface StatusBarProps {
  transferInfo: TransferInfo;
}

export function StatusBar({ transferInfo }: StatusBarProps) {
  return (
    <div className="flex items-center gap-6 px-4 py-1.5 border-t bg-muted/30 text-xs text-muted-foreground shrink-0">
      <span className="flex items-center gap-1">
        <ArrowDownIcon className="size-3 text-blue-500" />
        {formatSpeed(transferInfo.dl_info_speed)}
        <span className="text-muted-foreground/60 ml-1">
          ({formatBytes(transferInfo.dl_info_data)} total)
        </span>
      </span>
      <span className="flex items-center gap-1">
        <ArrowUpIcon className="size-3 text-green-500" />
        {formatSpeed(transferInfo.up_info_speed)}
        <span className="text-muted-foreground/60 ml-1">
          ({formatBytes(transferInfo.up_info_data)} total)
        </span>
      </span>
      <span className="flex items-center gap-1 ml-auto">
        <NetworkIcon className="size-3" />
        DHT: {transferInfo.dht_nodes} nodes
      </span>
    </div>
  );
}
