import { create } from "zustand";
import type { Torrent, TransferInfo } from "@/pages/main/types";

type MainStore = {
  torrents: Torrent[];
  transferInfo: TransferInfo | null;
  version: string;
  setTorrents: (torrents: Torrent[]) => void;
  setTransferInfo: (info: TransferInfo | null) => void;
  setVersion: (version: string) => void;
};

const useMainStore = create<MainStore>((set) => ({
  torrents: [],
  transferInfo: null,
  version: "",
  setTorrents: (torrents) => set({ torrents }),
  setTransferInfo: (transferInfo) => set({ transferInfo }),
  setVersion: (version) => set({ version }),
}));

export default useMainStore;
