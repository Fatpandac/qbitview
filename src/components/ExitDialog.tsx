import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
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

type RememberableAction = Exclude<CloseAction, "ask">;

function performAction(action: RememberableAction) {
  invoke(action === "exit" ? "exit_app" : "hide_main_window").catch(console.error);
}

export function ExitDialog() {
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
    performAction(action);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Close qbitview</DialogTitle>
          <DialogDescription>
            Quit the app or keep it running in the background?
          </DialogDescription>
        </DialogHeader>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={remember}
            onChange={(e) => setRemember(e.currentTarget.checked)}
          />
          Remember my choice (can be changed in Settings)
        </label>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleChoice("minimize")}>
            Run in background
          </Button>
          <Button onClick={() => handleChoice("exit")}>Quit application</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
