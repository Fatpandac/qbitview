/// <reference types="vitest" />
import { render, screen } from "@testing-library/react";
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

  it("shows torrent categories and falls back to 未分类", () => {
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
    expect(screen.getByText("未分类")).toBeInTheDocument();
  });
});
