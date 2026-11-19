// Import the helper FIRST: its jest.mock calls must register before the grid loads.
import { setupGridMocks, testResources } from "./helpers/grid-test-setup";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { MasterDataGrid } from "../custom/master-data-grid";
import type {
  ColumnConfig,
  MasterDataGridConfig,
  RowEventsConfig,
} from "../custom/master-data-grid";

/**
 * `memoizeRows`: a body row re-renders only when something it draws changes.
 * A probe column counts its cell's renders per row (TanStack renders a cell
 * function as a component, so it runs exactly when its row renders), and every
 * case also checks that the DOM shows the new state.
 */

// Virtual mode needs layout, which jsdom lacks. Render every row.
jest.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, i) => ({
        index: i,
        start: i * 53,
        end: (i + 1) * 53,
        key: i,
      })),
    getTotalSize: () => count * 53,
  }),
}));

setupGridMocks();

interface Item {
  id: string;
  name: string;
  score: number;
  children?: Item[];
}

const schema = {
  type: "object",
  properties: { name: { type: "string" }, score: { type: "number" } },
};
const localization = { locale: "en-US", timeZone: "UTC", lang: "en" };

const flat: Item[] = ["A", "B", "C", "D"].map((name, i) => ({
  id: name,
  name,
  score: i,
}));
const NAMES = flat.map((item) => item.name);

const tree: Item[] = [
  {
    id: "P0",
    name: "P0",
    score: 0,
    children: [
      { id: "C00", name: "C00", score: 1 },
      { id: "C01", name: "C01", score: 2 },
    ],
  },
  { id: "P1", name: "P1", score: 3 },
];

/** Renders of the probe cell, by row name, since the last reset. */
const renders = new Map<string, number>();
const rendered = () => Object.fromEntries(renders);

/** Reads an optional per-row note from context: the studio's pattern. */
const NoteContext = createContext<Record<string, string>>({});

const probe: ColumnConfig<Item> = {
  id: "probe",
  header: "probe",
  cell: function ProbeCell({ row }) {
    const notes = useContext(NoteContext);
    const { name, score } = row.original;
    renders.set(name, (renders.get(name) ?? 0) + 1);
    const note = notes[name];
    return (
      <span data-probe={name}>
        {`${name}:${score}`}
        {note ? ` ${note}` : null}
      </span>
    );
  },
};
const columns = [probe];
// The columns are rebuilt when getRowId changes identity, and every row with
// them, so it is a stable input like the columns themselves.
const getRowId = (item: Item) => item.id;

const baseConfig = (
  extra: Partial<MasterDataGridConfig<Item>> = {}
): MasterDataGridConfig<Item> =>
  ({
    schema,
    columns,
    localization,
    t: testResources,
    getRowId,
    ...extra,
  }) as MasterDataGridConfig<Item>;

const memo = (extra: Partial<MasterDataGridConfig<Item>> = {}) =>
  baseConfig({ memoizeRows: true, ...extra });

const mount = (data: Item[], config: MasterDataGridConfig<Item>) =>
  render(<MasterDataGrid<Item> data={data} config={config} />);

const probeOf = (name: string) =>
  document.querySelector<HTMLElement>(`[data-probe="${name}"]`);
const rowOf = (name: string) => {
  const cell = probeOf(name);
  if (!cell) throw new Error(`No row named ${name}`);
  return cell.closest("tr") as HTMLElement;
};
const rowBox = (name: string) => within(rowOf(name)).getByRole("checkbox");
const selectAll = () =>
  within(document.querySelector("thead")!).getByRole("checkbox", {
    name: "column.selectAll",
  });
const shownNames = () =>
  Array.from(document.querySelectorAll<HTMLElement>("[data-probe]")).map(
    (el) => el.dataset.probe
  );
const tick = (name: string) => fireEvent.click(rowBox(name));

beforeEach(() => renders.clear());

