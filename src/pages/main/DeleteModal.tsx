import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/language";

interface DeleteModalProps {
  count: number;
  onClose: () => void;
  onConfirm: (deleteFiles: boolean) => void;
}

export function DeleteModal({ count, onClose, onConfirm }: DeleteModalProps) {
  const t = useI18n();
  const [deleteFiles, setDeleteFiles] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-xl border p-6 w-80 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-semibold text-base">
          {t.deleteTorrentTitle(count)}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t.removeTorrentQuestion(count)}
        </p>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={deleteFiles}
            onChange={(e) => setDeleteFiles(e.target.checked)}
            className="rounded"
          />
          {t.alsoDeleteFiles}
        </label>
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onConfirm(deleteFiles)}>
            {t.toolbarDelete}
          </Button>
        </div>
      </div>
    </div>
  );
}
