import { useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CircleXIcon, LinkIcon, UploadIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddTorrentModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialFile?: File;
}

export function AddTorrentModal({ onClose, onSuccess, initialFile }: AddTorrentModalProps) {
  const [tab, setTab] = useState<"url" | "file">(initialFile ? "file" : "url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(initialFile ?? null);
  const [savepath, setSavepath] = useState("");
  const [category, setCategory] = useState("");
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const savepathArg = savepath.trim() || null;
      const categoryArg = category.trim() || null;
      const pausedArg = paused || null;

      if (tab === "url") {
        const urls = url.split("\n").map((u) => u.trim()).filter(Boolean);
        if (!urls.length) {
          setError("Please enter at least one URL or magnet link.");
          return;
        }
        await invoke("add_torrent_urls", { urls, savepath: savepathArg, category: categoryArg, paused: pausedArg });
      } else {
        if (!file) {
          setError("Please select a .torrent file.");
          return;
        }
        const buffer = await file.arrayBuffer();
        const data = Array.from(new Uint8Array(buffer));
        await invoke("add_torrent_file", { filename: file.name, data, savepath: savepathArg, category: categoryArg, paused: pausedArg });
      }

      onSuccess();
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-xl border w-[480px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-base">Add Torrent</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <CircleXIcon className="size-5" />
          </button>
        </div>

        <div className="flex border-b">
          <button
            onClick={() => setTab("url")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 text-sm border-b-2 transition-colors",
              tab === "url"
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <LinkIcon className="size-4" />
            URL / Magnet
          </button>
          <button
            onClick={() => setTab("file")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 text-sm border-b-2 transition-colors",
              tab === "file"
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <UploadIcon className="size-4" />
            Torrent File
          </button>
        </div>

        <div className="p-5 space-y-4">
          {tab === "url" ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">URLs / Magnet Links</label>
              <textarea
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={"magnet:?xt=urn:btih:...\nhttps://example.com/file.torrent"}
                rows={4}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">One URL or magnet link per line</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Torrent File</label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors hover:border-primary hover:bg-muted/30",
                  file && "border-primary bg-muted/20",
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadIcon className="size-8 mx-auto mb-2 text-muted-foreground" />
                {file ? (
                  <p className="text-sm font-medium">{file.name}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Click to select a <span className="font-medium">.torrent</span> file
                  </p>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".torrent"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Save Path</label>
              <Input value={savepath} onChange={(e) => setSavepath(e.target.value)} placeholder="Default" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="None" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={paused}
              onChange={(e) => setPaused(e.target.checked)}
              className="rounded"
            />
            Add in paused state
          </label>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </p>
          )}
        </div>

        <div className="flex gap-2 justify-end px-5 py-4 border-t bg-muted/20">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding…" : "Add Torrent"}
          </Button>
        </div>
      </div>
    </div>
  );
}
