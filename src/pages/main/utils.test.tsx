/// <reference types="vitest" />
import { describe, expect, it } from "vitest";
import { countByCategory, filterTorrents, filterTorrentsByCategory, normalizeCategoryLabel } from "./utils";
import { Torrent } from "./types";

describe("category utils", () => {
  it("normalizes empty categories to the current language label", () => {
    expect(normalizeCategoryLabel("")).toBe("Uncategorized");
    expect(normalizeCategoryLabel("   ")).toBe("Uncategorized");
    expect(normalizeCategoryLabel(undefined)).toBe("Uncategorized");
    expect(normalizeCategoryLabel("Movies")).toBe("Movies");
  });

  it("counts torrents by category and includes the fallback category", () => {
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
      { label: "Uncategorized", count: 2 },
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
    expect(filterTorrentsByCategory(torrents, "Uncategorized")).toEqual([{ hash: "2", category: "" }]);
  });

  it("category counts reflect the active sidebar status filter", () => {
    // 4 active torrents: 2 drama (downloading), 2 uncategorized (also downloading)
    // 2 paused torrents: both drama
    const torrents: Torrent[] = [
      { hash: "1", category: "drama", state: "downloading", dlspeed: 100, upspeed: 0 },
      { hash: "2", category: "drama", state: "downloading", dlspeed: 100, upspeed: 0 },
      { hash: "3", category: "",      state: "downloading", dlspeed: 100, upspeed: 0 },
      { hash: "4", category: "",      state: "downloading", dlspeed: 100, upspeed: 0 },
      { hash: "5", category: "drama", state: "pausedDL",    dlspeed: 0,   upspeed: 0 },
      { hash: "6", category: "drama", state: "pausedDL",    dlspeed: 0,   upspeed: 0 },
    ];

    // When "active" filter is selected: 4 torrents (2 drama, 2 uncategorized)
    expect(countByCategory(filterTorrents(torrents, "active"))).toEqual([
      { label: "drama", count: 2 },
      { label: "Uncategorized", count: 2 },
    ]);

    // When "paused" filter is selected: 2 torrents (both drama, none uncategorized)
    expect(countByCategory(filterTorrents(torrents, "paused"))).toEqual([
      { label: "drama", count: 2 },
    ]);

    // When "all" filter: all 6 torrents
    expect(countByCategory(filterTorrents(torrents, "all"))).toEqual([
      { label: "drama", count: 4 },
      { label: "Uncategorized", count: 2 },
    ]);
  });
});
