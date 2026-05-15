import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { invokeHost } from "@/native/host-client";
import { ArrowLeftIcon, SaveIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isMacOS } from "@/lib/platform";
import { cn } from "@/lib/utils";
import { useBlocker, useLocation, useNavigate } from "react-router";
import { CommandPalette } from "@/components/CommandPalette";
import { parseSettingsTargetFromSearch } from "@/components/command-palette.utils";
import { applyTheme, getThemeMode, setThemeMode, type ThemeMode } from "@/lib/theme";
import { getCloseAction, setCloseAction, type CloseAction } from "@/lib/close-action";
import { applyLanguage, getLanguage, setLanguage, settingsI18n, useLanguage, type Language } from "@/lib/language";

interface PreferencesPayload {
  save_path?: string;
  temp_path_enabled?: boolean;
  temp_path?: string;
  start_paused_enabled?: boolean;
  preallocate_all?: boolean;
  max_active_downloads?: number;
  max_active_uploads?: number;
  max_active_torrents?: number;
  max_connec?: number;
  max_connec_per_torrent?: number;
  max_uploads?: number;
  max_uploads_per_torrent?: number;
  dl_limit?: number;
  up_limit?: number;
  listen_port?: number;
  random_port?: boolean;
  upnp?: boolean;
  dht?: boolean;
  pex?: boolean;
  lsd?: boolean;
  encryption?: number;
  max_ratio_enabled?: boolean;
  max_ratio?: number;
  max_ratio_act?: number;
  max_seeding_time_enabled?: boolean;
  max_seeding_time?: number;
}

type SettingsForm = {
  theme: ThemeMode;
  language: Language;
  closeAction: CloseAction;
  savePath: string;
  tempPathEnabled: boolean;
  tempPath: string;
  startPaused: boolean;
  preallocateAll: boolean;
  maxActiveDownloads: string;
  maxActiveUploads: string;
  maxActiveTorrents: string;
  maxConnections: string;
  maxConnectionsPerTorrent: string;
  maxUploads: string;
  maxUploadsPerTorrent: string;
  downloadLimit: string;
  uploadLimit: string;
  listenPort: string;
  randomPort: boolean;
  upnp: boolean;
  dht: boolean;
  pex: boolean;
  lsd: boolean;
  encryption: string;
  maxRatioEnabled: boolean;
  maxRatio: string;
  maxRatioAct: string;
  maxSeedingTimeEnabled: boolean;
  maxSeedingTime: string;
};

const emptyForm: SettingsForm = {
  theme: "system",
  language: "en",
  closeAction: "ask",
  savePath: "",
  tempPathEnabled: false,
  tempPath: "",
  startPaused: false,
  preallocateAll: false,
  maxActiveDownloads: "",
  maxActiveUploads: "",
  maxActiveTorrents: "",
  maxConnections: "",
  maxConnectionsPerTorrent: "",
  maxUploads: "",
  maxUploadsPerTorrent: "",
  downloadLimit: "",
  uploadLimit: "",
  listenPort: "",
  randomPort: false,
  upnp: false,
  dht: true,
  pex: true,
  lsd: true,
  encryption: "0",
  maxRatioEnabled: false,
  maxRatio: "",
  maxRatioAct: "0",
  maxSeedingTimeEnabled: false,
  maxSeedingTime: "",
};

function toNumString(value?: number | null) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function toBool(value?: boolean | null, fallback = false) {
  if (value === null || value === undefined) return fallback;
  return value;
}

function parseNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function mapPreferencesToForm(
  prefs: PreferencesPayload,
  theme: ThemeMode,
  language: Language,
  closeAction: CloseAction,
): SettingsForm {
  return {
    theme,
    language,
    closeAction,
    savePath: prefs.save_path ?? "",
    tempPathEnabled: toBool(prefs.temp_path_enabled, false),
    tempPath: prefs.temp_path ?? "",
    startPaused: toBool(prefs.start_paused_enabled, false),
    preallocateAll: toBool(prefs.preallocate_all, false),
    maxActiveDownloads: toNumString(prefs.max_active_downloads ?? null),
    maxActiveUploads: toNumString(prefs.max_active_uploads ?? null),
    maxActiveTorrents: toNumString(prefs.max_active_torrents ?? null),
    maxConnections: toNumString(prefs.max_connec ?? null),
    maxConnectionsPerTorrent: toNumString(prefs.max_connec_per_torrent ?? null),
    maxUploads: toNumString(prefs.max_uploads ?? null),
    maxUploadsPerTorrent: toNumString(prefs.max_uploads_per_torrent ?? null),
    downloadLimit: toNumString(prefs.dl_limit ?? null),
    uploadLimit: toNumString(prefs.up_limit ?? null),
    listenPort: toNumString(prefs.listen_port ?? null),
    randomPort: toBool(prefs.random_port, false),
    upnp: toBool(prefs.upnp, false),
    dht: toBool(prefs.dht, true),
    pex: toBool(prefs.pex, true),
    lsd: toBool(prefs.lsd, true),
    encryption: prefs.encryption === undefined || prefs.encryption === null ? "0" : String(prefs.encryption),
    maxRatioEnabled: toBool(prefs.max_ratio_enabled, false),
    maxRatio: prefs.max_ratio === undefined || prefs.max_ratio === null ? "" : String(prefs.max_ratio),
    maxRatioAct: prefs.max_ratio_act === undefined || prefs.max_ratio_act === null ? "0" : String(prefs.max_ratio_act),
    maxSeedingTimeEnabled: toBool(prefs.max_seeding_time_enabled, false),
    maxSeedingTime: toNumString(prefs.max_seeding_time ?? null),
  };
}

function buildPreferencesPayload(form: SettingsForm): PreferencesPayload {
  return {
    save_path: form.savePath.trim() || undefined,
    temp_path_enabled: form.tempPathEnabled,
    temp_path: form.tempPathEnabled ? (form.tempPath.trim() || undefined) : undefined,
    start_paused_enabled: form.startPaused,
    preallocate_all: form.preallocateAll,
    max_active_downloads: parseNumber(form.maxActiveDownloads),
    max_active_uploads: parseNumber(form.maxActiveUploads),
    max_active_torrents: parseNumber(form.maxActiveTorrents),
    max_connec: parseNumber(form.maxConnections),
    max_connec_per_torrent: parseNumber(form.maxConnectionsPerTorrent),
    max_uploads: parseNumber(form.maxUploads),
    max_uploads_per_torrent: parseNumber(form.maxUploadsPerTorrent),
    dl_limit: parseNumber(form.downloadLimit),
    up_limit: parseNumber(form.uploadLimit),
    listen_port: parseNumber(form.listenPort),
    random_port: form.randomPort,
    upnp: form.upnp,
    dht: form.dht,
    pex: form.pex,
    lsd: form.lsd,
    encryption: parseNumber(form.encryption),
    max_ratio_enabled: form.maxRatioEnabled,
    max_ratio: form.maxRatioEnabled ? parseNumber(form.maxRatio) : undefined,
    max_ratio_act: form.maxRatioEnabled ? parseNumber(form.maxRatioAct) : undefined,
    max_seeding_time_enabled: form.maxSeedingTimeEnabled,
    max_seeding_time: form.maxSeedingTimeEnabled ? parseNumber(form.maxSeedingTime) : undefined,
  };
}

function hasUnsavedChanges(current: SettingsForm, base: SettingsForm) {
  return JSON.stringify(current) !== JSON.stringify(base);
}

