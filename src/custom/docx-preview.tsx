"use client";

import { cn } from "@ayasofyazilim-clomerce/ui/lib/utils";
import { useEffect, useRef, useState } from "react";

export type DocxPreviewProps = {
  file: Blob | ArrayBuffer;
  /** "width" (default) scales the rendered page down to the container width and refits on resize. */
  fit?: "width" | "none";
  labels?: { loading?: string; error?: string };
  onError?: (error: unknown) => void;
  className?: string;
};

const DEFAULT_LABELS = {
  loading: "Rendering preview…",
  error: "This document could not be previewed.",
};

const STAGE_PADDING = 24;

function toArrayBuffer(file: Blob | ArrayBuffer): Promise<ArrayBuffer> {
  if (file instanceof ArrayBuffer) return Promise.resolve(file);
  if (typeof file.arrayBuffer === "function") return file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/** Client-side Word (.docx) preview. Loads docx-preview lazily; reflow only, no overlay. */
export function DocxPreview({
  file,
  fit = "width",
  labels,
  onError,
  className,
}: DocxPreviewProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const generation = useRef(0);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const text = { ...DEFAULT_LABELS, ...labels };

  useEffect(() => {
    const body = bodyRef.current;
    const stage = stageRef.current;
    if (!body || !stage) return undefined;
    generation.current += 1;
    const mine = generation.current;
    const isCurrent = () => generation.current === mine;
    setStatus("loading");

    // Scale the natural-width page down to the stage (never above 1:1) and reserve
    // its scaled footprint so there is no gap or overflow.
    const refit = () => {
      const wrap = body.querySelector<HTMLElement>(".docx-wrapper");
      if (!wrap) return;
      // Make the wrapper hug the page's natural width (docx-preview's default is a
      // centred, full-width flex column), so offsetWidth is the page, not the panel.
      wrap.style.width = "max-content";
      wrap.style.padding = "0";
      wrap.style.background = "transparent";
      wrap.style.alignItems = "flex-start";
      wrap.style.transform = "none";
      body.style.width = "";
      body.style.height = "";
      if (fit !== "width") return;
      const naturalW = wrap.offsetWidth;
      const naturalH = wrap.offsetHeight;
      if (!naturalW) return;
      const scale = Math.min(1, (stage.clientWidth - STAGE_PADDING) / naturalW);
      wrap.style.transformOrigin = "top left";
      wrap.style.transform = `scale(${scale})`;
      body.style.width = `${naturalW * scale}px`;
      body.style.height = `${naturalH * scale}px`;
    };

    // Render into an attached but hidden staging node (docx-preview measures layout for tab
    // stops and page breaks, which a detached node cannot do). A stale render only ever
    // touches its own staging node, never the visible body.
    const target = document.createElement("div");
    target.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;top:0;left:0;width:${stage.clientWidth}px`;
    stage.appendChild(target);
    (async () => {
      try {
        const { renderAsync } = await import("docx-preview");
        const buffer = await toArrayBuffer(file);
        if (!isCurrent()) return;
        await renderAsync(buffer, target, undefined, {
          className: "docx",
          inWrapper: true,
          useBase64URL: true,
          ignoreLastRenderedPageBreak: true,
        });
        if (!isCurrent()) return;
        body.replaceChildren(...Array.from(target.childNodes));
        target.remove();
        refit();
        setStatus("ready");
      } catch (error) {
        if (!isCurrent()) return;
        setStatus("error");
        onErrorRef.current?.(error);
      }
    })();

    const observer =
      fit === "width" && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => refit())
        : undefined;
    observer?.observe(stage);
    return () => {
      generation.current += 1;
      observer?.disconnect();
      target.remove();
      body.replaceChildren();
    };
  }, [file, fit]);

  return (
    <div
      ref={stageRef}
      className={cn("relative w-full overflow-auto p-3", className)}
      data-status={status}
    >
      {status !== "ready" && (
        <div
          className="text-muted-foreground flex items-center justify-center p-6 text-sm"
          role={status === "error" ? "alert" : "status"}
        >
          <span>{status === "error" ? text.error : text.loading}</span>
        </div>
      )}
      <div
        ref={bodyRef}
        style={{ display: status === "ready" ? "block" : "none" }}
      />
    </div>
  );
}
