/// <reference types="vitest" />
import { render, screen, waitFor } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { MemoryRouter } from "react-router";
import Main, { getRestorableTorrentFromSearch } from "./main";
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

    render(
      <MemoryRouter initialEntries={["/main"]}>
        <Main />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("torrent-table")).toHaveTextContent("Old");

    torrentsDeferred.resolve(updated);

    await waitFor(() => {
      expect(screen.getByTestId("torrent-table")).toHaveTextContent("New");
    });
  });

  it("syncs the tray transfer monitor with the same transfer info shown in the UI", async () => {
    const transferInfo = {
      dl_info_speed: 2048,
      up_info_speed: 1024,
      dl_info_data: 0,
      up_info_data: 0,
      dht_nodes: 0,
    };

    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === "get_torrents") return Promise.resolve([]);
      if (cmd === "get_transfer_info") return Promise.resolve(transferInfo);
      if (cmd === "get_version") return Promise.resolve("v1");
      if (cmd === "get_global_speed_limits") {
        return Promise.resolve({ dl_limit: 0, up_limit: 0 });
      }
      return Promise.resolve();
    });

    render(
      <MemoryRouter initialEntries={["/main"]}>
        <Main />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("update_transfer_monitor_title", {
        downloadSpeed: transferInfo.dl_info_speed,
        uploadSpeed: transferInfo.up_info_speed,
      });
    });
  });
});

describe("getRestorableTorrentFromSearch", () => {
  const torrents = [
    { hash: "a", name: "First" },
    { hash: "b", name: "Second" },
  ];

  it("returns the matching torrent when it is not dismissed", () => {
    expect(
      getRestorableTorrentFromSearch({
        targetHash: "a",
        torrents,
        dismissedHash: null,
      }),
    ).toEqual(torrents[0]);
  });

  it("does not restore the drawer for a dismissed torrent hash", () => {
    expect(
      getRestorableTorrentFromSearch({
        targetHash: "a",
        torrents,
        dismissedHash: "a",
      }),
    ).toBeNull();
  });

  it("returns null when the target hash is missing", () => {
    expect(
      getRestorableTorrentFromSearch({
        targetHash: null,
        torrents,
        dismissedHash: null,
      }),
    ).toBeNull();
  });
});
