"use client";

import { memo, useEffect, useRef } from "react";
import { cn } from "@ayasofyazilim-clomerce/ui/lib/utils";
import type { AnnotatedPage } from "./types";

type ThumbnailStripProps = {
  pages: readonly AnnotatedPage[];
  pageIndex: number;
  onPageChange: (index: number) => void;
  onPageNeeded?: (index: number) => void;
  /** The strip's `aria-label`. */
  label: string;
  /** Each button's name. */
  pageN: (page: number) => string;
  /** Identifies the document: when it changes, every page may be requested again. */
  documentKey?: string | number;
  className?: string;
};

/** How far outside the strip a thumbnail counts as "scrolling into view", so its page starts rendering early. */
const NEAR_PX = 96;

/**
 * The page thumbnails: a button per page, vertical from the container's `@lg` width and horizontal below it. A loaded page
 * shows its own image (the full-page image, scaled by CSS: nothing is rendered twice); a page that
 * is not loaded yet shows its number, and asks `onPageNeeded` once when it scrolls into view.
 *
 * Memoized: it re-renders only when the page list, the current page or a callback changes, never
 * for the viewer's zoom or its boxes' emphasis.
 */
export const ThumbnailStrip = memo(function ThumbnailStrip({
  pages,
  pageIndex,
  onPageChange,
  onPageNeeded,
  label,
  pageN,
  documentKey,
  className,
}: ThumbnailStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const needed = useRef(onPageNeeded);
  const requested = useRef(new Set<number>());
  useEffect(() => {
    needed.current = onPageNeeded;
  });

  // Which pages have no image yet, as a stable key: the observer is rebuilt only when it changes.
  const unloaded = pages.flatMap((page, index) =>
    page.src === null ? [index] : []
  );
  const unloadedKey = unloaded.join(",");

  const pageCount = pages.length;
  const seen = useRef({ documentKey, pageCount });

  useEffect(() => {
    // A new document (its key, or its page count, changed) starts with nothing requested. The
    // `pages` identity is deliberately not a trigger: hosts build a new array whenever a page
    // loads, and resetting on that would ask again for pages still being rendered.
    if (
      seen.current.documentKey !== documentKey ||
      seen.current.pageCount !== pageCount
    ) {
      seen.current = { documentKey, pageCount };
      requested.current.clear();
    }
    const loaded = new Set(unloaded);
    // A page that arrived is forgotten, so it is asked for again if it ever goes back to not loaded.
    for (const index of [...requested.current]) {
      if (!loaded.has(index)) requested.current.delete(index);
    }
    if (typeof IntersectionObserver === "undefined" || !needed.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.pageIndex);
          if (!Number.isInteger(index) || requested.current.has(index))
            continue;
          requested.current.add(index);
          observer.unobserve(entry.target);
          needed.current?.(index);
        }
      },
      { root: stripRef.current, rootMargin: `${NEAR_PX}px` }
    );
    for (const index of unloaded) {
      const button = buttons.current[index];
      if (button && !requested.current.has(index)) observer.observe(button);
    }
    return () => observer.disconnect();
    // `unloaded` is derived from `unloadedKey`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unloadedKey, documentKey, pageCount, onPageNeeded === undefined]);

  // Keep the current page's thumbnail in view, scrolling only the strip (never the page around it).
  useEffect(() => {
    const strip = stripRef.current;
    const button = buttons.current[pageIndex];
    if (!strip || !button) return;
    const s = strip.getBoundingClientRect();
    const b = button.getBoundingClientRect();
    if (b.top < s.top) strip.scrollTop += b.top - s.top;
    else if (b.bottom > s.bottom) strip.scrollTop += b.bottom - s.bottom;
    if (b.left < s.left) strip.scrollLeft += b.left - s.left;
    else if (b.right > s.right) strip.scrollLeft += b.right - s.right;
  }, [pageIndex]);

  return (
    <div
      ref={stripRef}
      role="group"
      aria-label={label}
      data-slot="annotated-document-thumbnails"
      className={cn(
        "flex gap-2 overflow-auto p-1 @lg:max-h-[80vh] @lg:w-[72px] @lg:shrink-0 @lg:flex-col",
        className
      )}
    >
      {pages.map((page, index) => (
        <button
          key={index}
          ref={(el) => {
            buttons.current[index] = el;
          }}
          type="button"
          data-page-index={index}
          aria-label={pageN(index + 1)}
          aria-current={index === pageIndex ? "page" : undefined}
          onClick={() => onPageChange(index)}
          className="bg-background text-muted-foreground focus-visible:ring-ring/50 aria-[current=page]:ring-primary relative block aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-sm border outline-none focus-visible:ring-[3px] aria-[current=page]:ring-2 @lg:w-full"
        >
          {page.src ? (
            <img
              src={page.src}
              alt=""
              draggable={false}
              loading="lazy"
              decoding="async"
              className="size-full object-cover object-top"
            />
          ) : null}
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-x-0 bottom-0 text-center font-mono text-[10px] leading-4 tabular-nums",
              page.src
                ? "bg-background/80 text-foreground"
                : "inset-y-0 flex items-center justify-center text-xs"
            )}
          >
            {index + 1}
          </span>
        </button>
      ))}
    </div>
  );
});
