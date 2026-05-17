import { useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { XIcon, DownloadIcon, RotateCcwIcon } from "lucide-react";
import useMainStore from "@/sotres/main";
import { useI18n } from "@/lib/language";

type Phase = "available" | "downloading" | "done";

export function UpdateBanner() {
  const t = useI18n();
  const { updateInfo, setUpdateInfo } = useMainStore();
  const [phase, setPhase] = useState<Phase>("available");
  const [progress, setProgress] = useState(0);

  if (!updateInfo) return null;

  async function install() {
    const update = await check();
    if (!update) return;
    setPhase("downloading");
    let received = 0;
    let total = 0;
    await update.downloadAndInstall((event) => {
      if (event.event === "Started") total = event.data.contentLength ?? 0;
      if (event.event === "Progress") {
        received += event.data.chunkLength;
        if (total > 0) setProgress(Math.round((received / total) * 100));
      }
    });
    setPhase("done");
  }

  return (
    <div className="mx-2 mb-2 rounded-md border bg-muted/60 p-2.5 text-xs">
      <div className="flex items-center justify-between gap-1 mb-2">
        <span className="font-medium text-foreground leading-tight">{t.updateAvailable}</span>
        {phase === "available" && (
          <button
            type="button"
            onClick={() => setUpdateInfo(null)}
            className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <XIcon className="size-3" />
          </button>
        )}
      </div>

      <p className="text-muted-foreground mb-2 leading-tight">
        {t.updateAvailableDescription(updateInfo.version)}
      </p>

      {phase === "available" && (
        <button
          type="button"
          onClick={install}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <DownloadIcon className="size-3" />
          {t.installUpdate}
        </button>
      )}

      {phase === "downloading" && (
        <div>
          <p className="text-muted-foreground mb-1">{t.downloadProgress(progress)}</p>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {phase === "done" && (
        <button
          type="button"
          onClick={() => relaunch()}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <RotateCcwIcon className="size-3" />
          {t.restartNow}
        </button>
      )}
    </div>
  );
}
