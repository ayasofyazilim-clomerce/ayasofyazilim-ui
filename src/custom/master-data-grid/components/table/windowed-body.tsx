"use no memo";
import type { Row, Table as TanStackTable } from "@tanstack/react-table";
import {
  defaultRangeExtractor,
  useVirtualizer,
  useWindowVirtualizer,
  type Range,
  type VirtualItem,
} from "@tanstack/react-virtual";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TableBody, TableCell, TableRow } from "../../../../components/table";
import type { RowEventsConfig, WindowedRowsConfig } from "../../types";
import { rowRenderState } from "../../utils/row-memo";
import type { TreeRowsRender } from "../../utils/tree-rows";
import {
  GridRow,
  MemoGridRow,
  WINDOWED_EXPANSION_ATTR,
  type GridRowProps,
} from "./grid-row";

const DEFAULT_ESTIMATE_SIZE = 36;
const DEFAULT_OVERSCAN = 12;
const SCROLLING_OVERFLOW = new Set(["auto", "scroll", "overlay"]);

/** What every drawn row shares, passed on to GridRow. */
interface RowOptions<TData> {
  rowClassName?: string | ((row: TData) => string);
  cellClassName?: string | ((cell: { row: TData; columnId: string }) => string);
  editingRows?: Record<string, Record<string, unknown>>;
  getRowId?: (row: TData, index: number) => string;
  editingEnabled?: boolean;
  expansionEnabled?: boolean;
  expansionRenderContent?: (row: TData) => React.ReactNode;
  /** Set only when the grid has tree rows (`subRows`). */
  tree?: TreeRowsRender;
  /** Set only when the grid has row callbacks (`rowEvents`). */
  rowEvents?: RowEventsConfig<TData>;
  /** `memoizeRows`: each data row re-renders only when what it draws changes. */
  memoizeRows?: boolean;
}

export interface WindowedBodyProps<TData> extends RowOptions<TData> {
  table: TanStackTable<TData>;
  /** The flattened visible rows (expanded tree rows included), in order. */
  rows: Row<TData>[];
  windowedRows: WindowedRowsConfig;
  /** Header rows above the body: a data row's `aria-rowindex` is this plus its index plus one. */
  headerRowCount: number;
  emptyMessage?: string;
  bodyClassName?: string;
}

/** What one window (element or document scroller) draws from. */
interface WindowProps<TData> extends RowOptions<TData> {
  rows: Row<TData>[];
  estimateSize: number;
  overscan: number;
  scrollMargin: number;
  /** Indexes drawn wherever the window is: the focused row, then `keepMountedIds`. */
  keepIndexes: readonly number[];
  colSpan: number;
  headerRowCount: number;
}

/** The scroller found for the body: an element, or `null` for the document. */
interface ScrollTarget {
  element: HTMLElement | null;
  /** Bumped on every change, so a new scroller gets a new window. */
  id: number;
}

/**
 * The nearest ancestor of `from` that scrolls vertically: computed
 * `overflow-y` auto, scroll or overlay, with content taller than its box. An
 * `overflow: auto` ancestor that grows with its content never scrolls (the
 * grid's own table wrapper is one), so it is passed over. `null`: the document.
 */
function findScrollElement(from: HTMLElement): HTMLElement | null {
  const doc = from.ownerDocument;
  const view = doc.defaultView;
  if (!view) return null;
  for (
    let el = from.parentElement;
    el && el !== doc.documentElement && el !== doc.scrollingElement;
    el = el.parentElement
  ) {
    if (
      SCROLLING_OVERFLOW.has(view.getComputedStyle(el).overflowY) &&
      el.scrollHeight - el.clientHeight > 1
    ) {
      return el;
    }
  }
  return null;
}

/** `scrollElement` when it gives an element, else the nearest scroller. */
function resolveScrollElement(
  body: HTMLElement,
  scrollElement: WindowedRowsConfig["scrollElement"]
): HTMLElement | null {
  const given = scrollElement?.();
  if (!given) return findScrollElement(body);
  const doc = given.ownerDocument;
  // The page's own scroller reports scroll events on the window.
  return given === doc.documentElement || given === doc.scrollingElement
    ? null
    : given;
}

/** The body's top, in the scroller's content (or the document's) coordinates. */
function bodyOffset(body: HTMLElement, scroller: HTMLElement | null): number {
  const top = body.getBoundingClientRect().top;
  if (!scroller) return top + (body.ownerDocument.defaultView?.scrollY ?? 0);
  return (
    top -
    scroller.getBoundingClientRect().top -
    scroller.clientTop +
    scroller.scrollTop
  );
}

/** A drawn row's height: the `<tr>`, plus its expansion row when open. */
function measureRow(row: HTMLTableRowElement): number {
  let height = row.offsetHeight;
  const next = row.nextElementSibling;
  if (next instanceof HTMLElement && next.hasAttribute(WINDOWED_EXPANSION_ATTR))
    height += next.offsetHeight;
  return height;
}