describe("memoizeRows: what re-renders", () => {
  it("ticking one row's checkbox re-renders that row's cells and no other row's", () => {
    const onSelectionChange = jest.fn();
    mount(flat, memo({ selection: { enabled: true, onSelectionChange } }));
    renders.clear();

    tick("B");

    expect(rendered()).toEqual({ B: 1 });
    expect(rowBox("B")).toHaveAttribute("aria-checked", "true");
    expect(rowOf("B")).toHaveAttribute("data-state", "selected");
    for (const name of ["A", "C", "D"]) {
      expect(rowBox(name)).toHaveAttribute("aria-checked", "false");
    }
    expect(selectAll()).toHaveAttribute("aria-checked", "mixed");
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).toHaveBeenCalledWith([flat[1]]);
  });

  it("without it, the same tick re-renders every row (the probe counts them)", () => {
    mount(flat, baseConfig({ selection: { enabled: true } }));
    renders.clear();

    tick("B");

    expect(Object.keys(rendered()).sort()).toEqual(NAMES);
  });

  it("a controlled selection given a new config every tick re-renders only the ticked rows", () => {
    const onSelectionChange = jest.fn();
    /** The studio's shape: the config is rebuilt when the selection changes,
     *  while its columns and row events keep their identity. */
    function Harness() {
      const [selected, setSelected] = useState<string[]>([]);
      const onRowClick = useCallback(() => {}, []);
      const rowEvents = useMemo<RowEventsConfig<Item>>(
        () => ({ onRowClick }),
        [onRowClick]
      );
      const config = useMemo(
        () =>
          memo({
            rowEvents,
            selection: {
              enabled: true,
              selectedIds: selected,
              onSelectionChange: (rows) => {
                onSelectionChange(rows);
                setSelected(rows.map((row) => row.id));
              },
            },
          }),
        [rowEvents, selected]
      );
      return <MasterDataGrid<Item> data={flat} config={config} />;
    }
    render(<Harness />);
    renders.clear();

    tick("B");
    expect(rendered()).toEqual({ B: 1 });
    tick("C");
    expect(rendered()).toEqual({ B: 1, C: 1 });
    expect(rowBox("B")).toHaveAttribute("aria-checked", "true");
    expect(rowBox("C")).toHaveAttribute("aria-checked", "true");
    expect(selectAll()).toHaveAttribute("aria-checked", "mixed");
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
    expect(onSelectionChange).toHaveBeenLastCalledWith([flat[1], flat[2]]);

    renders.clear();
    fireEvent.click(selectAll());
    // A and D change; B and C were already selected.
    expect(rendered()).toEqual({ A: 1, D: 1 });
    expect(selectAll()).toHaveAttribute("aria-checked", "true");
    for (const name of NAMES) {
      expect(rowBox(name)).toHaveAttribute("aria-checked", "true");
    }
    expect(onSelectionChange).toHaveBeenCalledTimes(3);
    expect(onSelectionChange).toHaveBeenLastCalledWith(flat);
  });

  it("the studio's tree config, rebuilt every tick, re-renders only the ticked row", () => {
    // As results-grid.tsx builds it: subRows, rowSelectable and the selection
    // are new objects on every tick; columns, getRowId, rowClassName and the
    // row events keep their identity.
    const onSelectionChange = jest.fn();
    const rowClassName = (item: Item) => (item.score > 0 ? "linked" : "");
    function Harness() {
      const [selected, setSelected] = useState<string[]>([]);
      const rowEvents = useMemo<RowEventsConfig<Item>>(
        () => ({ onRowHover: () => {}, onRowClick: () => {} }),
        []
      );
      const config = useMemo(
        () =>
          memo({
            rowEvents,
            rowClassName,
            cellClassName: "px-2!",
            subRows: {
              getSubRows: (item) => item.children,
              expanderColumn: "name",
              defaultExpanded: true,
              labels: { expand: "Expand", collapse: "Collapse" },
            },
            selection: {
              enabled: true,
              mode: "multiple",
              rowSelectable: (item) => !item.id.startsWith("C"),
              selectedIds: [...selected],
              onSelectionChange: (rows) => {
                onSelectionChange(rows);
                setSelected(rows.map((row) => row.id));
              },
            },
          }),
        [rowEvents, selected]
      );
      return <MasterDataGrid<Item> data={tree} config={config} />;
    }
    render(<Harness />);
    expect(shownNames()).toEqual(["P0", "C00", "C01", "P1"]);
    renders.clear();

    tick("P1");

    expect(rendered()).toEqual({ P1: 1 });
    expect(rowBox("P1")).toHaveAttribute("aria-checked", "true");
    expect(rowBox("P0")).toHaveAttribute("aria-checked", "false");
    expect(within(rowOf("C00")).queryByRole("checkbox")).toBeNull();
    expect(selectAll()).toHaveAttribute("aria-checked", "mixed");
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).toHaveBeenCalledWith([tree[1]]);
  });

  it("a parent re-render that changes nothing a row draws re-renders no row", () => {
    const config = memo({ selection: { enabled: true } });
    const { rerender } = mount(flat, config);
    renders.clear();

    // A new config object with the same fields, as an unmemoized consumer passes.
    rerender(<MasterDataGrid<Item> data={flat} config={{ ...config }} />);

    expect(rendered()).toEqual({});
    expect(shownNames()).toEqual(NAMES);
  });

  it("a cell that reads React context updates although its row is memoized", () => {
    function Harness({ notes }: { notes: Record<string, string> }) {
      return (
        <NoteContext.Provider value={notes}>
          <MasterDataGrid<Item> data={flat} config={config} />
        </NoteContext.Provider>
      );
    }
    const config = memo();
    const { rerender } = render(<Harness notes={{}} />);

    rerender(<Harness notes={{ C: "flagged" }} />);

    expect(probeOf("C")).toHaveTextContent("C:2 flagged");
    expect(probeOf("A")).toHaveTextContent(/^A:0$/);
  });
});

