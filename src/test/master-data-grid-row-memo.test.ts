import {
  createTable,
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  type ColumnDef,
  type Row,
  type Table,
  type TableOptionsResolved,
  type TableState,
  type Updater,
} from "@tanstack/react-table";
import {
  rowRenderState,
  sameRenderState,
  sameTree,
  type RowRenderOptions,
} from "../custom/master-data-grid/utils/row-memo";

/**
 * rowRenderState is what `memoizeRows` compares. Each input is changed alone
 * here, on a bare TanStack table, so every one is shown to invalidate the
 * memo even where the grid today would also rebuild its columns (a data
 * change rebuilds them, for one).
 */

interface Item {
  id: string;
  name: string;
  kind: string;
  children?: Item[];
}

const items: Item[] = [
  { id: "a", name: "A", kind: "x" },
  {
    id: "b",
    name: "B",
    kind: "x",
    children: [{ id: "b1", name: "B1", kind: "y" }],
  },
  { id: "c", name: "C", kind: "y" },
  {
    id: "d",
    name: "D",
    kind: "y",
    children: [
      { id: "d1", name: "D1", kind: "x" },
      { id: "d2", name: "D2", kind: "x" },
    ],
  },
];

const columns: ColumnDef<Item>[] = [
  { id: "name", accessorKey: "name" },
  { id: "kind", accessorKey: "kind" },
];

/** A table whose state lives in this harness, as the grid's does in React. */
function makeTable(
  options: Partial<TableOptionsResolved<Item>> = {}
): Table<Item> {
  let state: Partial<TableState> = {};
  const table = createTable<Item>({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (item) => item.children,
    getRowId: (item) => item.id,
    enableSubRowSelection: false,
    renderFallbackValue: null,
    state: {},
    onStateChange: () => {},
    ...options,
  } as TableOptionsResolved<Item>);
  const sync = () =>
    table.setOptions((prev) => ({
      ...prev,
      state: { ...table.initialState, ...state },
      onStateChange: (updater: Updater<TableState>) => {
        const full = { ...table.initialState, ...state } as TableState;
        state = typeof updater === "function" ? updater(full) : updater;
        sync();
      },
    }));
  sync();
  return table;
}

const rowById = (table: Table<Item>, id: string): Row<Item> =>
  table.getRowModel().rowsById[id] ?? table.getCoreRowModel().rowsById[id]!;

const normal: RowRenderOptions<Item> = { mode: "normal" };
const snap = (
  table: Table<Item>,
  id: string,
  options: RowRenderOptions<Item> = normal
) => rowRenderState(rowById(table, id), options);