/** The index of the drawn row that holds `target`, if any. */
function rowIndexOf(
  body: HTMLElement,
  target: EventTarget | null
): number | undefined {
  let el = target instanceof Element ? target : null;
  while (el && el.parentElement !== body) el = el.parentElement;
  if (el?.hasAttribute(WINDOWED_EXPANSION_ATTR)) el = el.previousElementSibling;
  const index = el?.getAttribute("data-index");
  return index == null ? undefined : Number(index);
}

/** Padding for rows not drawn: no text, no border, no padding. */
function SpacerRow({ height, colSpan }: { height: number; colSpan: number }) {
  return (
    <tr aria-hidden="true">
      <td colSpan={colSpan} style={{ height, padding: 0, border: 0 }} />
    </tr>
  );
}

/**
 * The body for `windowedRows`: only the rows in the scroller's view (plus
 * `overscan`, the focused row and `keepMountedIds`) are drawn, in the normal
 * markup, with spacer rows for the rest. The scroller is found here; the
 * window itself is ElementWindow or DocumentWindow.
 */
export function WindowedBody<TData>({
  table,
  rows,
  windowedRows,
  headerRowCount,
  emptyMessage,
  bodyClassName,
  ...rowOptions
}: WindowedBodyProps<TData>) {
  const {
    estimateSize = DEFAULT_ESTIMATE_SIZE,
    overscan = DEFAULT_OVERSCAN,
    scrollElement,
    keepMountedIds,
  } = windowedRows;
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  const [target, setTarget] = useState<ScrollTarget | null>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const hasRows = rows.length > 0;

  // Read through a ref, so a new `scrollElement` function each render does not
  // re-run the scroller search (a forced layout) on every render.
  const scrollElementRef = useRef(scrollElement);
  useLayoutEffect(() => {
    scrollElementRef.current = scrollElement;
  });

  /** Finds the scroller and the body's offset in it; sets state only on change. */
  const sync = useCallback(() => {
    const body = bodyRef.current;
    if (!body) return;
    const element = resolveScrollElement(body, scrollElementRef.current);
    setTarget((prev) =>
      prev && prev.element === element
        ? prev
        : { element, id: (prev?.id ?? 0) + 1 }
    );
    const margin = Math.round(bodyOffset(body, element));
    setScrollMargin((prev) => (prev === margin ? prev : margin));
  }, []);

  // Before paint, so the first frame is already windowed; and again after
  // paint, when refs on ancestors (which `scrollElement` may read) are set.
  useLayoutEffect(() => {
    if (hasRows) sync();
  }, [hasRows, sync]);
  useEffect(() => {
    if (hasRows) sync();
  }, [hasRows, sync]);

  // Content above the grid, the table and the scroller change size: find the
  // scroller and the offset again.
  useEffect(() => {
    const body = bodyRef.current;
    const view = body?.ownerDocument.defaultView;
    if (!body || !target || !view?.ResizeObserver) return;
    const observer = new view.ResizeObserver(() => sync());
    const tableEl = body.closest("table");
    if (tableEl) observer.observe(tableEl);
    if (target.element) {
      observer.observe(target.element);
      for (const child of Array.from(target.element.children))
        observer.observe(child);
    } else {
      observer.observe(body.ownerDocument.body);
    }
    return () => observer.disconnect();
  }, [target, sync]);

  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((row, index) => map.set(row.id, index));
    return map;
  }, [rows]);
  const keep = new Set<number>();
  for (const id of [focusedId, ...(keepMountedIds ?? [])]) {
    const index = id == null ? undefined : indexById.get(id);
    if (index !== undefined) keep.add(index);
  }
  // A string, so the same rows give the same range extractor every render.
  const keepKey = Array.from(keep).join(",");
  const keepIndexes = useMemo(
    () => (keepKey ? keepKey.split(",").map(Number) : []),
    [keepKey]
  );

  // Track the row holding focus by id, so scrolling never unmounts it.
  const onFocus = (event: React.FocusEvent<HTMLTableSectionElement>) => {
    const index = rowIndexOf(event.currentTarget, event.target);
    const id = index === undefined ? undefined : rows[index]?.id;
    if (id !== undefined) setFocusedId(id);
  };
  const onBlur = (event: React.FocusEvent<HTMLTableSectionElement>) => {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !event.currentTarget.contains(next))
      setFocusedId(null);
  };

  const colSpan = table.getVisibleLeafColumns().length;
  const windowProps: WindowProps<TData> = {
    ...rowOptions,
    rows,
    estimateSize,
    overscan,
    scrollMargin,
    keepIndexes,
    colSpan,
    headerRowCount,
  };

  let content: React.ReactNode;
  if (!hasRows) {
    content = (
      <TableRow>
        <TableCell
          colSpan={table.getAllColumns().length}
          className="h-24 text-center"
        >
          {emptyMessage}
        </TableCell>
      </TableRow>
    );
  } else if (!target) {
    // No scroller yet (first render, server): the estimated full height, so
    // a scroller that will hold the rows overflows when it is looked for.
    content = (
      <SpacerRow height={rows.length * estimateSize} colSpan={colSpan} />
    );
  } else if (target.element) {
    content = (
      <ElementWindow
        key={target.id}
        scroller={target.element}
        {...windowProps}
      />
    );
  } else {
    content = <DocumentWindow key={target.id} {...windowProps} />;
  }

  return (
    <TableBody
      ref={bodyRef}
      className={bodyClassName}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {content}
    </TableBody>
  );
}

