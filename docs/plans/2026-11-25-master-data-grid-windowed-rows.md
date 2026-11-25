# Plan: windowed rows for MasterDataGrid

Date: 2026-11-25. Component: `src/custom/master-data-grid`.

## Problem

A consuming app shows a results table of thousands of rows in a `MasterDataGrid`. Every row is in the DOM, so the
browser spends about 90 ms painting the whole table on each small state change, such as a hover highlight. Drawing
only the rows on screen removes that cost.

The existing `enableVirtualization` mode cannot be used for this:

- it pins the grid root to an inline `height: 600px`;
- it switches the table to `border-separate` and the header and rows to `mode="virtual"`, so cells look different;
- it finds its scroller with `closest(".overflow-auto")`.

The consumer's grid does not own its scroller: an ancestor far above it scrolls the page section. So this adds a new,
separate, opt-in mode and leaves `enableVirtualization` and `VirtualBody` as they are.

## Design

Public contract, in `types.ts` and exported from `custom/master-data-grid`:

```ts
windowedRows?: WindowedRowsConfig; // presence of the object turns the mode on

export interface WindowedRowsConfig {
  estimateSize?: number; // a row's height until measured, default 36
  overscan?: number; // rows drawn beyond the visible ones, each side, default 12
  scrollElement?: () => HTMLElement | null; // the element that scrolls the table
  keepMountedIds?: readonly string[]; // row ids (as getRowId yields them) always drawn
}
```

1. **Normal markup.** The normal branch keeps its `Table` classes, `GridHeader mode="normal"` and rows drawn by
   `GridRow`/`MemoGridRow` in `mode="normal"`: no fixed height, no `border-separate`. Only the body changes: a new
   `components/table/windowed-body.tsx`, chosen in `master-data-grid.tsx` when `windowedRows` is set.
   `enableVirtualization` wins when both are set.
2. **Scroller.** Walk up from the table body to the nearest ancestor whose computed `overflow-y` is `auto`, `scroll`
   or `overlay` and whose content is taller than its box; else the document. `scrollElement` overrides it. The
   "taller than its box" test is needed because the grid's own table wrapper is `overflow-auto` (so its
   `overflow-y` computes to `auto`) yet grows with its content in the consumer's layout: it never scrolls
   vertically there. Until a scroller is known, the body draws one spacer of the estimated total height, so a real
   scroller overflows. An element scroller uses `useVirtualizer` (with `initialOffset` read from it, so attaching
   never moves it); the document uses `useWindowVirtualizer`. A change of scroller remounts the window.
3. **`scrollMargin`.** The body's offset inside the scroller: `getBoundingClientRect` of the body against the
   scroller, plus its `scrollTop` (for the document: plus `scrollY`). Re-measured, together with the scroller
   choice, by a `ResizeObserver` on the table, the scroller and its children (for the document: `document.body`).
4. **Variable heights.** Each drawn row carries `data-index` and the virtualizer's measuring ref. A row's measured
   height includes its expansion row, which follows it as a sibling `<tr>`.
5. **Spacer rows.** `<tr aria-hidden="true"><td colSpan={visible columns} style={{ height, padding: 0, border: 0 }} /></tr>`,
   above, below and in any gap between drawn rows (kept rows make the drawn range non-contiguous). None when the
   height is 0.
6. **Row semantics.** In windowed mode only: `aria-rowcount` on the `<table>` (header rows plus model rows), and
   `aria-rowindex` on the header row (1) and on each drawn data row (index + 2).
7. **Kept rows.** A custom `rangeExtractor` adds, in order, the row that holds focus (tracked by row id through
   focus events on the body) and the rows in `keepMountedIds` to the normal range.
8. **Everything a normal body does.** Tree rows, `rowEvents`, `memoizeRows`, `rowClassName`/`cellClassName`,
   expansion rows, selection, select-all, `bodyClassName` and the empty message. The virtualizer counts the
   flattened visible rows and keys them by row id, so expanding or collapsing keeps the scroll position and the
   measured heights follow their rows. `MemoGridRow` compares the new index props, so a memoized row redraws when
   its position changes.
9. **No new strings.** Nothing here shows text.

`GridRow` and `GridHeader` get optional props that add the attributes above; without them they render exactly as
before, so existing grids (normal and virtual) do not change.

## Out of scope

- Grouping: with `grouping.enabled` the grid ignores `windowedRows` and draws the normal body, which has the group
  header rows.
- Horizontal (column) windowing.
- Changing `enableVirtualization` or `VirtualBody`.
- Server-rendered rows: the server draws the spacer only; rows draw once the client has found the scroller.

## Risks

- Layout cannot be checked in jsdom. Tests mock sizes; scroll alignment, the sticky header, `scrollMargin`
  re-measurement and focus need a check in a real browser.
- The sticky `<thead>` sticks to its nearest scroll container, which is the table wrapper (`overflow-x: auto`). In a
  layout where an ancestor scrolls, the header does not stick today either; windowed mode does not change that.
- Rows measured as `<tr>`: `offsetHeight` of a table row. Browsers differ on borders in the collapsing border model.
- Keyboard: Tab cannot reach rows that are not drawn. The focused row is kept, but the mode should be turned on only
  for large row sets.
- `aria-rowcount` counts the rows of the current page when pagination is on.
