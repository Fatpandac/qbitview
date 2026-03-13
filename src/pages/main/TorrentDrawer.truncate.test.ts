/// <reference types="vitest" />
import { describe, expect, it, vi } from "vitest";
import { scrollContentViewportToTop, truncateMiddleByWidth } from "./TorrentDrawer";

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

describe("scrollContentViewportToTop", () => {
  it("scrolls the scroll-area viewport to the top", () => {
    const root = document.createElement("div");
    const viewport = document.createElement("div");
    viewport.setAttribute("data-slot", "scroll-area-viewport");
    root.appendChild(viewport);
    const scrollSpy = vi.fn();
    viewport.scrollTo = scrollSpy;

    scrollContentViewportToTop(root);
    expect(scrollSpy).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
  });
});
