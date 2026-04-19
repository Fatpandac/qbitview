export type CloseAction = "ask" | "exit" | "minimize";

const CLOSE_ACTION_STORAGE_KEY = "close-action";

function isCloseAction(value: string | null): value is CloseAction {
  return value === "ask" || value === "exit" || value === "minimize";
}

export function getCloseAction(): CloseAction {
  if (typeof window === "undefined") return "ask";
  const stored = window.localStorage.getItem(CLOSE_ACTION_STORAGE_KEY);
  return isCloseAction(stored) ? stored : "ask";
}

export function setCloseAction(action: CloseAction) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLOSE_ACTION_STORAGE_KEY, action);
}
