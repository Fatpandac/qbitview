/// <reference types="vitest" />
import { describe, expect, it, vi } from "vitest";
import {
  handleDrawerEscapeKey,
  isDrawerRequestAborted,
  raceDrawerRequestWithAbort,
  scrollContentViewportToTop,
  truncateMiddleByWidth,
} from "./TorrentDrawer";

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

describe("handleDrawerEscapeKey", () => {
  it("closes the drawer on Escape", () => {
    const closeSpy = vi.fn();
    const event = new KeyboardEvent("keydown", { key: "Escape" });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    handleDrawerEscapeKey(event, closeSpy);

    expect(preventDefaultSpy).toHaveBeenCalledOnce();
    expect(closeSpy).toHaveBeenCalledOnce();
  });

  it("ignores non-Escape keys", () => {
    const closeSpy = vi.fn();
    const event = new KeyboardEvent("keydown", { key: "Enter" });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    handleDrawerEscapeKey(event, closeSpy);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
    expect(closeSpy).not.toHaveBeenCalled();
  });
});

describe("raceDrawerRequestWithAbort", () => {
  it("rejects with an abort-shaped error after the signal aborts", async () => {
    const controller = new AbortController();
    const pending = new Promise<string>((resolve) => {
      setTimeout(() => resolve("done"), 20);
    });

    const request = raceDrawerRequestWithAbort(pending, controller.signal);
    controller.abort();

    await expect(request).rejects.toMatchObject({ name: "AbortError" });
  });

  it("resolves when the signal stays active", async () => {
    const controller = new AbortController();
    await expect(
      raceDrawerRequestWithAbort(Promise.resolve("done"), controller.signal),
    ).resolves.toBe("done");
  });
});

describe("isDrawerRequestAborted", () => {
  it("recognizes abort errors", () => {
    const error = new Error("The operation was aborted");
    error.name = "AbortError";

    expect(isDrawerRequestAborted(error)).toBe(true);
  });

  it("ignores non-abort errors", () => {
    expect(isDrawerRequestAborted(new Error("boom"))).toBe(false);
  });
});
