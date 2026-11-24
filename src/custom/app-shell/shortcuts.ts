/**
 * Pure helpers for `AppShell` shortcuts. A shortcut is a lower-case string of
 * modifiers in a fixed order and one key, joined by "+": "ctrl+shift+h",
 * "alt+1", "meta+arrowup". No "use client": a Server Component can import
 * them from `@ayasofyazilim-clomerce/ui/custom/app-shell/shortcuts`.
 */

const MODIFIERS = ["ctrl", "alt", "shift", "meta"] as const;
type Modifier = (typeof MODIFIERS)[number];

const MODIFIER_ALIASES: Record<string, Modifier> = {
  ctrl: "ctrl",
  control: "ctrl",
  alt: "alt",
  option: "alt",
  shift: "shift",
  meta: "meta",
  cmd: "meta",
  command: "meta",
  "⌘": "meta",
};

const KEY_ALIASES: Record<string, string> = {
  " ": "space",
  spacebar: "space",
  esc: "escape",
  "+": "plus",
};

/** The fields of a `KeyboardEvent` a shortcut is read from. */
export type ShortcutKeyEvent = Pick<
  KeyboardEvent,
  "key" | "code" | "ctrlKey" | "altKey" | "shiftKey" | "metaKey"
> & {
  isComposing?: boolean;
  getModifierState?: (key: string) => boolean;
};

function canonicalKey(key: string): string {
  const lower = key.toLowerCase();
  return KEY_ALIASES[lower] ?? KEY_ALIASES[key] ?? lower;
}

/**
 * The shortcut a key press makes, or `null` when it cannot be one: a lone
 * modifier, a press without Ctrl, Alt or ⌘ (Shift alone is typing), text
 * being composed, or AltGr (which types characters on many layouts). Letters
 * and digits come from the physical key, so a layout or Alt changing the
 * character does not change the shortcut.
 */
export function shortcutFromEvent(event: ShortcutKeyEvent): string | null {
  if (event.isComposing) return null;
  if (event.getModifierState?.("AltGraph")) return null;
  const key = event.key;
  if (!key || ["Control", "Alt", "Shift", "Meta", "OS"].includes(key)) {
    return null;
  }
  if (!event.ctrlKey && !event.altKey && !event.metaKey) return null;

  const letter = /^Key([A-Z])$/.exec(event.code ?? "");
  const digit = /^Digit([0-9])$/.exec(event.code ?? "");
  const main = letter
    ? letter[1]!.toLowerCase()
    : digit
      ? digit[1]!
      : canonicalKey(key);

  const parts: string[] = [];
  if (event.ctrlKey) parts.push("ctrl");
  if (event.altKey) parts.push("alt");
  if (event.shiftKey) parts.push("shift");
  if (event.metaKey) parts.push("meta");
  parts.push(main);
  return parts.join("+");
}

/**
 * A shortcut written any way ("Shift+Ctrl+H", "cmd+k") in the canonical form
 * ("ctrl+shift+h", "meta+k"), or `null` when it has no key or no Ctrl, Alt or
 * ⌘ (except a lone function key, which `reserved` lists may contain).
 */
export function normalizeShortcut(shortcut: string): string | null {
  const tokens = shortcut
    .split("+")
    .map((token) => token.trim())
    .filter((token) => token !== "");
  // "ctrl++" is ctrl and the plus key.
  if (shortcut.trim().endsWith("++")) tokens.push("plus");
  const modifiers = new Set<Modifier>();
  let key: string | null = null;
  for (const token of tokens) {
    const modifier = MODIFIER_ALIASES[token.toLowerCase()];
    if (modifier) modifiers.add(modifier);
    else if (key === null) key = canonicalKey(token);
    else return null;
  }
  if (key === null) return null;
  if (modifiers.size === 0 && !/^f\d{1,2}$/.test(key)) return null;
  return [...MODIFIERS.filter((modifier) => modifiers.has(modifier)), key].join(
    "+"
  );
}

const MOD_KEYS = ["ctrl", "meta"] as const;

function bothMods(keys: string[]): string[] {
  return MOD_KEYS.flatMap((mod) => keys.map((key) => `${mod}+${key}`));
}

