import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ArrowLeftIcon, SaveIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import router from "@/router";
import { cn } from "@/lib/utils";

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

function mapPreferencesToForm(prefs: PreferencesPayload): SettingsForm {
  return {
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

function Settings() {
  const [form, setForm] = useState<SettingsForm>(emptyForm);
  const [initial, setInitial] = useState<SettingsForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initial), [form, initial]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setMessage(null);
    invoke<PreferencesPayload>("get_preferences")
      .then((prefs) => {
        if (!active) return;
        const next = mapPreferencesToForm(prefs);
        setForm(next);
        setInitial(next);
      })
      .catch((err) => {
        if (!active) return;
        setMessage(`Failed to load settings: ${err}`);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const active = document.activeElement;
      if (!active || active === document.body) {
        event.preventDefault();
        router.navigate("/main");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function update<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const payload = buildPreferencesPayload(form);
      await invoke("set_preferences", { preferences: payload });
      setInitial(form);
      setMessage("Saved");
    } catch (err) {
      setMessage(`Save failed: ${err}`);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm(initial);
    setMessage(null);
  }

  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <header
          data-tauri-drag-region
          className="flex items-center gap-3 px-4 border-b shrink-0"
          style={{
            height: "calc(52px + env(safe-area-inset-top))",
            paddingTop: "env(safe-area-inset-top)",
            paddingLeft: "76px",
          }}
        >
          <Button size="sm" variant="ghost" onClick={() => router.navigate("/main")}>
            <ArrowLeftIcon className="size-4" />
            Back
          </Button>
          <h1 className="text-sm font-semibold">Settings</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleReset} disabled={!isDirty || loading || saving}>
              <RotateCcwIcon className="size-4" />
              Reset
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!isDirty || loading || saving}>
              <SaveIcon className="size-4" />
              Save
            </Button>
          </div>
        </header>

        <ScrollArea className="flex-1 min-h-0">
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
            {message && (
              <div className={cn(
                "rounded-md border px-3 py-2 text-sm",
                message.includes("失败") ? "border-destructive/40 text-destructive" : "border-primary/30 text-primary",
              )}>
                {message}
              </div>
            )}

            <section className="rounded-lg border bg-card">
              <div className="border-b px-4 py-3">
                <h2 className="text-sm font-semibold">Paths</h2>
                <p className="text-xs text-muted-foreground">Download and temporary storage</p>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="savePath" className="text-sm font-medium">Save path</label>
                  <Input
                    id="savePath"
                    value={form.savePath}
                    onChange={(e) => update("savePath", e.currentTarget.value)}
                    placeholder="e.g. /downloads"
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
                  <label htmlFor="tempPathEnabled" className="text-sm">Enable temporary path</label>
                </div>

                <div className="space-y-2">
                  <label htmlFor="tempPath" className="text-sm font-medium">Temporary path</label>
                  <Input
                    id="tempPath"
                    value={form.tempPath}
                    onChange={(e) => update("tempPath", e.currentTarget.value)}
                    placeholder="e.g. /tmp"
                    disabled={loading || !form.tempPathEnabled}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-lg border bg-card">
              <div className="border-b px-4 py-3">
                <h2 className="text-sm font-semibold">Connectivity</h2>
                <p className="text-xs text-muted-foreground">Ports and connection behavior</p>
              </div>
              <div className="p-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="listenPort" className="text-sm font-medium">Listen port</label>
                  <Input
                    id="listenPort"
                    type="number"
                    inputMode="numeric"
                    value={form.listenPort}
                    onChange={(e) => update("listenPort", e.currentTarget.value)}
                    placeholder="e.g. 6881"
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
                  <label htmlFor="randomPort" className="text-sm">Randomize port on start</label>
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
                  <label htmlFor="upnp" className="text-sm">Enable UPnP / NAT-PMP</label>
                </div>
              </div>
            </section>

            <section className="rounded-lg border bg-card">
              <div className="border-b px-4 py-3">
                <h2 className="text-sm font-semibold">Speed and Queue</h2>
                <p className="text-xs text-muted-foreground">Global limits and active tasks</p>
              </div>
              <div className="p-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="downloadLimit" className="text-sm font-medium">Download limit (KiB/s)</label>
                  <Input
                    id="downloadLimit"
                    type="number"
                    inputMode="numeric"
                    value={form.downloadLimit}
                    onChange={(e) => update("downloadLimit", e.currentTarget.value)}
                    placeholder="0 means unlimited"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="uploadLimit" className="text-sm font-medium">Upload limit (KiB/s)</label>
                  <Input
                    id="uploadLimit"
                    type="number"
                    inputMode="numeric"
                    value={form.uploadLimit}
                    onChange={(e) => update("uploadLimit", e.currentTarget.value)}
                    placeholder="0 means unlimited"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="maxActiveDownloads" className="text-sm font-medium">Max active downloads</label>
                  <Input
                    id="maxActiveDownloads"
                    type="number"
                    inputMode="numeric"
                    value={form.maxActiveDownloads}
                    onChange={(e) => update("maxActiveDownloads", e.currentTarget.value)}
                    placeholder="e.g. 3"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="maxActiveUploads" className="text-sm font-medium">Max active uploads</label>
                  <Input
                    id="maxActiveUploads"
                    type="number"
                    inputMode="numeric"
                    value={form.maxActiveUploads}
                    onChange={(e) => update("maxActiveUploads", e.currentTarget.value)}
                    placeholder="e.g. 2"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="maxActiveTorrents" className="text-sm font-medium">Max active torrents</label>
                  <Input
                    id="maxActiveTorrents"
                    type="number"
                    inputMode="numeric"
                    value={form.maxActiveTorrents}
                    onChange={(e) => update("maxActiveTorrents", e.currentTarget.value)}
                    placeholder="e.g. 4"
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
                  <label htmlFor="startPaused" className="text-sm">Start torrents paused</label>
                </div>
              </div>
            </section>

            <section className="rounded-lg border bg-card">
              <div className="border-b px-4 py-3">
                <h2 className="text-sm font-semibold">Connections and Slots</h2>
                <p className="text-xs text-muted-foreground">Connection and upload slot limits</p>
              </div>
              <div className="p-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="maxConnections" className="text-sm font-medium">Max connections</label>
                  <Input
                    id="maxConnections"
                    type="number"
                    inputMode="numeric"
                    value={form.maxConnections}
                    onChange={(e) => update("maxConnections", e.currentTarget.value)}
                    placeholder="e.g. 500"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="maxConnectionsPerTorrent" className="text-sm font-medium">Max connections per torrent</label>
                  <Input
                    id="maxConnectionsPerTorrent"
                    type="number"
                    inputMode="numeric"
                    value={form.maxConnectionsPerTorrent}
                    onChange={(e) => update("maxConnectionsPerTorrent", e.currentTarget.value)}
                    placeholder="e.g. 50"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="maxUploads" className="text-sm font-medium">Max upload slots</label>
                  <Input
                    id="maxUploads"
                    type="number"
                    inputMode="numeric"
                    value={form.maxUploads}
                    onChange={(e) => update("maxUploads", e.currentTarget.value)}
                    placeholder="e.g. 20"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="maxUploadsPerTorrent" className="text-sm font-medium">Max upload slots per torrent</label>
                  <Input
                    id="maxUploadsPerTorrent"
                    type="number"
                    inputMode="numeric"
                    value={form.maxUploadsPerTorrent}
                    onChange={(e) => update("maxUploadsPerTorrent", e.currentTarget.value)}
                    placeholder="e.g. 10"
                    disabled={loading}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-lg border bg-card">
              <div className="border-b px-4 py-3">
                <h2 className="text-sm font-semibold">BitTorrent</h2>
                <p className="text-xs text-muted-foreground">Protocol and privacy</p>
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
                  <label htmlFor="dht" className="text-sm">Enable DHT</label>
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
                  <label htmlFor="pex" className="text-sm">Enable PeX</label>
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
                  <label htmlFor="lsd" className="text-sm">Enable Local Discovery (LSD)</label>
                </div>

                <div className="space-y-2">
                  <label htmlFor="encryption" className="text-sm font-medium">Encryption mode</label>
                  <select
                    id="encryption"
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                    value={form.encryption}
                    onChange={(e) => update("encryption", e.currentTarget.value)}
                    disabled={loading}
                  >
                    <option value="0">Prefer</option>
                    <option value="1">Force</option>
                    <option value="2">Disable</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="rounded-lg border bg-card">
              <div className="border-b px-4 py-3">
                <h2 className="text-sm font-semibold">Seeding</h2>
                <p className="text-xs text-muted-foreground">Stop seeding after conditions are met</p>
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
                  <label htmlFor="maxRatioEnabled" className="text-sm">Enable ratio limit</label>
                </div>

                <div className="space-y-2">
                  <label htmlFor="maxRatio" className="text-sm font-medium">Maximum ratio</label>
                  <Input
                    id="maxRatio"
                    type="number"
                    inputMode="decimal"
                    value={form.maxRatio}
                    onChange={(e) => update("maxRatio", e.currentTarget.value)}
                    placeholder="e.g. 2.0"
                    disabled={loading || !form.maxRatioEnabled}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="maxRatioAct" className="text-sm font-medium">Action on ratio hit</label>
                  <select
                    id="maxRatioAct"
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                    value={form.maxRatioAct}
                    onChange={(e) => update("maxRatioAct", e.currentTarget.value)}
                    disabled={loading || !form.maxRatioEnabled}
                  >
                    <option value="0">Stop</option>
                    <option value="1">Pause</option>
                    <option value="2">Remove</option>
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
                  <label htmlFor="maxSeedingTimeEnabled" className="text-sm">Enable seeding time limit</label>
                </div>

                <div className="space-y-2">
                  <label htmlFor="maxSeedingTime" className="text-sm font-medium">Seeding time (minutes)</label>
                  <Input
                    id="maxSeedingTime"
                    type="number"
                    inputMode="numeric"
                    value={form.maxSeedingTime}
                    onChange={(e) => update("maxSeedingTime", e.currentTarget.value)}
                    placeholder="e.g. 60"
                    disabled={loading || !form.maxSeedingTimeEnabled}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-lg border bg-card">
              <div className="border-b px-4 py-3">
                <h2 className="text-sm font-semibold">Disk</h2>
                <p className="text-xs text-muted-foreground">Write behavior for downloaded files</p>
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
                  <label htmlFor="preallocateAll" className="text-sm">Pre-allocate disk space for all files</label>
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
