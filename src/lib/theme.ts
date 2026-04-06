export type ThemeMode = "light" | "dark" | "system";

const THEME_STORAGE_KEY = "theme-mode";

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

function getSystemTheme(): Exclude<ThemeMode, "system"> {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(mode: ThemeMode): Exclude<ThemeMode, "system"> {
  if (mode === "system") return getSystemTheme();
  return mode;
}

async function syncTauriWindowBackground(nextTheme: Exclude<ThemeMode, "system">) {
  if (typeof window === "undefined") return;
  try {
    const mod = await import("@tauri-apps/api/window");
    const currentWindow = mod.getCurrentWindow();
    await currentWindow.setBackgroundColor(nextTheme === "dark" ? "#252525" : "#ffffff");
  } catch {
    // Ignore when running outside Tauri (e.g. browser tests/dev server).
  }
}

export function getThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeMode(stored) ? stored : "system";
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const next = resolveTheme(mode);
  document.documentElement.classList.toggle("dark", next === "dark");
  void syncTauriWindowBackground(next);
}

export function saveThemeMode(mode: ThemeMode) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  }
}

export function setThemeMode(mode: ThemeMode) {
  saveThemeMode(mode);
  applyTheme(mode);
}

export function initTheme() {
  const applyCurrent = () => applyTheme(getThemeMode());
  applyCurrent();

  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (getThemeMode() === "system") {
      applyCurrent();
    }
  };
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