/**
 * Combos that can never be assigned: the shell's own (⌘K / Ctrl+K with any
 * other modifier, ⌘B / Ctrl+B for the sidebar) and the browser's (tabs,
 * windows, address bar, find, history, downloads, editing, print, save,
 * zoom, reload, back and forward, dev tools), for Ctrl and ⌘ both.
 */
export const RESERVED_SHORTCUTS: ReadonlySet<string> = new Set([
  ...bothMods([
    "a",
    "b",
    "c",
    "d",
    "f",
    "g",
    "h",
    "j",
    "l",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "plus",
    "=",
    "-",
    "tab",
    "pageup",
    "pagedown",
    "f4",
    "f5",
    "enter",
  ]),
  ...bothMods([
    "shift+a",
    "shift+b",
    "shift+c",
    "shift+delete",
    "shift+g",
    "shift+i",
    "shift+j",
    "shift+m",
    "shift+n",
    "shift+o",
    "shift+p",
    "shift+r",
    "shift+t",
    "shift+tab",
    "shift+w",
    "shift+z",
  ]),
  "meta+alt+i",
  "meta+alt+j",
  "meta+alt+c",
  "meta+h",
  "meta+m",
  "meta+shift+3",
  "meta+shift+4",
  "meta+shift+5",
  "alt+arrowleft",
  "alt+arrowright",
  "alt+home",
  "alt+f4",
  "alt+d",
  "f1",
  "f3",
  "f5",
  "f6",
  "f7",
  "f11",
  "f12",
]);

/** True for the command menu's own key, whatever the other modifiers. */
function isCommandMenuKey(shortcut: string): boolean {
  const parts = shortcut.split("+");
  return (
    parts[parts.length - 1] === "k" &&
    (parts.includes("ctrl") || parts.includes("meta"))
  );
}

/**
 * True when `shortcut` cannot be assigned: it opens the command menu, it is
 * in `RESERVED_SHORTCUTS`, or it is in `extra` (written any way
 * `normalizeShortcut` reads).
 */
export function isReservedShortcut(
  shortcut: string,
  extra: readonly string[] = []
): boolean {
  const combo = normalizeShortcut(shortcut) ?? shortcut;
  if (isCommandMenuKey(combo) || RESERVED_SHORTCUTS.has(combo)) return true;
  return extra.some((reserved) => normalizeShortcut(reserved) === combo);
}

const DISPLAY: Record<string, string> = {
  ctrl: "Ctrl",
  alt: "Alt",
  shift: "Shift",
  meta: "⌘",
  plus: "+",
  space: "Space",
  escape: "Esc",
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
  enter: "Enter",
  tab: "Tab",
  backspace: "Backspace",
  delete: "Delete",
};

/** The parts of a shortcut to show, one per key: ["Ctrl", "Shift", "H"]. */
export function formatShortcut(shortcut: string): string[] {
  const combo = normalizeShortcut(shortcut) ?? shortcut;
  return combo.split("+").map((part) => {
    const shown = DISPLAY[part];
    if (shown) return shown;
    return part.length === 1
      ? part.toUpperCase()
      : part.charAt(0).toUpperCase() + part.slice(1);
  });
}

const ARIA: Record<string, string> = {
  ctrl: "Control",
  alt: "Alt",
  shift: "Shift",
  meta: "Meta",
  plus: "Plus",
  space: "Space",
  escape: "Escape",
  arrowup: "ArrowUp",
  arrowdown: "ArrowDown",
  arrowleft: "ArrowLeft",
  arrowright: "ArrowRight",
  pageup: "PageUp",
  pagedown: "PageDown",
};

/** The shortcut as an `aria-keyshortcuts` value: "Control+Shift+H". */
export function ariaKeyShortcut(shortcut: string): string {
  const combo = normalizeShortcut(shortcut) ?? shortcut;
  return combo
    .split("+")
    .map((part) => {
      const named = ARIA[part];
      if (named) return named;
      return part.length === 1
        ? part.toUpperCase()
        : part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("+");
}

/** The `shortcuts.value` key of a nav item. */
export function itemShortcutKey(id: string): string {
  return `item:${id}`;
}

/** The `shortcuts.value` key of an item action. */
export function actionShortcutKey(id: string): string {
  return `action:${id}`;
}
