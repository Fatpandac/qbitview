import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { useEffect, useRef, useState } from "react";
import { UploadIcon } from "lucide-react";
import { FilterKey, Torrent, TransferInfo } from "./types";
import { Sidebar } from "./Sidebar";
import { Toolbar } from "./Toolbar";
import { TorrentTable } from "./TorrentTable";
import { StatusBar } from "./StatusBar";
import { AddTorrentModal } from "./AddTorrentModal";
import { DeleteModal } from "./DeleteModal";
import { TorrentDrawer } from "./TorrentDrawer";

function Main() {
  const [version, setVersion] = useState("");
  const [torrents, setTorrents] = useState<Torrent[]>([]);
  const [transferInfo, setTransferInfo] = useState<TransferInfo | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeTorrent, setActiveTorrent] = useState<Torrent | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [dropFile, setDropFile] = useState<File | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Listen to Tauri's native file-drop event (browser drag events are intercepted by the webview)
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    getCurrentWebview().onDragDropEvent(async (event) => {
      const { type } = event.payload;
      if (type === "enter" || type === "over") {
        const paths = "paths" in event.payload ? event.payload.paths : [];
        if (paths.some((p) => p.endsWith(".torrent"))) {
          setIsDragging(true);
        }
      } else if (type === "drop") {
        setIsDragging(false);
        const paths = "paths" in event.payload ? event.payload.paths : [];
        const torrentPath = paths.find((p) => p.endsWith(".torrent"));
        if (torrentPath) {
          try {
            const bytes = await invoke<number[]>("read_file", { path: torrentPath });
            const filename = torrentPath.split("/").pop() ?? torrentPath.split("\\").pop() ?? "file.torrent";
            const file = new File([new Uint8Array(bytes)], filename, { type: "application/x-bittorrent" });
            setDropFile(file);
            setShowAddModal(true);
          } catch (e) {
            console.error("Failed to read dropped file:", e);
          }
        }
      } else if (type === "leave") {
        setIsDragging(false);
      }
    }).then((fn) => { unlisten = fn; });

    return () => { unlisten?.(); };
  }, []);

  async function fetchData() {
    try {
      const filterArg = filter === "all" ? null : filter;
      const [ts, ti] = await Promise.all([
        invoke<Torrent[]>("get_torrents", { filter: filterArg }),
        invoke<TransferInfo>("get_transfer_info"),
      ]);
      setTorrents(ts);
      setTransferInfo(ti);
      if (activeTorrent) {
        const updated = ts.find((t) => t.hash === activeTorrent.hash);
        if (updated) setActiveTorrent(updated);
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    invoke<string>("get_version").then(setVersion).catch(console.error);
  }, []);

  useEffect(() => {
    setSelected(new Set());
    fetchData();
    intervalRef.current = setInterval(fetchData, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [filter]);

  function toggleSelect(hash: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(hash) ? next.delete(hash) : next.add(hash);
      return next;
    });
  }

  function selectAll(checked: boolean) {
    setSelected(checked ? new Set(torrents.map((t) => t.hash ?? "")) : new Set());
  }

  const selectedHashes = Array.from(selected);

  async function handleStop() {
    if (!selectedHashes.length) return;
    await invoke("stop_torrents", { hashes: selectedHashes });
    fetchData();
  }

  async function handleStart() {
    if (!selectedHashes.length) return;
    await invoke("start_torrents", { hashes: selectedHashes });
    fetchData();
  }

  async function handleDelete(withFiles: boolean) {
    if (!selectedHashes.length) return;
    await invoke("delete_torrents", { hashes: selectedHashes, deleteFiles: withFiles });
    setSelected(new Set());
    setShowDeleteModal(false);
    fetchData();
  }

  function handleCloseAddModal() {
    setShowAddModal(false);
    setDropFile(null);
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground relative">
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-primary/10 border-4 border-dashed border-primary rounded-lg m-2 pointer-events-none flex flex-col items-center justify-center gap-3">
          <UploadIcon className="size-14 text-primary" />
          <p className="text-lg font-semibold text-primary">Drop .torrent file to add</p>
        </div>
      )}

      <Sidebar
        version={version}
        filter={filter}
        onFilterChange={setFilter}
        transferInfo={transferInfo}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Toolbar
          totalCount={torrents.length}
          selectedCount={selectedHashes.length}
          onAdd={() => { setDropFile(null); setShowAddModal(true); }}
          onPause={handleStop}
          onResume={handleStart}
          onDelete={() => setShowDeleteModal(true)}
        />
        <TorrentTable
          torrents={torrents}
          selected={selected}
          activeTorrentHash={activeTorrent?.hash}
          onToggleSelect={(hash) => toggleSelect(hash)}
          onSelectAll={selectAll}
          onRowClick={(t) =>
            setActiveTorrent((prev) => (prev?.hash === t.hash ? null : t))
          }
        />
        {transferInfo && <StatusBar transferInfo={transferInfo} />}
      </div>

      {activeTorrent && (
        <TorrentDrawer
          torrent={activeTorrent}
          onClose={() => setActiveTorrent(null)}
        />
      )}

      {showAddModal && (
        <AddTorrentModal
          onClose={handleCloseAddModal}
          onSuccess={fetchData}
          initialFile={dropFile ?? undefined}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          count={selectedHashes.length}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

export default Main;
