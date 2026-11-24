import React from "react";
import { renderToString } from "react-dom/server";
import { act, renderHook } from "@testing-library/react";
import {
  ariaKeyShortcut,
  formatShortcut,
  isReservedShortcut,
  normalizeShortcut,
  shortcutFromEvent,
  type ShortcutKeyEvent,
} from "../custom/app-shell/shortcuts";
import {
  DEFAULT_SHORTCUTS_STORAGE_KEY,
  useStoredShortcuts,
} from "../custom/app-shell/use-stored-shortcuts";

function press(init: Partial<ShortcutKeyEvent>): ShortcutKeyEvent {
  return {
    key: "",
    code: "",
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    ...init,
  };
}

describe("shortcutFromEvent", () => {
  it("writes modifiers in a fixed order before the key", () => {
    expect(
      shortcutFromEvent(
        press({ key: "H", code: "KeyH", shiftKey: true, ctrlKey: true })
      )
    ).toBe("ctrl+shift+h");
    expect(
      shortcutFromEvent(
        press({ key: "1", code: "Digit1", metaKey: true, altKey: true })
      )
    ).toBe("alt+meta+1");
  });

  it("takes letters and digits from the physical key", () => {
    // Alt+H types "˙" on a Mac; the shortcut is still alt+h.
    expect(
      shortcutFromEvent(press({ key: "˙", code: "KeyH", altKey: true }))
    ).toBe("alt+h");
    expect(
      shortcutFromEvent(press({ key: "!", code: "Digit1", altKey: true }))
    ).toBe("alt+1");
  });

  it("names other keys by their key", () => {
    expect(
      shortcutFromEvent(
        press({ key: "ArrowUp", code: "ArrowUp", altKey: true })
      )
    ).toBe("alt+arrowup");
    expect(
      shortcutFromEvent(press({ key: " ", code: "Space", ctrlKey: true }))
    ).toBe("ctrl+space");
    expect(
      shortcutFromEvent(press({ key: "+", code: "Equal", ctrlKey: true }))
    ).toBe("ctrl+plus");
  });

  it("is null for a lone modifier, no Ctrl/Alt/⌘, composing or AltGr", () => {
    expect(
      shortcutFromEvent(
        press({ key: "Control", code: "ControlLeft", ctrlKey: true })
      )
    ).toBeNull();
    expect(shortcutFromEvent(press({ key: "a", code: "KeyA" }))).toBeNull();
    expect(
      shortcutFromEvent(press({ key: "A", code: "KeyA", shiftKey: true }))
    ).toBeNull();
    expect(
      shortcutFromEvent(
        press({ key: "a", code: "KeyA", ctrlKey: true, isComposing: true })
      )
    ).toBeNull();
    expect(
      shortcutFromEvent(
        press({
          key: "@",
          code: "KeyQ",
          ctrlKey: true,
          altKey: true,
          getModifierState: (key) => key === "AltGraph",
        })
      )
    ).toBeNull();
    expect(shortcutFromEvent(press({ ctrlKey: true }))).toBeNull();
  });
});

describe("normalizeShortcut", () => {
  it("reads any order, case and alias", () => {
    expect(normalizeShortcut("Shift+Ctrl+H")).toBe("ctrl+shift+h");
    expect(normalizeShortcut("cmd+option+k")).toBe("alt+meta+k");
    expect(normalizeShortcut("Control + Space")).toBe("ctrl+space");
    expect(normalizeShortcut("ctrl++")).toBe("ctrl+plus");
    expect(normalizeShortcut("F12")).toBe("f12");
  });

  it("is null without a key, with two keys, or without Ctrl/Alt/⌘", () => {
    expect(normalizeShortcut("ctrl+shift")).toBeNull();
    expect(normalizeShortcut("ctrl+a+b")).toBeNull();
    expect(normalizeShortcut("h")).toBeNull();
  });
});

