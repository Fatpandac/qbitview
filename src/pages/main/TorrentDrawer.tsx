import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Torrent, TorrentContent, TorrentPeer, TorrentProperty, TorrentTracker } from "./types";
import { formatBytes, formatEta, formatSpeed } from "./utils";
import { PiecesCanvas } from "./PiecesCanvas";

type Tab = "info" | "trackers" | "peers" | "webseeds" | "content";

const TABS: { id: Tab; label: string }[] = [
  { id: "info",     label: "种子信息" },
  { id: "trackers", label: "Tracker" },
  { id: "peers",    label: "连接用户" },
  { id: "webseeds", label: "HTTP 源" },
  { id: "content",  label: "内容" },
];

interface TorrentDrawerProps {
  torrent: Torrent;
  onClose: () => void;
}

/* ── helpers ── */
function formatTime(s?: number | null) {
  if (!s || s <= 0) return "—";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}
function formatDate(u?: number | null) {
  if (!u || u <= 0) return "—";
  return new Date(u * 1000).toLocaleString();
}
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium break-all">{value}</p>
    </div>
  );
}
function Empty({ msg = "No data" }: { msg?: string }) {
  return <p className="text-sm text-muted-foreground text-center py-10">{msg}</p>;
}

/* ── tab panels ── */
function InfoPanel({ property, pieces }: { property: TorrentProperty; pieces: number[] }) {
  const downloaded = pieces.filter((p) => p === 2).length;
  const downloading = pieces.filter((p) => p === 1).length;
  const pct = pieces.length > 0 ? ((downloaded / pieces.length) * 100).toFixed(1) : "0";
  return (
    <div className="space-y-5">
      {property.save_path && <InfoItem label="Save Path" value={property.save_path} />}
      {property.comment && property.comment !== "None" && (
        <InfoItem label="Comment" value={property.comment} />
      )}
      <div className="h-px bg-border" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <InfoItem label="Total Size"  value={formatBytes(property.total_size ?? undefined)} />
        <InfoItem label="Piece Size"  value={formatBytes(property.piece_size ?? undefined)} />
        <InfoItem label="Pieces"      value={`${property.pieces_have ?? 0} / ${property.pieces_num ?? 0}`} />
        <InfoItem label="Share Ratio" value={property.share_ratio?.toFixed(3) ?? "—"} />
        <InfoItem label="Seeds"       value={`${property.seeds ?? 0} / ${property.seeds_total ?? 0}`} />
        <InfoItem label="Peers"       value={`${property.peers ?? 0} / ${property.peers_total ?? 0}`} />
        <InfoItem label="Connections" value={`${property.nb_connections ?? 0} / ${property.nb_connections_limit ?? 0}`} />
        <InfoItem label="ETA"         value={formatEta(property.eta ?? undefined)} />
      </div>
      <div className="h-px bg-border" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <InfoItem label="Downloaded"   value={formatBytes(property.total_downloaded ?? undefined)} />
        <InfoItem label="Uploaded"     value={formatBytes(property.total_uploaded ?? undefined)} />
        <InfoItem label="↓ Speed"      value={formatSpeed(property.dl_speed ?? undefined)} />
        <InfoItem label="↑ Speed"      value={formatSpeed(property.up_speed ?? undefined)} />
        <InfoItem label="Avg ↓"        value={formatSpeed(property.dl_speed_avg ?? undefined)} />
        <InfoItem label="Avg ↑"        value={formatSpeed(property.up_speed_avg ?? undefined)} />
        <InfoItem label="Active Time"  value={formatTime(property.time_elapsed)} />
        <InfoItem label="Seeding Time" value={formatTime(property.seeding_time)} />
      </div>
      <div className="h-px bg-border" />
      <div className="space-y-3">
        {property.created_by && <InfoItem label="Created By" value={property.created_by} />}
        <InfoItem label="Added"     value={formatDate(property.addition_date)} />
        {(property.completion_date ?? 0) > 0 && (
          <InfoItem label="Completed" value={formatDate(property.completion_date)} />
        )}
      </div>
      {pieces.length > 0 && (
        <>
          <div className="h-px bg-border" />
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold">Pieces</p>
              <p className="text-xs text-muted-foreground">
                {downloaded.toLocaleString()} / {pieces.length.toLocaleString()} ({pct}%)
              </p>
            </div>
            <div className="flex items-center gap-3 mb-3">
              {[["bg-blue-500","Downloaded"],["bg-amber-400","Downloading"],["bg-[#374151]","Missing"]].map(([c,l]) => (
                <div key={l} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className={cn("size-2.5 rounded-sm", c)} />
                  {l}
                </div>
              ))}
            </div>
            <PiecesCanvas pieces={pieces} />
            {downloading > 0 && (
              <p className="text-xs text-amber-500 mt-2">
                {downloading.toLocaleString()} piece{downloading > 1 ? "s" : ""} downloading
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TrackersPanel({ trackers }: { trackers: TorrentTracker[] }) {
  if (!trackers.length) return <Empty msg="No trackers" />;
  return (
    <div className="space-y-2">
      {trackers.map((t, i) => (
        <div key={i} className="rounded-md border p-3 space-y-1.5 text-xs">
          <p className="font-medium text-sm break-all">{t.url || "(DHT / PeX)"}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
            <span>Status: <span className="text-foreground">{t.status}</span></span>
            {t.tier >= 0 && <span>Tier: {t.tier}</span>}
            <span>Peers: {t.num_peers}</span>
            <span>Seeds: {t.num_seeds}</span>
            <span>Downloaded: {t.num_downloaded}</span>
          </div>
          {t.msg && <p className="text-amber-500">{t.msg}</p>}
        </div>
      ))}
    </div>
  );
}

function PeersPanel({ peers }: { peers: TorrentPeer[] }) {
  if (!peers.length) return <Empty msg="No connected peers" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="text-muted-foreground border-b">
            <th className="text-left py-1.5 pr-2 font-medium">IP</th>
            <th className="text-left py-1.5 pr-2 font-medium">Client</th>
            <th className="text-right py-1.5 pr-2 font-medium">↓</th>
            <th className="text-right py-1.5 font-medium">↑</th>
            <th className="text-right py-1.5 pl-2 font-medium">Progress</th>
          </tr>
        </thead>
        <tbody>
          {peers.map((p, i) => (
            <tr key={i} className="border-b border-border/40">
              <td className="py-1.5 pr-2 font-mono">{p.ip}:{p.port}</td>
              <td className="py-1.5 pr-2 text-muted-foreground truncate max-w-[80px]">{p.client ?? "—"}</td>
              <td className="py-1.5 pr-2 text-right text-blue-500">{p.dl_speed ? formatSpeed(p.dl_speed) : "—"}</td>
              <td className="py-1.5 text-right text-green-500">{p.up_speed ? formatSpeed(p.up_speed) : "—"}</td>
              <td className="py-1.5 pl-2 text-right">{p.progress != null ? `${(p.progress * 100).toFixed(0)}%` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WebSeedsPanel({ seeds }: { seeds: string[] }) {
  if (!seeds.length) return <Empty msg="No HTTP sources" />;
  return (
    <div className="space-y-1.5">
      {seeds.map((url, i) => (
        <div key={i} className="rounded-md border px-3 py-2 text-xs font-mono break-all text-muted-foreground hover:text-foreground transition-colors">
          {url}
        </div>
      ))}
    </div>
  );
}

function ContentPanel({ contents }: { contents: TorrentContent[] }) {
  if (!contents.length) return <Empty msg="No files" />;
  return (
    <div className="space-y-1">
      {contents.map((f) => (
        <div key={f.index} className="rounded-md border p-2.5 space-y-1.5">
          <p className="text-xs font-medium break-all leading-snug">{f.name}</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-secondary rounded-full h-1 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${(f.progress * 100).toFixed(1)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {(f.progress * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatBytes(f.size)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── main drawer ── */
export function TorrentDrawer({ torrent, onClose }: TorrentDrawerProps) {
  const [tab, setTab] = useState<Tab>("info");
  const [property, setProperty] = useState<TorrentProperty | null>(null);
  const [pieces, setPieces] = useState<number[]>([]);
  const [trackers, setTrackers] = useState<TorrentTracker[]>([]);
  const [peers, setPeers] = useState<TorrentPeer[]>([]);
  const [webseeds, setWebseeds] = useState<string[]>([]);
  const [contents, setContents] = useState<TorrentContent[]>([]);
  const [loading, setLoading] = useState(true);
  const piecesIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!torrent.hash) return;
    setLoading(true);
    setProperty(null);
    setPieces([]);
    setTrackers([]);
    setPeers([]);
    setWebseeds([]);
    setContents([]);
    setTab("info");

    Promise.all([
      invoke<TorrentProperty>("get_torrent_properties", { hash: torrent.hash }),
      invoke<number[]>("get_torrent_pieces_states", { hash: torrent.hash }),
      invoke<TorrentTracker[]>("get_torrent_trackers", { hash: torrent.hash }),
      invoke<TorrentPeer[]>("get_torrent_peers", { hash: torrent.hash }),
      invoke<string[]>("get_torrent_web_seeds", { hash: torrent.hash }),
      invoke<TorrentContent[]>("get_torrent_contents", { hash: torrent.hash }),
    ])
      .then(([props, pcs, trk, prs, ws, cnt]) => {
        setProperty(props);
        setPieces(pcs);
        setTrackers(trk);
        setPeers(prs);
        setWebseeds(ws);
        setContents(cnt);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    piecesIntervalRef.current = setInterval(async () => {
      try {
        const pcs = await invoke<number[]>("get_torrent_pieces_states", { hash: torrent.hash! });
        setPieces(pcs);
        const prs = await invoke<TorrentPeer[]>("get_torrent_peers", { hash: torrent.hash! });
        setPeers(prs);
      } catch {}
    }, 3000);

    return () => {
      if (piecesIntervalRef.current) clearInterval(piecesIntervalRef.current);
    };
  }, [torrent.hash]);

  return (
    <div className="w-80 xl:w-96 shrink-0 border-l bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-4 py-3 border-b shrink-0">
        <div className="min-w-0">
          <h2 className="font-semibold text-sm leading-snug truncate" title={torrent.name ?? ""}>{torrent.name ?? "—"}</h2>
          <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">{torrent.hash}</p>
        </div>
        <button onClick={onClose} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5">
          <XIcon className="size-4" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b shrink-0 overflow-x-auto">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "shrink-0 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap",
              tab === id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-10">Loading…</p>
        ) : tab === "info" && property ? (
          <InfoPanel property={property} pieces={pieces} />
        ) : tab === "trackers" ? (
          <TrackersPanel trackers={trackers} />
        ) : tab === "peers" ? (
          <PeersPanel peers={peers} />
        ) : tab === "webseeds" ? (
          <WebSeedsPanel seeds={webseeds} />
        ) : tab === "content" ? (
          <ContentPanel contents={contents} />
        ) : (
          <Empty />
        )}
      </div>
    </div>
  );
}
