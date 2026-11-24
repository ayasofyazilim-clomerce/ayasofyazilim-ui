"use client";

import * as React from "react";
import type { AppShellShortcuts } from "./types";

/** The localStorage key `useStoredShortcuts` uses when given none. */
export const DEFAULT_SHORTCUTS_STORAGE_KEY = "app-shell-shortcuts";

const EMPTY: Record<string, string> = {};

/**
 * Values kept in memory when localStorage refuses a write (private mode, a
 * full quota, blocked site data), so shortcuts still work until the page
 * reloads.
 */
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function readRaw(storageKey: string): string | null {
  if (memory.has(storageKey)) return memory.get(storageKey) ?? null;
  try {
    return window.localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function writeRaw(storageKey: string, raw: string) {
  try {
    window.localStorage.setItem(storageKey, raw);
    memory.delete(storageKey);
  } catch {
    memory.set(storageKey, raw);
  }
  notify();
}

/** The stored map, keeping only string values; anything else reads as empty. */
function parse(raw: string | null): Record<string, string> {
  if (!raw) return EMPTY;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return EMPTY;
    }
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string" && value !== "") result[key] = value;
    }
    return result;
  } catch {
    return EMPTY;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changed the storage.
  const onStorage = () => listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * `AppShell` shortcuts kept in this browser's localStorage under
 * `storageKey`, as `{ "item:<id>": "ctrl+shift+h", … }`. The server and the
 * first client render see no shortcuts, so hydration matches; the stored ones
 * arrive right after. Tabs stay in sync. If storage throws, shortcuts live in
 * memory until the page reloads. Stale keys (an item the user can no longer
 * see) are kept, not pruned: a nav filtered by permissions may be empty while
 * it loads.
 */
export function useStoredShortcuts(
  storageKey: string = DEFAULT_SHORTCUTS_STORAGE_KEY
): AppShellShortcuts {
  const raw = React.useSyncExternalStore(
    subscribe,
    () => readRaw(storageKey),
    () => null
  );
  const value = React.useMemo(() => parse(raw), [raw]);
  const onChange = React.useCallback(
    (next: Record<string, string>) =>
      writeRaw(storageKey, JSON.stringify(next)),
    [storageKey]
  );
  return React.useMemo(() => ({ value, onChange }), [value, onChange]);
}
