import { useEffect, useState } from "react";
import { invokeHost } from "@/native/host-client";
import { listen } from "@tauri-apps/api/event";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { getCloseAction, setCloseAction, type CloseAction } from "@/lib/close-action";
import { useI18n } from "@/lib/language";

type RememberableAction = Exclude<CloseAction, "ask">;

function performAction(action: RememberableAction) {
  invokeHost(action === "exit" ? "exit_app" : "hide_main_window").catch(console.error);
}

export function ExitDialog() {
  const t = useI18n();
  const [open, setOpen] = useState(false);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    listen("close-requested", () => {
      const action = getCloseAction();
      if (action === "ask") {
        setRemember(false);
        setOpen(true);
      } else {
        performAction(action);
      }
    })
      .then((fn) => {
        unlisten = fn;
      })
      .catch(console.error);
    return () => {
      unlisten?.();
    };
  }, []);

  function handleChoice(action: RememberableAction) {
    if (remember) setCloseAction(action);
    setOpen(false);
    // Wait for the Radix close animation (duration-200 in dialog.tsx) to finish
    // before hiding/exiting; otherwise the next reopen replays the closing animation.
    window.setTimeout(() => performAction(action), 220);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.closeQbitview}</DialogTitle>
          <DialogDescription>
            {t.closeQbitviewDescription}
          </DialogDescription>
        </DialogHeader>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={remember}
            onChange={(e) => setRemember(e.currentTarget.checked)}
          />
          {t.rememberCloseChoice}
        </label>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleChoice("minimize")}>
            {t.minimizeToTray}
          </Button>
          <Button onClick={() => handleChoice("exit")}>{t.quitApplication}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
