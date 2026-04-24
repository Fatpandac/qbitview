/// <reference types="vitest" />
import { render, screen } from "@testing-library/react";
import { initLanguage } from "@/lib/language";
import { TorrentTable } from "./TorrentTable";

describe("TorrentTable", () => {
  const baseProps = {
    selected: new Set<string>(),
    onToggleSelect: () => {},
    onSelectAll: () => {},
    onRowClick: () => {},
    onAction: () => {},
    onDelete: () => {},
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it("shows torrent categories and falls back to the current language label", () => {
    render(
      <TorrentTable
        {...baseProps}
        torrents={[
          { hash: "1", name: "With Category", category: "Movies" },
          { hash: "2", name: "Without Category", category: "" },
        ]}
      />,
    );

    expect(screen.getByText("Movies")).toBeInTheDocument();
    expect(screen.getByText("Uncategorized")).toBeInTheDocument();
  });

  it("keeps translated headers readable by allowing horizontal scrolling", () => {
    localStorage.setItem("app-language", "zh-CN");
    initLanguage();
    const { container } = render(
      <TorrentTable
        {...baseProps}
        torrents={[
          { hash: "1", name: "Ubuntu", category: "Linux", eta: 3600 },
        ]}
      />,
    );

    expect(container.querySelector("table")).toHaveClass("min-w-[1120px]");
    expect(screen.getByRole("columnheader", { name: "剩余时间" })).toHaveClass("whitespace-nowrap");
  });
});
