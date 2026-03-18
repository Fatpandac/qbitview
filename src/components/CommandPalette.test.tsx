/// <reference types="vitest" />
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { CommandPalette } from "./CommandPalette";

const navigateMock = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/sotres/main", () => ({
  default: () => ({
    torrents: [
      { hash: "abc123", name: "Ubuntu ISO", category: "linux", state: "downloading" },
    ],
  }),
}));

describe("CommandPalette", () => {
  it("navigates to the selected result on enter", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CommandPalette />
      </MemoryRouter>,
    );

    await user.keyboard("{Meta>}k{/Meta}");
    const input = screen.getByPlaceholderText("Search torrents, categories, and settings...");
    await user.type(input, "ubuntu");
    await user.keyboard("{Enter}");

    expect(navigateMock).toHaveBeenCalledWith("/main?torrent=abc123&filter=all");
  });
});
