/// <reference types="vitest" />
import { render, screen, waitFor } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import Main from "./main";
import useMainStore from "@/sotres/main";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/webview", () => ({
  getCurrentWebview: () => ({
    onDragDropEvent: vi.fn(() => Promise.resolve(() => {})),
  }),
}));

vi.mock("./Sidebar", () => ({
  Sidebar: () => <div data-testid="sidebar" />,
}));

vi.mock("./Toolbar", () => ({
  Toolbar: () => <div data-testid="toolbar" />,
}));

vi.mock("./StatusBar", () => ({
  StatusBar: () => <div data-testid="statusbar" />,
}));

vi.mock("./AddTorrentModal", () => ({
  AddTorrentModal: () => <div data-testid="add-modal" />,
}));

vi.mock("./DeleteModal", () => ({
  DeleteModal: () => <div data-testid="delete-modal" />,
}));

vi.mock("./TorrentDrawer", () => ({
  TorrentDrawer: () => <div data-testid="drawer" />,
}));

vi.mock("./TorrentTable", () => ({
  TorrentTable: ({ torrents }: { torrents: { name?: string }[] }) => (
    <div data-testid="torrent-table">
      {torrents.map((t) => t.name ?? "-").join(",")}
    </div>
  ),
}));

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const mockInvoke = vi.mocked(invoke);

describe("Main page data persistence", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
    useMainStore.getState().setTorrents([]);
    useMainStore.getState().setTransferInfo(null);
    useMainStore.getState().setVersion("");
  });

  it("renders cached torrents and refreshes when new data arrives", async () => {
    const cached = [{ hash: "old", name: "Old" }];
    const updated = [{ hash: "new", name: "New" }];
    const torrentsDeferred = deferred<typeof updated>();

    useMainStore.getState().setTorrents(cached);

    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === "get_torrents") return torrentsDeferred.promise;
      if (cmd === "get_transfer_info") {
        return Promise.resolve({
          dl_info_speed: 0,
          up_info_speed: 0,
          dl_info_data: 0,
          up_info_data: 0,
          dht_nodes: 0,
        });
      }
      if (cmd === "get_version") return Promise.resolve("v1");
      if (cmd === "get_global_speed_limits") {
        return Promise.resolve({ dl_limit: 0, up_limit: 0 });
      }
      return Promise.resolve();
    });

    render(<Main />);

    expect(screen.getByTestId("torrent-table")).toHaveTextContent("Old");

    torrentsDeferred.resolve(updated);

    await waitFor(() => {
      expect(screen.getByTestId("torrent-table")).toHaveTextContent("New");
    });
  });
});
