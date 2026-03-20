/// <reference types="vitest" />
import { describe, expect, it } from "vitest";
import { countByCategory, filterTorrentsByCategory, normalizeCategoryLabel } from "./utils";
import { Torrent } from "./types";

describe("category utils", () => {
  it("normalizes empty categories to 未分类", () => {
    expect(normalizeCategoryLabel("")).toBe("未分类");
    expect(normalizeCategoryLabel("   ")).toBe("未分类");
    expect(normalizeCategoryLabel(undefined)).toBe("未分类");
    expect(normalizeCategoryLabel("Movies")).toBe("Movies");
  });

  it("counts torrents by category and includes 未分类", () => {
    const torrents: Torrent[] = [
      { hash: "1", category: "Movies" },
      { hash: "2", category: "TV" },
      { hash: "3", category: "" },
      { hash: "4" },
      { hash: "5", category: "Movies" },
    ];

    expect(countByCategory(torrents)).toEqual([
      { label: "Movies", count: 2 },
      { label: "TV", count: 1 },
      { label: "未分类", count: 2 },
    ]);
  });

  it("filters torrents by normalized category label", () => {
    const torrents: Torrent[] = [
      { hash: "1", category: "Movies" },
      { hash: "2", category: "" },
      { hash: "3", category: "TV" },
    ];

    expect(filterTorrentsByCategory(torrents, null)).toHaveLength(3);
    expect(filterTorrentsByCategory(torrents, "Movies")).toEqual([{ hash: "1", category: "Movies" }]);
    expect(filterTorrentsByCategory(torrents, "未分类")).toEqual([{ hash: "2", category: "" }]);
  });
});
