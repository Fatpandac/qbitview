/// <reference types="vitest" />
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { TorrentContextMenu } from "./TorrentContextMenu";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe("TorrentContextMenu", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("downloads .torrent file from the context menu", async () => {
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === "export_torrent") return Promise.resolve([1, 2, 3]);
      return Promise.resolve();
    });

    if (!("createObjectURL" in URL)) {
      Object.defineProperty(URL, "createObjectURL", { value: () => "blob:mock", writable: true });
    }
    if (!("revokeObjectURL" in URL)) {
      Object.defineProperty(URL, "revokeObjectURL", { value: () => {}, writable: true });
    }

    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(
      <TorrentContextMenu
        torrent={{ hash: "abc", name: "Test" }}
        onAction={() => {}}
        onDelete={() => {}}
      >
        <button>Open</button>
      </TorrentContextMenu>
    );

    fireEvent.contextMenu(screen.getByText("Open"));
    const item = await screen.findByText("Download .torrent");
    fireEvent.click(item);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("export_torrent", { hash: "abc" });
      expect(createObjectURL).toHaveBeenCalledTimes(1);
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");
    });

    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
    clickSpy.mockRestore();
  });
});
