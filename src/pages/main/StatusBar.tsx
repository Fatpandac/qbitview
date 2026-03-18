import { ArrowDownIcon, ArrowUpIcon, NetworkIcon } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { TransferInfo } from "./types";
import { formatBytes, formatSpeed } from "./utils";

interface StatusBarProps {
  transferInfo: TransferInfo;
}

export function StatusBar({ transferInfo }: StatusBarProps) {
  return (
    <ScrollArea className="border-t bg-muted/30 text-xs text-muted-foreground shrink-0">
      <div className="flex items-center gap-4 px-4 py-1.5 min-w-max whitespace-nowrap">
        <span className="flex items-center gap-1 whitespace-nowrap min-w-[170px]">
          <ArrowDownIcon className="size-3 text-blue-500" />
          {formatSpeed(transferInfo.dl_info_speed)}
          <span className="text-muted-foreground/60 ml-1">
            ({formatBytes(transferInfo.dl_info_data)} total)
          </span>
        </span>
        <span className="flex items-center gap-1 whitespace-nowrap min-w-[170px]">
          <ArrowUpIcon className="size-3 text-green-500" />
          {formatSpeed(transferInfo.up_info_speed)}
          <span className="text-muted-foreground/60 ml-1">
            ({formatBytes(transferInfo.up_info_data)} total)
          </span>
        </span>
        <span className="flex items-center gap-1 whitespace-nowrap min-w-[100px]">
          <NetworkIcon className="size-3" />
          DHT: {transferInfo.dht_nodes} nodes
        </span>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
