/// <reference types="vitest" />
import { describe, expect, it } from "vitest";
import { buildCommandPaletteItems, getCommandHref, parseFilterFromSearch, parseSettingsTargetFromSearch, parseTorrentFromSearch, SETTINGS_COMMANDS } from "./command-palette.utils";

describe("command palette helpers", () => {
  const context = {
    torrents: [
      { hash: "abc123", name: "Ubuntu ISO", category: "linux", state: "downloading" },
      { hash: "def456", name: "Frieren Episode 6", category: "anime", state: "pausedDL" },
    ],
    filters: [
      { key: "all" as const, label: "All" },
      { key: "downloading" as const, label: "Downloading" },
      { key: "paused" as const, label: "Paused" },
    ],
    settings: SETTINGS_COMMANDS,
  };

  it("matches torrents by name", () => {
    const items = buildCommandPaletteItems(context, "frie");
    expect(items.some((item) => item.type === "torrent" && item.title === "Frieren Episode 6")).toBe(true);
  });

  it("supports fuzzy matching for torrents", () => {
    const items = buildCommandPaletteItems(context, "frn6");
    expect(items.some((item) => item.type === "torrent" && item.title === "Frieren Episode 6")).toBe(true);
  });

  it("prioritizes page-relevant results", () => {
    const mainItems = buildCommandPaletteItems({ ...context, currentPath: "/main" }, "download");
    expect(mainItems[0]?.type).toBe("torrent");

    const settingsItems = buildCommandPaletteItems({ ...context, currentPath: "/setting" }, "download");
    expect(settingsItems[0]?.type).toBe("setting");
  });

  it("matches filters and settings by text", () => {
    const items = buildCommandPaletteItems(context, "download");
    expect(items.some((item) => item.type === "filter" && item.filter === "downloading")).toBe(true);
    expect(items.some((item) => item.type === "setting" && item.target === "downloadLimit")).toBe(true);
  });

  it("builds hrefs for each command type", () => {
    expect(getCommandHref({ id: "torrent:abc", type: "torrent", title: "Ubuntu", subtitle: "abc", hash: "abc" })).toBe("/main?torrent=abc&filter=all");
    expect(getCommandHref({ id: "filter:paused", type: "filter", title: "Paused", subtitle: "", filter: "paused" })).toBe("/main?filter=paused");
    expect(getCommandHref({ id: "setting:savePath", type: "setting", title: "Save path", subtitle: "", target: "savePath" })).toBe("/setting?target=savePath");
  });

  it("parses search params safely", () => {
    expect(parseFilterFromSearch("?filter=paused")).toBe("paused");
    expect(parseFilterFromSearch("?filter=nope")).toBeNull();
    expect(parseTorrentFromSearch("?torrent=abc123")).toBe("abc123");
    expect(parseSettingsTargetFromSearch("?target=savePath")).toBe("savePath");
    expect(parseSettingsTargetFromSearch("?target=nope")).toBeNull();
  });
});
