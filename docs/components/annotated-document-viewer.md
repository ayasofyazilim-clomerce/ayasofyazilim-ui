# AnnotatedDocumentViewer

`AnnotatedDocumentViewer` from `@repo/ayasofyazilim-ui/custom/annotated-document-viewer` shows one page image at a time inside a zoom/pan viewport, with an overlay of boxes (evidence, detections, highlights) drawn on top of the page. `DocumentPager` from the same path is its `‹ Page x of y ›` control, for consumers who place the pager themselves.

## When to use

- Showing where something was found on a document page: extraction evidence, OCR words, detected regions.
- Linking boxes to something outside the viewer (a results row, a list item): hover and click a box, or drive the emphasis from outside with `activeIds` / `relatedIds`.
- Any page image that needs 100–800% zoom with the marks staying on their words.

It is not a general document renderer. **PDFs are passed as page images rasterized by the consumer**: render each page to an image (for example with your own `pdfjs-dist` to a PNG data URL or an object URL) and pass it as `pages[i].src`. This component does not load pdf.js. For an inline PDF/Office preview without boxes, use `DocumentViewer`.

## Minimal example

```tsx
"use client";

import { useState } from "react";
import {
  AnnotatedDocumentViewer,
  type AnnotationBox,
} from "@repo/ayasofyazilim-ui/custom/annotated-document-viewer";

const boxes: AnnotationBox[] = [
  // Page fractions (0–1), origin top-left.
  { id: "total#0", page: 0, rect: [0.62, 0.81, 0.9, 0.85], group: "total", color: "#e11d48" },
  // Pixels of a known frame.
  { id: "date#0", page: 0, rect: [96, 120, 310, 150], frame: { width: 1240, height: 1754 }, group: "date", color: "#2563eb" },
];

export function Evidence({ pageUrls }: { pageUrls: (string | null)[] }) {
  const [pageIndex, setPageIndex] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <AnnotatedDocumentViewer
      pages={pageUrls.map((src) => ({ src }))}
      pageIndex={pageIndex}
      onPageChange={setPageIndex}
      boxes={boxes}
      activeIds={hovered ? [hovered] : []}
      onBoxHover={(box) => setHovered(box?.group ?? null)}
      labels={{ pageOf: (page, total) => t("PageOf", { page, total }) }}
    />
  );
}
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `pages` | `AnnotatedPage[]` | required | `{ src: string \| null; alt?: string }` per page; its length is the page count. `src: null` shows `labels.loading` (page not loaded yet). `alt` defaults to `labels.pageOf(page, total)`. |
| `pageIndex` | `number` | required | 0-based, controlled. |
| `onPageChange` | `(index) => void` | required | Called by the overlaid pager. |
| `boxes` | `AnnotationBox[]` | `[]` | Only the boxes with `page === pageIndex` are drawn. Ids must be unique. |
| `activeIds` | `readonly string[]` | none | Each entry matches a box `id` **or** a box `group`. Matching boxes are drawn "active" (opaque, thicker, glow). |
| `relatedIds` | `readonly string[]` | none | Same matching; drawn "related" (dashed). Active wins over related. |
| `onBoxHover` | `(box \| null) => void` | none | The box under the pointer, then `null` when it leaves. |
| `onBoxClick` | `(box) => void` | none | A click on a box. A click that ends a drag-pan (pointer moved 4 px or more since `pointerdown`) is ignored. |
| `minZoom` / `maxZoom` | `number` | `1` / `8` | Multiples of the fitted page. The viewer starts and resets at 1 clamped into this range. |
| `pager` | `boolean` | `true` | An overlaid pager at the top of the stage (hidden for one page). `false` when you render `DocumentPager` yourself. |
| `labels` | `AnnotatedDocumentViewerLabels` | English | See below. |
| `className` | `string` | none | Merged onto the root. |
| `classNames` | `{ root, stage, page, box, pager, zoom }` | none | Slot overrides: the root, the bordered stage, the page `<img>`, every box `<rect>`, the overlaid pager, the zoom pill. |

`AnnotationBox`:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `string` | Unique. Rendered as `data-box-id` on the rect. |
| `page` | `number` | 0-based. |
| `rect` | `readonly [x0, y0, x1, y1]` | 0–1 page fractions unless `frame` is set. Corners may come in any order. |
| `frame` | `{ width, height } \| "natural"` | The pixel frame `rect` is measured in. `"natural"` is the page image's natural size; such a box appears once the image has decoded. |
| `rotation` | `0 \| 90 \| 180 \| 270` | Degrees the page IMAGE is turned counter-clockwise relative to `rect`'s frame. |
| `group` | `string` | Lets `activeIds` / `relatedIds` name several boxes at once (a field key, say). |
| `color` | `string` | Any CSS colour; outline, fill and glow use it. Without it the box uses the `primary` token. |
| `label` | `string` | The box's native tooltip, shown only when the boxes take pointer events. |

`DocumentPager` props: `pageIndex`, `pageCount`, `onPageChange`, `labels` (`previousPage`, `nextPage`, `pageOf`), `className`. It returns `null` when `pageCount <= 1`.

## Labels

Every visible or announced string comes from `labels`; anything left out (or passed as `undefined`) falls back to English.

| Key | Default | Rendered as |
| --- | --- | --- |
| `previousPage` | `"Previous page"` | pager button `aria-label` |
| `nextPage` | `"Next page"` | pager button `aria-label` |
| `pageOf(page, total)` | `"Page {page} of {total}"` | pager text (`page` is 1-based), and the default `alt` |
| `zoom` | `"Zoom"` | zoom pill `aria-label` (`role="group"`) |
| `zoomIn` / `zoomOut` / `resetZoom` | `"Zoom in"` / `"Zoom out"` / `"Reset zoom"` | zoom button `aria-label`s |
| `loading` | `"Loading…"` | text of a page whose `src` is `null` |

The zoom readout (`140%`) is a number, not a label.

## Geometry helpers

Also exported. They are pure (no React) and live in `geometry.ts`, which has no `"use client"`: server code, which must not read plain exports from a client module, can import them from `@repo/ayasofyazilim-ui/custom/annotated-document-viewer/geometry` (resolved through the `./custom/*.ts` export).

- `toPageFraction(box, natural?)`: the box's rect as 0–1 fractions of the image on screen, corners ordered. A `frame` is divided out first, then `rotation` is applied. Returns `null` while a `"natural"` frame's size is unknown (or for a zero-sized frame).
- `rotateRect(rect, rotation)`: maps a fraction rect onto an image turned `rotation` degrees counter-clockwise. The angle is normalised (−90 is 270, 450 is 90); a non-cardinal angle is the identity.
- `markStrokeWidth(zoom, base = 2, cap = 2.5)`: `min(base / zoom, cap)`, the stroke width that keeps a mark `base` px wide on screen at `zoom`.

Example: a box measured in a scan's ORIGINAL frame, shown on an upright raster the scan was turned 90° counter-clockwise to produce, is `{ rect, rotation: 90 }`.

## How it stays aligned

- The `<img>` and the overlay `<svg viewBox="0 0 1 1" preserveAspectRatio="none">` sit inside the same transformed element, so the boxes stay on their words at every zoom and pan offset. Do not move either out of it when styling.
- The viewer publishes `--annotation-zoom` (the live scale) and `--annotation-stroke` (`markStrokeWidth` of it, in px) on the stage, and `data-magnified="true|false"`. Box outlines use `vector-effect: non-scaling-stroke` with `--annotation-stroke`, and the glow and dash divide by `--annotation-zoom`, so marks keep a constant on-screen width. Anything you add over the page that must keep its on-screen size can divide by `--annotation-zoom` too.
- Panning is armed only above 101%. At fit, `touch-action` is `pan-y`, so a finger on the page still scrolls a phone's page; once magnified it is `none` and the cursor is `grab`.
- A new `src` (another page) and every image load re-centre the page at the fitted scale.

## Pointer events

- The overlay has `pointer-events: none`. Boxes take pointer events only when `onBoxHover` or `onBoxClick` is passed; otherwise they never block a drag or a double-click.
- A drag that starts on a box still pans the page; the click that ends it does not reach `onBoxClick`.
- Boxes are `aria-hidden`. Keep the information they carry reachable elsewhere (the row or list they link to).

## Styling

Each element carries a `data-slot` (`annotated-document-viewer`, `annotated-document-stage`, `document-pager`, `annotated-document-zoom`), and each box `data-box-id` and `data-state="active" | "related"` (absent at rest). The page image is capped at `max-h-[80vh]`; pass a different cap through `classNames.page` (for example `max-h-[var(--doc-preview-max-h)]`).

## Common mistakes

- **Passing a PDF URL as `src`.** Rasterize each page and pass the image.
- **Duplicate box ids**, or a group name equal to some box id: `activeIds` matches both.
- **`frame: "natural"` with `rotation` 90/270.** `"natural"` is the displayed image's size; a rect measured in the unrotated frame needs that frame as an explicit `{ width, height }`.
- **Expecting the viewer to follow the active box to its page.** `pageIndex` is controlled: when emphasis moves to a box on another page, call your own `setPageIndex(box.page)`.
- **Uncontrolled hover state.** `onBoxHover(null)` fires when the pointer leaves a box, but not when the box disappears under a resting pointer (the page or the box list changes); clear your own hover state then.
