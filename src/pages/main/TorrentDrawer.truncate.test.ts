/// <reference types="vitest" />
import { describe, expect, it } from "vitest";
import { truncateMiddleByWidth } from "./TorrentDrawer";

describe("truncateMiddleByWidth", () => {
  const measure = (text: string) => text.length * 10;

  it("returns full text when it fits", () => {
    expect(truncateMiddleByWidth("short", 100, measure)).toBe("short");
  });

  it("adds middle ellipsis when it overflows", () => {
    const value = "this_is_a_very_long_filename.iso";
    const result = truncateMiddleByWidth(value, 80, measure);
    expect(result).toContain("...");
    expect(result.split("...")[0].length).toBeGreaterThan(0);
    expect(result.split("...")[1].length).toBeGreaterThan(0);
  });

  it("returns ellipsis when space is extremely tight", () => {
    expect(truncateMiddleByWidth("abcdef", 10, measure)).toBe("...");
  });
});
