"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@repo/ayasofyazilim-ui/components/button";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import {
  DEFAULT_ANNOTATED_DOCUMENT_VIEWER_LABELS,
  type DocumentPagerProps,
} from "./types";

/**
 * `‹ Page x of y ›`. Renders nothing for a single page. The viewer overlays one by default; place
 * it yourself (in a toolbar, say) with `pager={false}` on the viewer.
 */
export function DocumentPager({
  pageIndex,
  pageCount,
  onPageChange,
  labels,
  className,
}: DocumentPagerProps) {
  if (pageCount <= 1) return null;

  const previousPage =
    labels?.previousPage ?? DEFAULT_ANNOTATED_DOCUMENT_VIEWER_LABELS.previousPage;
  const nextPage =
    labels?.nextPage ?? DEFAULT_ANNOTATED_DOCUMENT_VIEWER_LABELS.nextPage;
  const pageOf = labels?.pageOf ?? DEFAULT_ANNOTATED_DOCUMENT_VIEWER_LABELS.pageOf;

  return (
    <div
      data-slot="document-pager"
      className={cn(
        "bg-popover text-popover-foreground inline-flex items-center gap-1 rounded-full border p-0.5 shadow-md",
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="rounded-full"
        aria-label={previousPage}
        disabled={pageIndex <= 0}
        onClick={() => onPageChange(pageIndex - 1)}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <span
        aria-live="polite"
        className="text-muted-foreground px-1 text-xs whitespace-nowrap tabular-nums"
      >
        {pageOf(pageIndex + 1, pageCount)}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="rounded-full"
        aria-label={nextPage}
        disabled={pageIndex >= pageCount - 1}
        onClick={() => onPageChange(pageIndex + 1)}
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  );
}