describe("rowRenderState: each input alone invalidates the memo", () => {
  it("is equal across renders that change nothing", () => {
    const table = makeTable();
    expect(sameRenderState(snap(table, "a"), snap(table, "a"))).toBe(true);
  });

  it("a new row object (data change), with the columns unchanged", () => {
    const table = makeTable();
    const before = snap(table, "a");
    table.setOptions((prev) => ({
      ...prev,
      data: items.map((item) =>
        item.id === "a" ? { ...item, name: "A2" } : item
      ),
    }));
    expect(sameRenderState(before, snap(table, "a"))).toBe(false);
  });

  it("selected, on the same row object", () => {
    const table = makeTable();
    const row = rowById(table, "a");
    const before = rowRenderState(row, normal);
    row.toggleSelected(true);
    expect(rowById(table, "a")).toBe(row);
    expect(sameRenderState(before, rowRenderState(row, normal))).toBe(false);
  });

  it("all sub-rows selected, on a parent with one child", () => {
    const table = makeTable();
    const before = snap(table, "b");
    rowById(table, "b1").toggleSelected(true);
    // None to all: "some" stays false, so only "all" changes.
    expect(rowById(table, "b").getIsSomeSelected()).toBe(false);
    expect(rowById(table, "b").getIsAllSubRowsSelected()).toBe(true);
    expect(sameRenderState(before, snap(table, "b"))).toBe(false);
  });

  it("some sub-rows selected, on a parent with two children", () => {
    const table = makeTable();
    const before = snap(table, "d");
    rowById(table, "d1").toggleSelected(true);
    expect(rowById(table, "d").getIsSomeSelected()).toBe(true);
    expect(rowById(table, "d").getIsAllSubRowsSelected()).toBe(false);
    expect(sameRenderState(before, snap(table, "d"))).toBe(false);
  });

  it("can select (enableRowSelection reading outside state)", () => {
    let allowed = false;
    const table = makeTable({ enableRowSelection: () => allowed });
    const before = snap(table, "a");
    allowed = true;
    expect(sameRenderState(before, snap(table, "a"))).toBe(false);
  });

  it("can expand (getRowCanExpand reading outside state)", () => {
    let expandable = false;
    const table = makeTable({ getRowCanExpand: () => expandable });
    const before = snap(table, "a");
    expandable = true;
    expect(sameRenderState(before, snap(table, "a"))).toBe(false);
  });

  it("expanded, on the same row object", () => {
    const table = makeTable();
    const row = rowById(table, "b");
    const before = rowRenderState(row, normal);
    row.toggleExpanded(true);
    expect(sameRenderState(before, rowRenderState(row, normal))).toBe(false);
  });

  it("depth and parent, which grouping rewrites on the same row object", () => {
    const table = makeTable({
      getSubRows: undefined,
      getGroupedRowModel: getGroupedRowModel(),
    });
    const row = table.getCoreRowModel().rowsById["a"]!;
    const before = rowRenderState(row, normal);
    table.setGrouping(["kind"]);
    // The grouped model reuses the core row and moves it under a group.
    expect(table.getRowModel().flatRows).toContain(row);
    expect(row.depth).toBe(1);
    expect(sameRenderState(before, rowRenderState(row, normal))).toBe(false);
  });

  it("its editing entry, and not another row's", () => {
    const table = makeTable({ getSubRows: undefined });
    const getRowId = (item: Item) => item.id;
    const editing = (editingRows: Record<string, Record<string, unknown>>) =>
      snap(table, "a", { mode: "normal", editingRows, getRowId });
    const idle = editing({});
    expect(sameRenderState(idle, editing({ c: {} }))).toBe(true);
    expect(sameRenderState(idle, editing({ a: {} }))).toBe(false);
    const entry = { name: "x" };
    expect(
      sameRenderState(editing({ a: entry }), editing({ a: { ...entry } }))
    ).toBe(false);
  });

  it("the column objects (rebuilt column definitions)", () => {
    const table = makeTable();
    const before = snap(table, "a");
    table.setOptions((prev) => ({
      ...prev,
      columns: columns.map((column) => ({ ...column })),
    }));
    expect(sameRenderState(before, snap(table, "a"))).toBe(false);
  });

  it("visibility and order", () => {
    const table = makeTable();
    const before = snap(table, "a");
    table.setColumnVisibility({ kind: false });
    const hidden = snap(table, "a");
    expect(sameRenderState(before, hidden)).toBe(false);
    table.setColumnVisibility({});
    expect(sameRenderState(before, snap(table, "a"))).toBe(true);
    table.setColumnOrder(["kind", "name"]);
    expect(sameRenderState(before, snap(table, "a"))).toBe(false);
  });

  it("pinning the first column (the order stays the same)", () => {
    const table = makeTable();
    const before = snap(table, "a");
    table.setColumnPinning({ left: ["name"] });
    const cells = rowById(table, "a").getVisibleCells();
    expect(cells.map((cell) => cell.column.id)).toEqual(["name", "kind"]);
    expect(sameRenderState(before, snap(table, "a"))).toBe(false);
  });

  it("a pinned column's left neighbour resized (its sticky offset moves)", () => {
    const table = makeTable();
    table.setColumnPinning({ left: ["name", "kind"] });
    const before = snap(table, "a");
    table.setColumnSizing({ name: 300 });
    const after = snap(table, "a");
    expect(sameRenderState(before, after)).toBe(false);
    expect(
      rowById(table, "a").getVisibleCells()[1]!.column.getStart("left")
    ).toBe(300);
  });

  // No filtered, sorted or grouped row model here, as under a manual
  // (server) filter, sort or grouping: the rows are untouched, so only the
  // column's own state can tell a cell that shows it to re-render.
  it("its column's filter value", () => {
    const table = makeTable();
    const before = snap(table, "a");
    table.setColumnFilters([{ id: "name", value: "A" }]);
    expect(
      rowById(table, "a").getVisibleCells()[0]!.column.getFilterValue()
    ).toBe("A");
    expect(sameRenderState(before, snap(table, "a"))).toBe(false);
  });

  it("its column's sort direction", () => {
    const table = makeTable();
    const before = snap(table, "a");
    table.setSorting([{ id: "name", desc: true }]);
    expect(sameRenderState(before, snap(table, "a"))).toBe(false);
  });

  it("its column's grouped state (the first column, so the order stays)", () => {
    const table = makeTable();
    const before = snap(table, "a");
    table.setGrouping(["name"]);
    const cells = rowById(table, "a").getVisibleCells();
    expect(cells.map((cell) => cell.column.id)).toEqual(["name", "kind"]);
    expect(sameRenderState(before, snap(table, "a"))).toBe(false);
  });

  it("a column size", () => {
    const table = makeTable();
    const before = snap(table, "a");
    table.setColumnSizing({ kind: 250 });
    expect(sameRenderState(before, snap(table, "a"))).toBe(false);
  });

  it("the resolved row class, not the function's identity", () => {
    const table = makeTable();
    let lit = "A";
    const rowClassName = (item: Item) => (item.name === lit ? "lit" : "");
    const options = { mode: "normal" as const, rowClassName };
    const before = snap(table, "a", options);
    expect(
      sameRenderState(
        before,
        snap(table, "a", {
          ...options,
          rowClassName: (item: Item) => (item.name === "A" ? "lit" : ""),
        })
      )
    ).toBe(true);
    lit = "C";
    expect(sameRenderState(before, snap(table, "a", options))).toBe(false);
  });

  it("the resolved cell classes", () => {
    const table = makeTable();
    let marked = "name";
    const cellClassName = ({ columnId }: { columnId: string }) =>
      columnId === marked ? "marked" : "";
    const before = snap(table, "a", { mode: "normal", cellClassName });
    marked = "kind";
    expect(
      sameRenderState(
        before,
        snap(table, "a", { mode: "normal", cellClassName })
      )
    ).toBe(false);
  });
});

describe("sameTree compares the tree options by value", () => {
  const tree = {
    expanderColumn: "name",
    indent: 1.25,
    labels: { expand: "Expand", collapse: "Collapse" },
  };
  it.each([
    ["an equal copy", { ...tree, labels: { ...tree.labels } }, true],
    ["another expander column", { ...tree, expanderColumn: "kind" }, false],
    ["another indent", { ...tree, indent: 2 }, false],
    [
      "another expand label",
      { ...tree, labels: { ...tree.labels, expand: "Open" } },
      false,
    ],
    [
      "another collapse label",
      { ...tree, labels: { ...tree.labels, collapse: "Close" } },
      false,
    ],
    ["none", undefined, false],
  ] as const)("%s", (_name, other, same) => {
    expect(sameTree(tree, other)).toBe(same);
  });
});
