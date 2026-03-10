/// <reference types="vitest" />
import { render, screen, waitFor } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { AddTorrentModal } from "./AddTorrentModal";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe("AddTorrentModal", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("uses default save path as placeholder", async () => {
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === "get_preferences") {
        return Promise.resolve({ save_path: "/downloads" });
      }
      return Promise.resolve();
    });

    render(
      <AddTorrentModal
        onClose={() => {}}
        onSuccess={() => {}}
      />
    );

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("get_preferences");
    });

    const input = screen.getByLabelText("Save Path") as HTMLInputElement;
    expect(input.placeholder).toBe("/downloads");
  });
});
