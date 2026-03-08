import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchData() {
    try {
      const filterArg = filter === "all" ? null : filter;
      const [ts, ti] = await Promise.all([
        invoke<Torrent[]>("get_torrents", { filter: filterArg }),
        invoke<TransferInfo>("get_transfer_info"),
      ]);
      setTorrents(ts);
      setTransferInfo(ti);
      // Keep activeTorrent in sync with latest data
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

  function toggleSelect(hash: string, e: React.MouseEvent) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (e.shiftKey || e.ctrlKey || e.metaKey) {
        next.has(hash) ? next.delete(hash) : next.add(hash);
      } else {
        if (next.size === 1 && next.has(hash)) {
          next.clear();
        } else {
          next.clear();
          next.add(hash);
        }
      }
      return next;
    });
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
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
          onAdd={() => setShowAddModal(true)}
          onPause={handleStop}
          onResume={handleStart}
          onDelete={() => setShowDeleteModal(true)}
        />
        <TorrentTable
          torrents={torrents}
          selected={selected}
          activeTorrentHash={activeTorrent?.hash}
          onToggleSelect={toggleSelect}
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
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchData}
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