/** The options both windows share. */
function useWindowOptions<TData>({
  rows,
  estimateSize,
  overscan,
  scrollMargin,
  keepIndexes,
}: WindowProps<TData>) {
  // Keyed by row id: measured heights follow their rows when rows are
  // expanded, collapsed or sorted.
  const getItemKey = useCallback(
    (index: number) => rows[index]?.id ?? index,
    [rows]
  );
  const rangeExtractor = useCallback(
    (range: Range) => {
      const drawn = defaultRangeExtractor(range);
      const first = drawn[0] ?? 0;
      const last = drawn[drawn.length - 1] ?? -1;
      const extra = keepIndexes.filter(
        (index) => index < range.count && (index < first || index > last)
      );
      return extra.length ? [...drawn, ...extra].sort((a, b) => a - b) : drawn;
    },
    [keepIndexes]
  );
  return {
    count: rows.length,
    estimateSize: () => estimateSize,
    overscan,
    scrollMargin,
    getItemKey,
    rangeExtractor,
    measureElement: measureRow,
  };
}

/** A window scrolled by an element. */
function ElementWindow<TData>({
  scroller,
  ...props
}: WindowProps<TData> & { scroller: HTMLElement }) {
  const virtualizer = useVirtualizer<HTMLElement, HTMLTableRowElement>({
    ...useWindowOptions(props),
    getScrollElement: () => scroller,
    // Attaching writes this offset back to the scroller: keep where it is.
    initialOffset: () => scroller.scrollTop,
  });
  return (
    <>
      {renderWindow(
        virtualizer.getVirtualItems(),
        virtualizer.getTotalSize(),
        (node) => virtualizer.measureElement(node),
        props
      )}
    </>
  );
}

/** A window scrolled by the page. */
function DocumentWindow<TData>(props: WindowProps<TData>) {
  const virtualizer = useWindowVirtualizer<HTMLTableRowElement>(
    useWindowOptions(props)
  );
  return (
    <>
      {renderWindow(
        virtualizer.getVirtualItems(),
        virtualizer.getTotalSize(),
        (node) => virtualizer.measureElement(node),
        props
      )}
    </>
  );
}

/**
 * The drawn rows, with a spacer row above, below and in every gap between
 * them (kept rows make the drawn indexes non-contiguous). Item offsets
 * include `scrollMargin`; the total size does not.
 */
function renderWindow<TData>(
  items: VirtualItem[],
  totalSize: number,
  measure: (node: HTMLTableRowElement | null) => void,
  {
    rows,
    scrollMargin,
    colSpan,
    headerRowCount,
    memoizeRows,
    ...rowOptions
  }: WindowProps<TData>
): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let drawnTo = 0;
  for (const item of items) {
    const row = rows[item.index];
    if (!row) continue;
    const start = item.start - scrollMargin;
    if (start > drawnTo) {
      out.push(
        <SpacerRow
          key={`spacer:${row.id}`}
          height={start - drawnTo}
          colSpan={colSpan}
        />
      );
    }
    const rowProps: GridRowProps<TData> = {
      row,
      mode: "normal",
      rowClassName: rowOptions.rowClassName,
      cellClassName: rowOptions.cellClassName,
      editingRows: rowOptions.editingRows,
      getRowId: rowOptions.getRowId,
      editingEnabled: rowOptions.editingEnabled,
      expansionEnabled: rowOptions.expansionEnabled,
      expansionRenderContent: rowOptions.expansionRenderContent,
      tree: rowOptions.tree,
      rowEvents: rowOptions.rowEvents,
      windowed: {
        index: item.index,
        ariaRowIndex: headerRowCount + item.index + 1,
        ref: measure,
      },
    };
    out.push(
      memoizeRows ? (
        <MemoGridRow
          key={`row:${row.id}`}
          {...rowProps}
          renderState={rowRenderState(row, rowProps)}
        />
      ) : (
        <GridRow key={`row:${row.id}`} {...rowProps} />
      )
    );
    drawnTo = item.end - scrollMargin;
  }
  if (totalSize > drawnTo) {
    out.push(
      <SpacerRow
        key="spacer:end"
        height={totalSize - drawnTo}
        colSpan={colSpan}
      />
    );
  }
  return out;
}
