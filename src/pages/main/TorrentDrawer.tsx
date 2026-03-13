import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ChevronDownIcon, ChevronRightIcon, CopyIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Torrent, TorrentContent, TorrentPeer, TorrentProperty, TorrentTracker } from "./types";
import { formatBytes, formatEta, formatSpeed } from "./utils";
import { PiecesCanvas } from "./PiecesCanvas";

type Tab = "info" | "trackers" | "peers" | "webseeds" | "content";

const TABS: { id: Tab; label: string }[] = [
  { id: "info",     label: "Info" },
  { id: "trackers", label: "Trackers" },
  { id: "peers",    label: "Peers" },
  { id: "webseeds", label: "HTTP Sources" },
  { id: "content",  label: "Content" },
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
export function truncateMiddleByWidth(
  value: string,
  maxWidth: number,
  measure: (text: string) => number,
) {
  if (maxWidth <= 0) return value;
  if (measure(value) <= maxWidth) return value;
  const ellipsis = "...";
  if (measure(ellipsis) >= maxWidth) return ellipsis;

  let low = 1;
  let high = value.length - 1;
  let best = ellipsis;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const head = Math.floor(mid / 2);
    const tail = mid - head;
    const candidate = `${value.slice(0, head)}${ellipsis}${value.slice(-tail)}`;
    if (measure(candidate) <= maxWidth) {
      best = candidate;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return best;
}

export function scrollContentViewportToTop(root?: HTMLElement | null) {
  const viewport = root?.querySelector<HTMLElement>("[data-slot=\"scroll-area-viewport\"]");
  viewport?.scrollTo({ top: 0, behavior: "auto" });
}

function MiddleEllipsisText({
  text,
  className,
  title,
}: {
  text: string;
  className?: string;
  title?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let rafId: number | null = null;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const update = () => {
      if (!ctx) {
        setDisplay(text);
        return;
      }
      const width = el.clientWidth;
      if (width <= 0) {
        setDisplay(text);
        return;
      }
      const style = getComputedStyle(el);
      ctx.font = `${style.fontStyle} ${style.fontVariant} ${style.fontWeight} ${style.fontSize} / ${style.lineHeight} ${style.fontFamily}`;
      const next = truncateMiddleByWidth(text, width, (v) => ctx.measureText(v).width);
      setDisplay(next);
    };
    const ro = new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    });
    ro.observe(el);
    update();
    return () => {
      ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [text]);

  return (
    <span ref={ref} className={className} title={title ?? text}>
      {display}
    </span>
  );
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
    <ScrollArea className="w-full">
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
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
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
  type TreeNode = {
    name: string;
    children: Map<string, TreeNode>;
    file?: TorrentContent;
    path: string;
  };

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const root: TreeNode = { name: "", children: new Map(), path: "" };

  for (const item of contents) {
    const parts = item.name.split(/[\\/]+/).filter(Boolean);
    let node = root;
    parts.forEach((part, idx) => {
      const isFile = idx === parts.length - 1;
      if (!node.children.has(part)) {
        const path = node.path ? `${node.path}/${part}` : part;
        node.children.set(part, { name: part, children: new Map(), path });
      }
      const next = node.children.get(part)!;
      if (isFile) next.file = item;
      node = next;
    });
  }

  useEffect(() => {
    const dirs = new Set<string>();
    root.children.forEach((child) => {
      if (!child.file) dirs.add(child.path);
    });
    setExpanded(dirs);
  }, [contents]);

  const toggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const renderNode = (node: TreeNode, depth: number) => {
    const entries = Array.from(node.children.values());
    entries.sort((a, b) => {
      const aIsFile = Boolean(a.file);
      const bIsFile = Boolean(b.file);
      if (aIsFile !== bIsFile) return aIsFile ? 1 : -1;
      return a.name.localeCompare(b.name);
    });

    return entries.map((child) => {
      const isFile = Boolean(child.file);
      const key = isFile ? child.file!.index : child.path;
      const isOpen = isFile ? true : expanded.has(child.path);
      return (
        <div key={key} className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs min-w-0" style={{ paddingLeft: depth * 12 }}>
            {!isFile && (
              <button
                type="button"
                onClick={() => toggle(child.path)}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={isOpen ? "Collapse folder" : "Expand folder"}
              >
                {isOpen ? <ChevronDownIcon className="size-3" /> : <ChevronRightIcon className="size-3" />}
              </button>
            )}
            <div className={cn("grid items-center gap-2 min-w-0 w-full", isFile ? "grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,1fr)]")}>
              <MiddleEllipsisText
                text={child.name}
                className={cn("truncate min-w-0 select-text block", isFile ? "text-foreground" : "font-medium")}
              />
              {isFile && (
                <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                  {formatBytes(child.file!.size)}
                </span>
              )}
            </div>
          </div>
          {isFile ? (
            <div className="flex flex-col gap-1 min-w-0" style={{ paddingLeft: depth * 12 }}>
              <div className="bg-secondary rounded-full h-1 overflow-hidden min-w-0">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${(child.file!.progress * 100).toFixed(1)}%` }}
                />
              </div>
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                {(child.file!.progress * 100).toFixed(1)}%
              </span>
            </div>
          ) : (
            isOpen && renderNode(child, depth + 1)
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-2">{renderNode(root, 0)}</div>
  );
}

/* ── main drawer ── */
const MIN_WIDTH = 280;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 320;

export function TorrentDrawer({ torrent, onClose }: TorrentDrawerProps) {
  const [tab, setTab] = useState<Tab>("info");
  const [property, setProperty] = useState<TorrentProperty | null>(null);
  const [pieces, setPieces] = useState<number[]>([]);
  const [trackers, setTrackers] = useState<TorrentTracker[]>([]);
  const [peers, setPeers] = useState<TorrentPeer[]>([]);
  const [webseeds, setWebseeds] = useState<string[]>([]);
  const [contents, setContents] = useState<TorrentContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem("drawer-width");
    return saved ? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parseInt(saved))) : DEFAULT_WIDTH;
  });
  const piecesIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = startX.current - ev.clientX;
      setWidth(_ => {
          const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
          localStorage.setItem("drawer-width", String(next));
          return next;
        });
    };
    const onMouseUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  useEffect(() => {
    const root = contentScrollRef.current;
    if (!root) return;
    scrollContentViewportToTop(root);
  }, [tab]);

  useEffect(() => {
    if (!torrent.hash) return;
    let cancelled = false;

    setLoading(true);
    setProperty(null);
    setPieces([]);
    setTrackers([]);
    setPeers([]);
    setWebseeds([]);
    setContents([]);
    setTab("info");

    Promise.all([
      invoke<TorrentProperty>("get_torrent_properties", { hash: torrent.hash }).catch(() => null),
      invoke<number[]>("get_torrent_pieces_states", { hash: torrent.hash }).catch(() => []),
      invoke<TorrentTracker[]>("get_torrent_trackers", { hash: torrent.hash }).catch(() => []),
      invoke<TorrentPeer[]>("get_torrent_peers", { hash: torrent.hash }).catch(() => []),
      invoke<string[]>("get_torrent_web_seeds", { hash: torrent.hash }).catch(() => []),
      invoke<TorrentContent[]>("get_torrent_contents", { hash: torrent.hash }).catch(() => []),
    ])
      .then(([props, pcs, trk, prs, ws, cnt]) => {
        if (cancelled) return;
        if (props) setProperty(props);
        setPieces(pcs as number[]);
        setTrackers(trk as TorrentTracker[]);
        setPeers(prs as TorrentPeer[]);
        setWebseeds(ws as string[]);
        setContents(cnt as TorrentContent[]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    piecesIntervalRef.current = setInterval(async () => {
      if (cancelled) return;
      try {
        const [pcs, prs] = await Promise.all([
          invoke<number[]>("get_torrent_pieces_states", { hash: torrent.hash! }).catch(() => null),
          invoke<TorrentPeer[]>("get_torrent_peers", { hash: torrent.hash! }).catch(() => null),
        ]);
        if (cancelled) return;
        if (pcs) setPieces(pcs);
        if (prs) setPeers(prs);
      } catch {}
    }, 3000);

    return () => {
      cancelled = true;
      if (piecesIntervalRef.current) clearInterval(piecesIntervalRef.current);
    };
  }, [torrent.hash]);

  return (
    <div
      className="shrink-0 border-l bg-background flex flex-col overflow-hidden relative"
      style={{ width }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={onResizeStart}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/40 transition-colors z-10"
      />
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-4 py-3 border-b shrink-0">
        <div className="min-w-0">
          <h2 className="font-semibold text-sm leading-snug truncate select-text" title={torrent.name ?? ""}>{torrent.name ?? "—"}</h2>
          <div className="mt-0.5 flex items-center gap-2 min-w-0">
            <p className="text-xs text-muted-foreground font-mono truncate select-text">{torrent.hash}</p>
            <button
              type="button"
              onClick={async () => {
                const name = torrent.name ?? "";
                const hash = torrent.hash ?? "";
                const text = [name, hash].filter(Boolean).join("\n");
                if (!text) return;
                try {
                  await navigator.clipboard.writeText(text);
                  toast.success("Copied name and hash");
                } catch {}
              }}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Copy name and hash"
              title="Copy name and hash"
            >
              <CopyIcon className="size-3.5" />
            </button>
          </div>
        </div>
        <button onClick={onClose} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5">
          <XIcon className="size-4" />
        </button>
      </div>

      {/* Tab bar */}
      <ScrollArea className="shrink-0 border-b">
        <div className="flex">
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
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Content */}
      <ScrollArea ref={contentScrollRef} className="flex-1 min-h-0">
        <div className="p-4">
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
      </ScrollArea>
    </div>
  );
}
