import { invoke } from "@tauri-apps/api/core";
import type { HostCommandName } from "./host-contract";

export function invokeHost<T = unknown>(
  command: HostCommandName,
  args?: Record<string, unknown>,
) {
  if (args === undefined) {
    return invoke<T>(command);
  }
  return invoke<T>(command, args);
}
