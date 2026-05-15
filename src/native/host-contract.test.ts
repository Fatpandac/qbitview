/// <reference types="vitest" />
import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { HOST_COMMAND_NAMES } from "./host-contract";

function readSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = resolve(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return readSourceFiles(path);
    if (!/\.(tsx?|css)$/.test(path)) return [];
    if (/\.(test|spec)\.tsx?$/.test(path)) return [];
    return [readFileSync(path, "utf8")];
  });
}

function readSourceFileEntries(dir: string): Array<{ path: string; text: string }> {
  return readdirSync(dir).flatMap((entry) => {
    const path = resolve(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return readSourceFileEntries(path);
    if (!/\.(tsx?|css)$/.test(path)) return [];
    if (/\.(test|spec)\.tsx?$/.test(path)) return [];
    return [{ path, text: readFileSync(path, "utf8") }];
  });
}

function collectInvokedCommands() {
  const commandNames = new Set<string>();
  const invokePattern = /invoke(?:<[^>]+>)?\(\s*["']([^"']+)["']/g;

  for (const text of readSourceFiles(resolve(__dirname, ".."))) {
    for (const match of text.matchAll(invokePattern)) {
      commandNames.add(match[1]);
    }
  }

  return [...commandNames].sort();
}

describe("host IPC contract", () => {
  it("covers every command invoked by the WebView layer", () => {
    expect([...HOST_COMMAND_NAMES].sort()).toEqual(
      expect.arrayContaining(collectInvokedCommands()),
    );
  });

  it("keeps direct Tauri invoke imports inside the host adapter", () => {
    const directImports = readSourceFileEntries(resolve(__dirname, ".."))
      .filter(({ path }) => !path.endsWith("src/native/host-client.ts"))
      .filter(({ text }) => text.includes("@tauri-apps/api/core"))
      .map(({ path }) => path);

    expect(directImports).toEqual([]);
  });
});
