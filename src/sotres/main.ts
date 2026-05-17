import { create } from "zustand";
import type { Torrent, TransferInfo } from "@/pages/main/types";

type UpdateInfo = { version: string; body: string | null };

type MainStore = {
  torrents: Torrent[];
  transferInfo: TransferInfo | null;
  version: string;
  updateInfo: UpdateInfo | null;
  setTorrents: (torrents: Torrent[]) => void;
  setTransferInfo: (info: TransferInfo | null) => void;
  setVersion: (version: string) => void;
  setUpdateInfo: (info: UpdateInfo | null) => void;
};

const useMainStore = create<MainStore>((set) => ({
  torrents: [],
  transferInfo: null,
  version: "",
  updateInfo: null,
  setTorrents: (torrents) => set({ torrents }),
  setTransferInfo: (transferInfo) => set({ transferInfo }),
  setVersion: (version) => set({ version }),
  setUpdateInfo: (updateInfo) => set({ updateInfo }),
}));

export default useMainStore;
