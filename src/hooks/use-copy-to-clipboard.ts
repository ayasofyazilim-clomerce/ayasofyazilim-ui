"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useCopyToClipboard(options?: { resetAfterMs?: number }) {
  const resetAfterMs = options?.resetAfterMs ?? 2000;
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      clearTimeout(timer.current);
      try {
        const clipboard =
          typeof navigator === "undefined" ? undefined : navigator.clipboard;
        if (!clipboard || typeof clipboard.writeText !== "function") {
          setCopied(false);
          return false;
        }
        await clipboard.writeText(text);
        setCopied(true);
        timer.current = setTimeout(() => setCopied(false), resetAfterMs);
        return true;
      } catch {
        setCopied(false);
        return false;
      }
    },
    [resetAfterMs]
  );

  return { copied, copy };
}