describe("isReservedShortcut", () => {
  it.each([
    "ctrl+k",
    "meta+k",
    "ctrl+shift+k",
    "alt+meta+k",
    "ctrl+b",
    "meta+b",
    "ctrl+t",
    "meta+w",
    "ctrl+shift+i",
    "alt+arrowleft",
    "ctrl+1",
  ])("reserves %s", (combo) => {
    expect(isReservedShortcut(combo)).toBe(true);
  });

  it.each(["ctrl+shift+e", "alt+i", "alt+shift+o", "ctrl+alt+r"])(
    "leaves %s free",
    (combo) => {
      expect(isReservedShortcut(combo)).toBe(false);
    }
  );

  it("adds the app's own, written any way", () => {
    expect(isReservedShortcut("alt+shift+x", ["Shift+Alt+X"])).toBe(true);
    expect(isReservedShortcut("alt+x", ["Shift+Alt+X"])).toBe(false);
  });
});

describe("formatShortcut and ariaKeyShortcut", () => {
  it("formats a shortcut for display and for aria-keyshortcuts", () => {
    expect(formatShortcut("ctrl+shift+h")).toEqual(["Ctrl", "Shift", "H"]);
    expect(formatShortcut("meta+arrowup")).toEqual(["⌘", "↑"]);
    expect(ariaKeyShortcut("ctrl+shift+h")).toBe("Control+Shift+H");
    expect(ariaKeyShortcut("alt+meta+plus")).toBe("Alt+Meta+Plus");
  });
});

describe("useStoredShortcuts", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    window.localStorage.clear();
  });

  it("reads and writes localStorage under the default key", () => {
    window.localStorage.setItem(
      DEFAULT_SHORTCUTS_STORAGE_KEY,
      JSON.stringify({ "item:a": "alt+a" })
    );
    const { result } = renderHook(() => useStoredShortcuts());
    expect(result.current.value).toEqual({ "item:a": "alt+a" });
    act(() => result.current.onChange({ "item:b": "alt+b" }));
    expect(result.current.value).toEqual({ "item:b": "alt+b" });
    expect(
      JSON.parse(
        window.localStorage.getItem(DEFAULT_SHORTCUTS_STORAGE_KEY) as string
      )
    ).toEqual({ "item:b": "alt+b" });
  });

  it("keeps a stable value between renders", () => {
    const { result, rerender } = renderHook(() => useStoredShortcuts("stable"));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it("reads bad data as no shortcuts and drops values that are not strings", () => {
    window.localStorage.setItem("broken", "{not json");
    window.localStorage.setItem("array", "[1,2]");
    window.localStorage.setItem(
      "mixed",
      JSON.stringify({ "item:a": "alt+a", "item:b": 3, "item:c": "" })
    );
    expect(
      renderHook(() => useStoredShortcuts("broken")).result.current.value
    ).toEqual({});
    expect(
      renderHook(() => useStoredShortcuts("array")).result.current.value
    ).toEqual({});
    expect(
      renderHook(() => useStoredShortcuts("mixed")).result.current.value
    ).toEqual({
      "item:a": "alt+a",
    });
  });

  it("keeps working in memory when storage throws", () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { result } = renderHook(() => useStoredShortcuts("throws"));
    expect(result.current.value).toEqual({});
    act(() => result.current.onChange({ "item:a": "alt+a" }));
    expect(result.current.value).toEqual({ "item:a": "alt+a" });
  });

  it("follows another tab's change", () => {
    const { result } = renderHook(() => useStoredShortcuts("shared"));
    act(() => {
      window.localStorage.setItem(
        "shared",
        JSON.stringify({ "item:x": "alt+x" })
      );
      window.dispatchEvent(new StorageEvent("storage", { key: "shared" }));
    });
    expect(result.current.value).toEqual({ "item:x": "alt+x" });
  });

  it("sees no shortcuts on the server", () => {
    window.localStorage.setItem(
      "server",
      JSON.stringify({ "item:a": "alt+a" })
    );
    function Probe() {
      const { value } = useStoredShortcuts("server");
      return <span>{Object.keys(value).length}</span>;
    }
    expect(renderToString(<Probe />)).toBe("<span>0</span>");
  });
});
