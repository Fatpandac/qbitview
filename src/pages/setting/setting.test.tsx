/// <reference types="vitest" />
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { invoke } from "@tauri-apps/api/core";
import Settings from "./setting";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe("Settings page", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("loads preferences and renders form values", async () => {
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === "get_preferences") {
        return Promise.resolve({
          save_path: "/downloads",
          temp_path_enabled: true,
          temp_path: "/tmp",
          start_paused_enabled: true,
          preallocate_all: false,
          max_active_downloads: 3,
          max_active_uploads: 2,
          max_active_torrents: 4,
          max_connec: 100,
          max_connec_per_torrent: 50,
          max_uploads: 20,
          max_uploads_per_torrent: 10,
          dl_limit: 1024,
          up_limit: 512,
          listen_port: 6881,
          random_port: false,
          upnp: true,
          dht: true,
          pex: true,
          lsd: false,
          encryption: 0,
          max_ratio_enabled: true,
          max_ratio: 2.0,
          max_ratio_act: 1,
          max_seeding_time_enabled: true,
          max_seeding_time: 60,
        });
      }
      return Promise.resolve();
    });

    render(<Settings />);

    expect(screen.getByRole("heading", { name: "Settings" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText("Save path")).toHaveValue("/downloads");
    });

    expect(screen.getByLabelText("Temporary path")).toHaveValue("/tmp");
    expect(screen.getByLabelText("Start torrents paused")).toBeChecked();
    expect(screen.getByLabelText("Enable temporary path")).toBeChecked();
    expect(screen.getByLabelText("Listen port")).toHaveValue(6881);
    expect(screen.getByLabelText("Download limit (KiB/s)")).toHaveValue(1024);
    expect(screen.getByLabelText("Enable ratio limit")).toBeChecked();
    expect(screen.getByLabelText("Maximum ratio")).toHaveValue(2);
    expect(screen.getByLabelText("Action on ratio hit")).toHaveValue("1");
    expect(screen.getByLabelText("Enable seeding time limit")).toBeChecked();
    expect(screen.getByLabelText("Seeding time (minutes)")).toHaveValue(60);
  });

  it("saves updated preferences", async () => {
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === "get_preferences") {
        return Promise.resolve({
          save_path: "/downloads",
          temp_path_enabled: false,
          temp_path: "",
          start_paused_enabled: false,
          preallocate_all: false,
          max_active_downloads: 3,
          max_active_uploads: 2,
          max_active_torrents: 4,
          max_connec: 100,
          max_connec_per_torrent: 50,
          max_uploads: 20,
          max_uploads_per_torrent: 10,
          dl_limit: 0,
          up_limit: 0,
          listen_port: 6881,
          random_port: false,
          upnp: true,
          dht: true,
          pex: true,
          lsd: true,
          encryption: 0,
          max_ratio_enabled: false,
          max_ratio: 1.5,
          max_ratio_act: 2,
          max_seeding_time_enabled: false,
          max_seeding_time: 120,
        });
      }
      return Promise.resolve();
    });

    const user = userEvent.setup();
    render(<Settings />);

    await waitFor(() => {
      expect(screen.getByLabelText("Save path")).toHaveValue("/downloads");
    });

    await user.clear(screen.getByLabelText("Save path"));
    await user.type(screen.getByLabelText("Save path"), "/media");
    await user.click(screen.getByLabelText("Start torrents paused"));
    await user.click(screen.getByLabelText("Enable ratio limit"));
    await user.clear(screen.getByLabelText("Maximum ratio"));
    await user.type(screen.getByLabelText("Maximum ratio"), "1.5");
    await user.selectOptions(screen.getByLabelText("Action on ratio hit"), "0");
    await user.click(screen.getByLabelText("Enable seeding time limit"));
    await user.clear(screen.getByLabelText("Seeding time (minutes)"));
    await user.type(screen.getByLabelText("Seeding time (minutes)"), "30");

    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        "set_preferences",
        expect.objectContaining({
          preferences: expect.objectContaining({
            save_path: "/media",
            start_paused_enabled: true,
            max_ratio_enabled: true,
            max_ratio: 1.5,
            max_ratio_act: 0,
            max_seeding_time_enabled: true,
            max_seeding_time: 30,
          }),
        })
      );
    });
  });
});
