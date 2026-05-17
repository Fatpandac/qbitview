import { useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/language";
import useMainStore from "@/sotres/main";

type Phase = "available" | "downloading" | "done";

export function UpdateDialog() {
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
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 animate-in fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] rounded-lg bg-background p-6 shadow-lg animate-in fade-in-0 zoom-in-95">
          <Dialog.Title className="text-base font-semibold">
            {t.updateAvailable}
          </Dialog.Title>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.updateAvailableDescription(updateInfo.version)}
          </p>

          {updateInfo.body && phase === "available" && (
            <div className="mt-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">{t.updateNotes}</p>
              <pre className="max-h-32 overflow-y-auto rounded bg-muted p-2 text-xs whitespace-pre-wrap">
                {updateInfo.body}
              </pre>
            </div>
          )}

          {phase === "downloading" && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">{t.downloadProgress(progress)}</p>
              <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {phase === "done" && (
            <p className="mt-4 text-sm text-muted-foreground">{t.readyToRestart}</p>
          )}

          <div className="mt-5 flex justify-end gap-2">
            {phase === "available" && (
              <>
                <Button variant="outline" onClick={() => setUpdateInfo(null)}>{t.remindLater}</Button>
                <Button onClick={install}>{t.installUpdate}</Button>
              </>
            )}
            {phase === "done" && (
              <Button onClick={() => relaunch()}>{t.restartNow}</Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