describe("memoizeRows: the DOM shows the new state after", () => {
  it("a data change: one row's value", () => {
    const config = memo();
    const { rerender } = mount(flat, config);

    const next = flat.map((item) =>
      item.name === "B" ? { ...item, score: 99 } : item
    );
    rerender(<MasterDataGrid<Item> data={next} config={config} />);

    expect(probeOf("B")).toHaveTextContent("B:99");
    // The schema column's cell shows it too.
    expect(within(rowOf("B")).getByText("99")).toBeInTheDocument();
    expect(probeOf("A")).toHaveTextContent("A:0");
  });

  it("a column visibility change", async () => {
    const user = userEvent.setup();
    const { container } = mount(flat, memo());
    const cellsPerRow = () =>
      Array.from(container.querySelectorAll("tbody tr")).map(
        (tr) => tr.querySelectorAll("td").length
      );
    expect(cellsPerRow()).toEqual([3, 3, 3, 3]);

    await user.click(
      within(container.querySelector("thead")!).getByRole("button", {
        name: /score/i,
      })
    );
    await user.click(await screen.findByText("column.hide"));

    expect(cellsPerRow()).toEqual([2, 2, 2, 2]);
    expect(within(rowOf("C")).queryByText("2")).toBeNull();
    expect(probeOf("C")).toHaveTextContent("C:2");
  });

  it("a column pinning change (the first column, so the order stays)", async () => {
    const user = userEvent.setup();
    const { container } = mount(flat, memo());
    const nameCell = (name: string) => rowOf(name).querySelector("td")!;
    expect(nameCell("A")).toHaveStyle({ position: "relative" });

    await user.click(
      within(container.querySelector("thead")!).getByRole("button", {
        name: /name/i,
      })
    );
    await user.click(await screen.findByText("column.pinLeft"));

    for (const name of NAMES) {
      expect(nameCell(name)).toHaveTextContent(name);
      expect(nameCell(name)).toHaveStyle({ position: "sticky", left: "0px" });
      expect(nameCell(name)).toHaveClass("bg-background");
    }
  });

  it("a column set change: new columns", () => {
    const config = memo();
    const { rerender } = mount(flat, config);

    const extra: ColumnConfig<Item> = {
      id: "double",
      header: "double",
      cell: ({ row }) => <span data-double="">{row.original.score * 2}</span>,
    };
    rerender(
      <MasterDataGrid<Item>
        data={flat}
        config={{ ...config, columns: [probe, extra] }}
      />
    );

    expect(
      within(rowOf("D")).getByText("6", { selector: "[data-double]" })
    ).toBeInTheDocument();
  });

  it("a new cell renderer for the same column", () => {
    const config = memo();
    const { rerender } = mount(flat, config);
    const next: ColumnConfig<Item> = {
      ...probe,
      cell: ({ row }) => (
        <span data-probe={row.original.name}>{`v2 ${row.original.name}`}</span>
      ),
    };

    rerender(
      <MasterDataGrid<Item>
        data={flat}
        config={{ ...config, columns: [next] }}
      />
    );

    expect(probeOf("A")).toHaveTextContent("v2 A");
    expect(probeOf("D")).toHaveTextContent("v2 D");
  });

  it("expand and collapse in tree mode", () => {
    mount(
      tree,
      memo({
        subRows: {
          getSubRows: (item) => item.children,
          expanderColumn: "name",
        },
      })
    );
    expect(shownNames()).toEqual(["P0", "P1"]);
    renders.clear();

    fireEvent.click(
      within(rowOf("P0")).getByRole("button", { name: "Expand row" })
    );
    expect(shownNames()).toEqual(["P0", "C00", "C01", "P1"]);
    expect(
      within(rowOf("P0")).getByRole("button", { name: "Collapse row" })
    ).toHaveAttribute("aria-expanded", "true");
    // P0 re-renders for its toggle and the children mount; P1 is untouched.
    expect(rendered()).toEqual({ P0: 1, C00: 1, C01: 1 });

    fireEvent.click(
      within(rowOf("P0")).getByRole("button", { name: "Collapse row" })
    );
    expect(shownNames()).toEqual(["P0", "P1"]);
    expect(
      within(rowOf("P0")).getByRole("button", { name: "Expand row" })
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("new tree labels (the tree options are compared by value)", () => {
    const subRows = {
      getSubRows: (item: Item) => item.children,
      expanderColumn: "name",
      labels: { expand: "Open", collapse: "Close" },
    };
    const { rerender } = mount(tree, memo({ subRows }));
    renders.clear();

    // An equal subRows object: nothing a row draws changed.
    rerender(
      <MasterDataGrid<Item>
        data={tree}
        config={memo({ subRows: { ...subRows } })}
      />
    );
    expect(rendered()).toEqual({});

    rerender(
      <MasterDataGrid<Item>
        data={tree}
        config={memo({
          subRows: { ...subRows, labels: { expand: "Show", collapse: "Hide" } },
        })}
      />
    );
    expect(
      within(rowOf("P0")).getByRole("button", { name: "Show" })
    ).toBeInTheDocument();
  });

  it("a rowClassName that depends on outside state (a new function)", () => {
    function Harness({ highlight }: { highlight: string }) {
      const rowClassName = useCallback(
        (item: Item) => (item.name === highlight ? "is-lit" : ""),
        [highlight]
      );
      const config = useMemo(() => memo({ rowClassName }), [rowClassName]);
      return <MasterDataGrid<Item> data={flat} config={config} />;
    }
    const { rerender } = render(<Harness highlight="A" />);
    expect(rowOf("A")).toHaveClass("is-lit");
    renders.clear();

    rerender(<Harness highlight="C" />);

    expect(rowOf("A")).not.toHaveClass("is-lit");
    expect(rowOf("C")).toHaveClass("is-lit");
    // Only the rows whose resolved class changed.
    expect(rendered()).toEqual({ A: 1, C: 1 });
  });

  it("a rowClassName that depends on outside state (the same function)", () => {
    let lit = "A";
    const config = memo({
      rowClassName: (item) => (item.name === lit ? "is-lit" : ""),
    });
    const { rerender } = mount(flat, config);
    expect(rowOf("A")).toHaveClass("is-lit");

    lit = "D";
    rerender(<MasterDataGrid<Item> data={flat} config={config} />);

    expect(rowOf("A")).not.toHaveClass("is-lit");
    expect(rowOf("D")).toHaveClass("is-lit");
  });

  it("a cellClassName that depends on outside state", () => {
    let marked = "B";
    const config = memo({
      cellClassName: ({ row, columnId }) =>
        row.name === marked && columnId === "probe" ? "is-marked" : "",
    });
    const { rerender } = mount(flat, config);
    expect(probeOf("B")!.closest("td")).toHaveClass("is-marked");

    marked = "C";
    rerender(<MasterDataGrid<Item> data={flat} config={config} />);

    expect(probeOf("B")!.closest("td")).not.toHaveClass("is-marked");
    expect(probeOf("C")!.closest("td")).toHaveClass("is-marked");
  });

  it("new row event handlers: a click reaches the new one", async () => {
    const user = userEvent.setup();
    const first = jest.fn();
    const second = jest.fn();
    const config = memo({ rowEvents: { onRowClick: first } });
    const { rerender } = mount(flat, config);

    rerender(
      <MasterDataGrid<Item>
        data={flat}
        config={{ ...config, rowEvents: { onRowClick: second } }}
      />
    );
    await user.click(probeOf("B")!);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(flat[1]);
  });

  it("can-select changing from outside state (rowSelectable)", () => {
    // The studio's re-run boxes: field rows become selectable once a run ends.
    let canPick = false;
    const config = memo({
      selection: {
        enabled: true,
        rowSelectable: (item) => canPick && !item.name.startsWith("C"),
      },
      subRows: {
        getSubRows: (item) => item.children,
        expanderColumn: "name",
        defaultExpanded: true,
      },
    });
    const { rerender } = mount(tree, config);
    // A tree row that cannot be selected gets no checkbox at all.
    expect(within(rowOf("P0")).queryByRole("checkbox")).toBeNull();

    canPick = true;
    rerender(<MasterDataGrid<Item> data={tree} config={config} />);

    expect(rowBox("P0")).toHaveAttribute("aria-checked", "false");
    expect(rowBox("P1")).toBeInTheDocument();
    expect(within(rowOf("C00")).queryByRole("checkbox")).toBeNull();
  });

  it("a parent's some-selected state, for a cell that shows it", () => {
    const someColumn: ColumnConfig<Item> = {
      id: "some",
      header: "some",
      cell: ({ row }) => (
        <span data-some={row.original.name}>
          {row.getIsSomeSelected() ? "some" : "none"}
        </span>
      ),
    };
    mount(
      tree,
      memo({
        columns: [probe, someColumn],
        selection: { enabled: true },
        subRows: {
          getSubRows: (item) => item.children,
          expanderColumn: "name",
          defaultExpanded: true,
        },
      })
    );
    const someOf = (name: string) =>
      document.querySelector(`[data-some="${name}"]`);
    expect(someOf("P0")).toHaveTextContent("none");

    tick("C01");

    expect(someOf("P0")).toHaveTextContent("some");
  });

  it("a new expansion renderer", () => {
    const expansion = (label: string) => ({
      enabled: true,
      defaultExpanded: true,
      renderContent: (item: Item) => <p>{`${label} ${item.name}`}</p>,
    });
    const config = memo({ expansion: expansion("first") });
    const { rerender } = mount(flat, config);
    expect(screen.getByText("first B")).toBeInTheDocument();

    rerender(
      <MasterDataGrid<Item>
        data={flat}
        config={memo({ expansion: expansion("second") })}
      />
    );

    expect(screen.getByText("second B")).toBeInTheDocument();
    expect(screen.queryByText("first B")).toBeNull();
  });

  it("row editing: start and cancel", async () => {
    const user = userEvent.setup();
    mount(
      flat,
      memo({
        editing: { enabled: true, mode: "row" },
        t: { ...testResources, "column.edit": "Edit" },
      })
    );
    renders.clear();

    await user.click(within(rowOf("B")).getByRole("button", { name: "Edit" }));

    expect(within(rowOf("B")).getByDisplayValue("B")).toBeInTheDocument();
    expect(within(rowOf("A")).queryByRole("textbox")).toBeNull();
    expect(rendered()).toEqual({ B: 1 });

    await user.click(
      within(rowOf("B")).getByRole("button", { name: "column.cancel" })
    );
    expect(within(rowOf("B")).queryByRole("textbox")).toBeNull();
    expect(
      within(rowOf("B")).getByRole("button", { name: "Edit" })
    ).toBeInTheDocument();
  });
});

describe.each([
  ["flat", flat, {}, "B", NAMES],
  [
    "tree",
    tree,
    {
      subRows: {
        getSubRows: (item: Item) => item.children,
        expanderColumn: "name",
        defaultExpanded: true,
      },
    },
    "C00",
    ["P0", "C00", "C01", "P1"],
  ],
] as const)(
  "memoizeRows: select-all and its indeterminate state (%s)",
  (_mode, data, extra, one, all) => {
    const mountSelectable = () => {
      const onSelectionChange = jest.fn();
      mount(
        data,
        memo({
          ...(extra as Partial<MasterDataGridConfig<Item>>),
          selection: { enabled: true, onSelectionChange },
        })
      );
      return onSelectionChange;
    };

    it("goes mixed, then all, then none, and every row box follows", () => {
      const onSelectionChange = mountSelectable();
      expect(selectAll()).toHaveAttribute("aria-checked", "false");

      tick(one);
      expect(selectAll()).toHaveAttribute("aria-checked", "mixed");
      expect(onSelectionChange).toHaveBeenCalledTimes(1);

      fireEvent.click(selectAll());
      expect(selectAll()).toHaveAttribute("aria-checked", "true");
      for (const name of all) {
        expect(rowBox(name)).toHaveAttribute("aria-checked", "true");
      }
      expect(onSelectionChange).toHaveBeenCalledTimes(2);
      expect(onSelectionChange.mock.calls[1]![0]).toHaveLength(all.length);

      fireEvent.click(selectAll());
      expect(selectAll()).toHaveAttribute("aria-checked", "false");
      for (const name of all) {
        expect(rowBox(name)).toHaveAttribute("aria-checked", "false");
      }
      expect(onSelectionChange).toHaveBeenCalledTimes(3);
      expect(onSelectionChange).toHaveBeenLastCalledWith([]);
    });
  }
);

describe("memoizeRows: virtual mode", () => {
  const virtual = (extra: Partial<MasterDataGridConfig<Item>> = {}) =>
    memo({ enableVirtualization: true, ...extra });

  it("ticking one row re-renders only that row, and the DOM follows", () => {
    const { container } = mount(
      flat,
      virtual({ selection: { enabled: true } })
    );
    // The virtual body's table, not the normal one.
    expect(container.querySelector("table")).toHaveClass("border-separate");
    renders.clear();

    tick("C");

    expect(rendered()).toEqual({ C: 1 });
    expect(rowBox("C")).toHaveAttribute("aria-checked", "true");
    expect(selectAll()).toHaveAttribute("aria-checked", "mixed");
  });

  it("expands a tree row and shows a data change", () => {
    const config = virtual({
      subRows: { getSubRows: (item) => item.children, expanderColumn: "name" },
    });
    const { rerender } = mount(tree, config);

    fireEvent.click(
      within(rowOf("P0")).getByRole("button", { name: "Expand row" })
    );
    expect(shownNames()).toEqual(["P0", "C00", "C01", "P1"]);

    const next = tree.map((item) =>
      item.name === "P1" ? { ...item, score: 42 } : item
    );
    rerender(<MasterDataGrid<Item> data={next} config={config} />);
    expect(probeOf("P1")).toHaveTextContent("P1:42");
  });
});

describe("memoizeRows adds no markup", () => {
  const markup = (container: HTMLElement) =>
    container.innerHTML.replace(/_r_[0-9a-z]+_/g, "_r_ID_");

  it.each([
    ["plain", flat, {}],
    ["selection", flat, { selection: { enabled: true } }],
    [
      "virtual, with selection",
      flat,
      { enableVirtualization: true, selection: { enabled: true } },
    ],
    [
      "tree, expanded",
      tree,
      {
        selection: { enabled: true },
        subRows: {
          getSubRows: (item: Item) => item.children,
          expanderColumn: "name",
          defaultExpanded: true,
        },
      },
    ],
    [
      "expansion, expanded",
      flat,
      {
        expansion: {
          enabled: true,
          defaultExpanded: true,
          renderContent: (item: Item) => <p>{`detail ${item.name}`}</p>,
        },
      },
    ],
    ["row editing", flat, { editing: { enabled: true, mode: "row" } }],
    [
      "pinned, with classes",
      flat,
      {
        pinning: { left: ["probe"] },
        rowClassName: (item: Item) => `row-${item.name}`,
        cellClassName: ({ columnId }: { columnId: string }) =>
          `cell-${columnId}`,
      },
    ],
  ] as const)("%s", (_name, data, extra) => {
    const config = extra as Partial<MasterDataGridConfig<Item>>;
    const off = mount(data as Item[], baseConfig(config));
    const offMarkup = markup(off.container);
    off.unmount();
    const on = mount(data as Item[], memo(config));
    expect(markup(on.container)).toBe(offMarkup);
  });

  it("drives the same selection on and off", () => {
    const run = (config: MasterDataGridConfig<Item>) => {
      const view = mount(flat, config);
      tick("A");
      act(() => {
        fireEvent.click(rowBox("D"));
      });
      const html = markup(view.container);
      view.unmount();
      return html;
    };
    expect(run(memo({ selection: { enabled: true } }))).toBe(
      run(baseConfig({ selection: { enabled: true } }))
    );
  });
});