function Settings() {
  const headerLeftPadding = isMacOS() ? "76px" : "16px";
  const currentLanguage = useLanguage();
  const t = settingsI18n[currentLanguage];
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState<SettingsForm>(emptyForm);
  const [initial, setInitial] = useState<SettingsForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [exitPromptOpen, setExitPromptOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<SettingsForm>(emptyForm);
  const initialRef = useRef<SettingsForm>(emptyForm);
  const returnTo =
    typeof location.state === "object" &&
    location.state !== null &&
    "paletteFrom" in location.state &&
    typeof location.state.paletteFrom === "string"
      ? location.state.paletteFrom
      : "/main";

  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);
  const isPreferencesDirty = useMemo(
    () => JSON.stringify(buildPreferencesPayload(form)) !== JSON.stringify(buildPreferencesPayload(initial)),
    [form, initial],
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setMessage(null);
    invokeHost<PreferencesPayload>("get_preferences")
      .then((prefs) => {
        if (!active) return;
        const next = mapPreferencesToForm(prefs, getThemeMode(), getLanguage(), getCloseAction());
        formRef.current = next;
        initialRef.current = next;
        setForm(next);
        setInitial(next);
      })
      .catch((err) => {
        if (!active) return;
        setMessage(`${settingsI18n[getLanguage()].loadFailed}: ${err}`);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const targetId = parseSettingsTargetFromSearch(location.search);
    if (!targetId) return;
    const timer = window.setTimeout(() => {
      const root = scrollAreaRef.current;
      const viewport = root?.querySelector<HTMLElement>("[data-slot=\"scroll-area-viewport\"]");
      const element = document.getElementById(targetId);
      if (!viewport || !element) return;
      const viewportRect = viewport.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const nextTop = viewport.scrollTop + elementRect.top - viewportRect.top - 24;
      viewport.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
      element.focus?.();
    }, 50);
    return () => window.clearTimeout(timer);
  }, [location.search, loading]);

  function update<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    const next = { ...formRef.current, [key]: value } as SettingsForm;
    formRef.current = next;
    setForm(next);
  }

  function updateTheme(value: ThemeMode) {
    update("theme", value);
    applyTheme(value);
  }

  function updateLanguage(value: Language) {
    update("language", value);
    applyLanguage(value);
  }

  const saveChanges = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      if (isPreferencesDirty) {
        const payload = buildPreferencesPayload(form);
        await invokeHost("set_preferences", { preferences: payload });
      }
      setThemeMode(form.theme);
      setLanguage(form.language);
      setCloseAction(form.closeAction);
      formRef.current = form;
      initialRef.current = form;
      setInitial(form);
      setMessage(settingsI18n[form.language].saved);
      return true;
    } catch (err) {
      setMessage(`${t.saveFailed}: ${err}`);
      return false;
    } finally {
      setSaving(false);
    }
  }, [form, isPreferencesDirty, t.saveFailed]);

  const blocker = useBlocker(
    useCallback(
      () => hasUnsavedChanges(formRef.current, initialRef.current),
      [],
    ),
  );

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    setExitPromptOpen(true);
  }, [blocker.state]);

  async function handleExitSaveAndLeave() {
    const saved = await saveChanges();
    if (!saved) {
      setExitPromptOpen(false);
      blocker.reset?.();
      return;
    }
    setExitPromptOpen(false);
    blocker.proceed?.();
  }

  function handleExitDiscardAndLeave() {
    applyTheme(initialRef.current.theme);
    applyLanguage(initialRef.current.language);
    setExitPromptOpen(false);
    blocker.proceed?.();
  }

  function handleExitPromptOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setExitPromptOpen(true);
      return;
    }
    if (blocker.state === "blocked") {
      blocker.reset?.();
    }
    setExitPromptOpen(false);
  }

  useEffect(() => {
    if (!exitPromptOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      handleExitPromptOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown, { capture: true });
    };
  }, [exitPromptOpen, blocker.state]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (exitPromptOpen) return;
      event.preventDefault();
      navigate(returnTo);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [exitPromptOpen, navigate, returnTo]);

  async function handleSave() {
    await saveChanges();
  }

  function handleReset() {
    formRef.current = initialRef.current;
    setForm(initial);
    applyTheme(initial.theme);
    applyLanguage(initial.language);
    setMessage(null);
  }

  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
      <CommandPalette />
      <Dialog open={exitPromptOpen} onOpenChange={handleExitPromptOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.unsavedTitle}</DialogTitle>
            <DialogDescription>
              {t.unsavedDescription}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleExitDiscardAndLeave} disabled={saving}>
              {t.discardAndLeave}
            </Button>
            <Button onClick={() => void handleExitSaveAndLeave()} disabled={saving}>
              {t.saveAndLeave}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <header
          data-tauri-drag-region
          className="flex items-center gap-3 px-4 border-b shrink-0"
          style={{
            height: "calc(52px + env(safe-area-inset-top))",
            paddingTop: "env(safe-area-inset-top)",
            paddingLeft: headerLeftPadding,
          }}
        >
          <Button size="sm" variant="ghost" onClick={() => navigate(returnTo)}>
            <ArrowLeftIcon className="size-4" />
            {t.back}
          </Button>
          <h1 className="text-sm font-semibold">{t.settings}</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleReset} disabled={!isDirty || loading || saving}>
              <RotateCcwIcon className="size-4" />
              {t.reset}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!isDirty || loading || saving}>
              <SaveIcon className="size-4" />
              {t.save}
            </Button>
          </div>
        </header>

        <ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0">
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
            {message && (
              <div className={cn(
                "rounded-md border px-3 py-2 text-sm",
                message.includes("failed") || message.includes("失败") ? "border-destructive/40 text-destructive" : "border-primary/30 text-primary",
              )}>
                {message}
              </div>
            )}

            <section className="rounded-lg border bg-card">
              <div className="border-b px-4 py-3">
                <h2 className="text-sm font-semibold">{t.appearance}</h2>
                <p className="text-xs text-muted-foreground">{t.appearanceDescription}</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t.theme}</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <label htmlFor="theme-light" className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      <input
                        id="theme-light"
                        type="radio"
                        name="theme"
                        className="size-4 accent-primary"
                        checked={form.theme === "light"}
                        onChange={() => updateTheme("light")}
                        disabled={loading}
                      />
                      {t.light}
                    </label>
                    <label htmlFor="theme-dark" className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      <input
                        id="theme-dark"
                        type="radio"
                        name="theme"
                        className="size-4 accent-primary"
                        checked={form.theme === "dark"}
                        onChange={() => updateTheme("dark")}
                        disabled={loading}
                      />
                      {t.dark}
                    </label>
                    <label htmlFor="theme-system" className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      <input
                        id="theme-system"
                        type="radio"
                        name="theme"
                        className="size-4 accent-primary"
                        checked={form.theme === "system"}
                        onChange={() => updateTheme("system")}
                        disabled={loading}
                      />
                      {t.system}
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t.language}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label htmlFor="language-en" className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      <input
                        id="language-en"
                        type="radio"
                        name="language"
                        className="size-4 accent-primary"
                        checked={form.language === "en"}
                        onChange={() => updateLanguage("en")}
                        disabled={loading}
                      />
                      {t.english}
                    </label>
                    <label htmlFor="language-zh-CN" className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      <input
                        id="language-zh-CN"
                        type="radio"
                        name="language"
                        className="size-4 accent-primary"
                        checked={form.language === "zh-CN"}
                        onChange={() => updateLanguage("zh-CN")}
                        disabled={loading}
                      />
                      {t.chinese}
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border bg-card">
              <div className="border-b px-4 py-3">
                <h2 className="text-sm font-semibold">{t.closeBehavior}</h2>
                <p className="text-xs text-muted-foreground">{t.closeBehaviorDescription}</p>
              </div>
              <div className="p-4">
                <div id="closeAction" tabIndex={-1} className="space-y-2 outline-none">
                  <p className="text-sm font-medium">{t.onClose}</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <label htmlFor="closeAction-ask" className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      <input
                        id="closeAction-ask"
                        type="radio"
                        name="closeAction"
                        className="size-4 accent-primary"
                        checked={form.closeAction === "ask"}
                        onChange={() => update("closeAction", "ask")}
                        disabled={loading}
                      />
                      {t.askEveryTime}
                    </label>
                    <label htmlFor="closeAction-exit" className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      <input
                        id="closeAction-exit"
                        type="radio"
                        name="closeAction"
                        className="size-4 accent-primary"
                        checked={form.closeAction === "exit"}
                        onChange={() => update("closeAction", "exit")}
                        disabled={loading}
                      />
                      {t.quitApplication}
                    </label>
                    <label htmlFor="closeAction-minimize" className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      <input
                        id="closeAction-minimize"
                        type="radio"
                        name="closeAction"
                        className="size-4 accent-primary"
                        checked={form.closeAction === "minimize"}
                        onChange={() => update("closeAction", "minimize")}
                        disabled={loading}
                      />
                      {t.runInBackground}
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border bg-card">
              <div className="border-b px-4 py-3">
                <h2 className="text-sm font-semibold">{t.paths}</h2>
                <p className="text-xs text-muted-foreground">{t.pathsDescription}</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="savePath" className="text-sm font-medium">{t.savePath}</label>
                  <Input
                    id="savePath"
                    value={form.savePath}
                    onChange={(e) => update("savePath", e.currentTarget.value)}
                    placeholder={t.savePathPlaceholder}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="tempPathEnabled"
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={form.tempPathEnabled}
                    onChange={(e) => update("tempPathEnabled", e.currentTarget.checked)}
                    disabled={loading}
                  />
                  <label htmlFor="tempPathEnabled" className="text-sm">{t.enableTemporaryPath}</label>
                </div>

                <div className="space-y-2">
                  <label htmlFor="tempPath" className="text-sm font-medium">{t.temporaryPath}</label>
                  <Input
                    id="tempPath"
                    value={form.tempPath}
                    onChange={(e) => update("tempPath", e.currentTarget.value)}
                    placeholder={t.tempPathPlaceholder}
                    disabled={loading || !form.tempPathEnabled}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-lg border bg-card">
              <div className="border-b px-4 py-3">
                <h2 className="text-sm font-semibold">{t.connectivity}</h2>
                <p className="text-xs text-muted-foreground">{t.connectivityDescription}</p>
              </div>
              <div className="p-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="listenPort" className="text-sm font-medium">{t.listenPort}</label>
                  <Input
                    id="listenPort"
                    type="number"
                    inputMode="numeric"
                    value={form.listenPort}
                    onChange={(e) => update("listenPort", e.currentTarget.value)}
                    placeholder={t.listenPortPlaceholder}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="randomPort"
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={form.randomPort}
                    onChange={(e) => update("randomPort", e.currentTarget.checked)}
                    disabled={loading}
                  />
                  <label htmlFor="randomPort" className="text-sm">{t.randomizePort}</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="upnp"
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={form.upnp}
                    onChange={(e) => update("upnp", e.currentTarget.checked)}
                    disabled={loading}
                  />
                  <label htmlFor="upnp" className="text-sm">{t.enableUpnp}</label>
                </div>
              </div>
            </section>

            <section className="rounded-lg border bg-card">
              <div className="border-b px-4 py-3">
                <h2 className="text-sm font-semibold">{t.speedQueue}</h2>
                <p className="text-xs text-muted-foreground">{t.speedQueueDescription}</p>
              </div>
              <div className="p-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="downloadLimit" className="text-sm font-medium">{t.downloadLimit}</label>
                  <Input
                    id="downloadLimit"
                    type="number"
                    inputMode="numeric"
                    value={form.downloadLimit}
                    onChange={(e) => update("downloadLimit", e.currentTarget.value)}
                    placeholder={t.unlimitedPlaceholder}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="uploadLimit" className="text-sm font-medium">{t.uploadLimit}</label>
                  <Input
                    id="uploadLimit"
                    type="number"
                    inputMode="numeric"
                    value={form.uploadLimit}
                    onChange={(e) => update("uploadLimit", e.currentTarget.value)}
                    placeholder={t.unlimitedPlaceholder}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="maxActiveDownloads" className="text-sm font-medium">{t.maxActiveDownloads}</label>
                  <Input
                    id="maxActiveDownloads"
                    type="number"
                    inputMode="numeric"
                    value={form.maxActiveDownloads}
                    onChange={(e) => update("maxActiveDownloads", e.currentTarget.value)}
                    placeholder={t.maxActiveDownloadsPlaceholder}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="maxActiveUploads" className="text-sm font-medium">{t.maxActiveUploads}</label>
                  <Input
                    id="maxActiveUploads"
                    type="number"
                    inputMode="numeric"
                    value={form.maxActiveUploads}
                    onChange={(e) => update("maxActiveUploads", e.currentTarget.value)}
                    placeholder={t.maxActiveUploadsPlaceholder}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="maxActiveTorrents" className="text-sm font-medium">{t.maxActiveTorrents}</label>
                  <Input
                    id="maxActiveTorrents"
                    type="number"
                    inputMode="numeric"
                    value={form.maxActiveTorrents}
                    onChange={(e) => update("maxActiveTorrents", e.currentTarget.value)}
                    placeholder={t.maxActiveTorrentsPlaceholder}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="startPaused"
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={form.startPaused}
                    onChange={(e) => update("startPaused", e.currentTarget.checked)}
                    disabled={loading}
                  />
                  <label htmlFor="startPaused" className="text-sm">{t.startPaused}</label>
                </div>
              </div>
            </section>

            <section className="rounded-lg border bg-card">
              <div className="border-b px-4 py-3">
                <h2 className="text-sm font-semibold">{t.connectionsSlots}</h2>
                <p className="text-xs text-muted-foreground">{t.connectionsSlotsDescription}</p>
              </div>
              <div className="p-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="maxConnections" className="text-sm font-medium">{t.maxConnections}</label>
                  <Input
                    id="maxConnections"
                    type="number"
                    inputMode="numeric"
                    value={form.maxConnections}
                    onChange={(e) => update("maxConnections", e.currentTarget.value)}
                    placeholder={t.maxConnectionsPlaceholder}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="maxConnectionsPerTorrent" className="text-sm font-medium">{t.maxConnectionsPerTorrent}</label>
                  <Input
                    id="maxConnectionsPerTorrent"
                    type="number"
                    inputMode="numeric"
                    value={form.maxConnectionsPerTorrent}
                    onChange={(e) => update("maxConnectionsPerTorrent", e.currentTarget.value)}
                    placeholder={t.maxConnectionsPerTorrentPlaceholder}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="maxUploads" className="text-sm font-medium">{t.maxUploadSlots}</label>
                  <Input
                    id="maxUploads"
                    type="number"
                    inputMode="numeric"
                    value={form.maxUploads}
                    onChange={(e) => update("maxUploads", e.currentTarget.value)}
                    placeholder={t.maxUploadSlotsPlaceholder}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="maxUploadsPerTorrent" className="text-sm font-medium">{t.maxUploadSlotsPerTorrent}</label>
                  <Input
                    id="maxUploadsPerTorrent"
                    type="number"
                    inputMode="numeric"
                    value={form.maxUploadsPerTorrent}
                    onChange={(e) => update("maxUploadsPerTorrent", e.currentTarget.value)}
                    placeholder={t.maxUploadSlotsPerTorrentPlaceholder}
                    disabled={loading}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-lg border bg-card">
              <div className="border-b px-4 py-3">
                <h2 className="text-sm font-semibold">{t.bittorrent}</h2>
                <p className="text-xs text-muted-foreground">{t.bittorrentDescription}</p>
              </div>
              <div className="p-4 grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <input
                    id="dht"
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={form.dht}
                    onChange={(e) => update("dht", e.currentTarget.checked)}
                    disabled={loading}
                  />
                  <label htmlFor="dht" className="text-sm">{t.enableDht}</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="pex"
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={form.pex}
                    onChange={(e) => update("pex", e.currentTarget.checked)}
                    disabled={loading}
                  />
                  <label htmlFor="pex" className="text-sm">{t.enablePex}</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="lsd"
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={form.lsd}
                    onChange={(e) => update("lsd", e.currentTarget.checked)}
                    disabled={loading}
                  />
                  <label htmlFor="lsd" className="text-sm">{t.enableLsd}</label>
                </div>

                <div className="space-y-2">
                  <label htmlFor="encryption" className="text-sm font-medium">{t.encryptionMode}</label>
                  <select
                    id="encryption"
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                    value={form.encryption}
                    onChange={(e) => update("encryption", e.currentTarget.value)}
                    disabled={loading}
                  >
                    <option value="0">{t.prefer}</option>
                    <option value="1">{t.force}</option>
                    <option value="2">{t.disable}</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="rounded-lg border bg-card">
              <div className="border-b px-4 py-3">
                <h2 className="text-sm font-semibold">{t.seeding}</h2>
                <p className="text-xs text-muted-foreground">{t.seedingDescription}</p>
              </div>
              <div className="p-4 grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <input
                    id="maxRatioEnabled"
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={form.maxRatioEnabled}
                    onChange={(e) => update("maxRatioEnabled", e.currentTarget.checked)}
                    disabled={loading}
                  />
                  <label htmlFor="maxRatioEnabled" className="text-sm">{t.enableRatioLimit}</label>
                </div>

                <div className="space-y-2">
                  <label htmlFor="maxRatio" className="text-sm font-medium">{t.maximumRatio}</label>
                  <Input
                    id="maxRatio"
                    type="number"
                    inputMode="decimal"
                    value={form.maxRatio}
                    onChange={(e) => update("maxRatio", e.currentTarget.value)}
                    placeholder={t.maximumRatioPlaceholder}
                    disabled={loading || !form.maxRatioEnabled}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="maxRatioAct" className="text-sm font-medium">{t.actionOnRatioHit}</label>
                  <select
                    id="maxRatioAct"
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                    value={form.maxRatioAct}
                    onChange={(e) => update("maxRatioAct", e.currentTarget.value)}
                    disabled={loading || !form.maxRatioEnabled}
                  >
                    <option value="0">{t.stop}</option>
                    <option value="1">{t.pause}</option>
                    <option value="2">{t.remove}</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="maxSeedingTimeEnabled"
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={form.maxSeedingTimeEnabled}
                    onChange={(e) => update("maxSeedingTimeEnabled", e.currentTarget.checked)}
                    disabled={loading}
                  />
                  <label htmlFor="maxSeedingTimeEnabled" className="text-sm">{t.enableSeedingTimeLimit}</label>
                </div>

                <div className="space-y-2">
                  <label htmlFor="maxSeedingTime" className="text-sm font-medium">{t.seedingTime}</label>
                  <Input
                    id="maxSeedingTime"
                    type="number"
                    inputMode="numeric"
                    value={form.maxSeedingTime}
                    onChange={(e) => update("maxSeedingTime", e.currentTarget.value)}
                    placeholder={t.seedingTimePlaceholder}
                    disabled={loading || !form.maxSeedingTimeEnabled}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-lg border bg-card">
              <div className="border-b px-4 py-3">
                <h2 className="text-sm font-semibold">{t.disk}</h2>
                <p className="text-xs text-muted-foreground">{t.diskDescription}</p>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <input
                    id="preallocateAll"
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={form.preallocateAll}
                    onChange={(e) => update("preallocateAll", e.currentTarget.checked)}
                    disabled={loading}
                  />
                  <label htmlFor="preallocateAll" className="text-sm">{t.preallocateAll}</label>
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export default Settings;
