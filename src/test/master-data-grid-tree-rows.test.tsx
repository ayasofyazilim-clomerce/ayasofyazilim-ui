// Import the helper FIRST: its jest.mock calls must register before the grid loads.
import { renderGrid, setupGridMocks } from "./helpers/grid-test-setup";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  MasterDataGridConfig,
  SubRowsConfig,
} from "../custom/master-data-grid";

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

interface Node {
  name: string;
  score: number;
  children?: Node[];
}

// 2 parents with 2 children each; one child has 1 grandchild.
const g010: Node = { name: "G010", score: 0 };
const c00: Node = { name: "C00", score: 5 };
const c01: Node = { name: "C01", score: 1, children: [g010] };
const c10: Node = { name: "C10", score: 3 };
const c11: Node = { name: "C11", score: 4 };
const p0: Node = { name: "P0", score: 2, children: [c00, c01] };
const p1: Node = { name: "P1", score: 1, children: [c10, c11] };
const tree: Node[] = [p0, p1];
const ALL = ["P0", "C00", "C01", "G010", "P1", "C10", "C11"];

const schema = {
  type: "object",
  properties: { name: { type: "string" }, score: { type: "number" } },
};

const subRows: SubRowsConfig<Node> = {
  getSubRows: (node) => node.children,
  expanderColumn: "name",
};
const expandedSubRows: SubRowsConfig<Node> = {
  ...subRows,
  defaultExpanded: true,
};

const renderTree = (config: Partial<MasterDataGridConfig<Node>> = {}) =>
  renderGrid<Node>(tree, {
    schema,
    subRows,
    ...config,
  } as Partial<MasterDataGridConfig<Node>>);

const bodyRows = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>("tbody tr"));

/** The name shown in each body row's tree cell, in display order. */
const rowNames = (container: HTMLElement) =>
  bodyRows(container).map(
    (tr) => tr.querySelector('[data-slot="tree-cell"]')?.textContent ?? null
  );

const treeCellOf = (name: string) => {
  const cell = Array.from(
    document.querySelectorAll<HTMLElement>('[data-slot="tree-cell"]')
  ).find((el) => el.textContent === name);
  if (!cell) throw new Error(`No tree row named ${name}`);
  return cell;
};

const rowOf = (name: string) => treeCellOf(name).closest("tr") as HTMLElement;

const markup = (container: HTMLElement) =>
  container.innerHTML.replace(/_r_[0-9a-z]+_/g, "_r_ID_");

describe("MasterDataGrid tree rows (subRows)", () => {
  it("starts collapsed: only top-level rows, each with an Expand toggle", () => {
    const { container } = renderTree();
    expect(rowNames(container)).toEqual(["P0", "P1"]);
    const toggles = screen.getAllByRole("button", { name: "Expand row" });
    expect(toggles).toHaveLength(2);
    toggles.forEach((toggle) =>
      expect(toggle).toHaveAttribute("aria-expanded", "false")
    );
    expect(screen.queryByText("C00")).toBeNull();
  });

  it("expands and collapses from the toggle, and aria-expanded follows", () => {
    const { container } = renderTree();

    fireEvent.click(
      within(rowOf("P0")).getByRole("button", { name: "Expand row" })
    );
    expect(rowNames(container)).toEqual(["P0", "C00", "C01", "P1"]);
    const collapse = within(rowOf("P0")).getByRole("button", {
      name: "Collapse row",
    });
    expect(collapse).toHaveAttribute("aria-expanded", "true");

    // A child with children gets a toggle; a leaf gets a spacer instead.
    expect(
      within(rowOf("C01")).getByRole("button", { name: "Expand row" })
    ).toHaveAttribute("aria-expanded", "false");
    expect(within(rowOf("C00")).queryByRole("button")).toBeNull();
    expect(
      treeCellOf("C00").querySelector('[data-slot="tree-spacer"]')
    ).not.toBeNull();

    fireEvent.click(
      within(rowOf("C01")).getByRole("button", { name: "Expand row" })
    );
    expect(rowNames(container)).toEqual(["P0", "C00", "C01", "G010", "P1"]);

    fireEvent.click(collapse);
    expect(rowNames(container)).toEqual(["P0", "P1"]);
    expect(
      within(rowOf("P0")).getByRole("button", { name: "Expand row" })
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("takes its toggle labels from labels", () => {
    renderTree({
      subRows: {
        ...subRows,
        labels: { expand: "Genişlet", collapse: "Daralt" },
      },
    });
    fireEvent.click(
      within(rowOf("P0")).getByRole("button", { name: "Genişlet" })
    );
    expect(
      within(rowOf("P0")).getByRole("button", { name: "Daralt" })
    ).toBeInTheDocument();
  });

  it("shows every row with defaultExpanded: true", () => {
    const { container } = renderTree({ subRows: expandedSubRows });
    expect(rowNames(container)).toEqual(ALL);
  });

  it("expands the rows named by a defaultExpanded record", () => {
    const { container } = renderTree({
      subRows: { ...subRows, defaultExpanded: { "1": true } },
    });
    expect(rowNames(container)).toEqual(["P0", "P1", "C10", "C11"]);
  });

  it("indents depth-2 rows twice as far as depth-1 rows (1.25rem per level by default)", () => {
    renderTree({ subRows: expandedSubRows });
    const indent = (name: string) =>
      parseFloat(treeCellOf(name).style.paddingLeft);
    expect(indent("P0")).toBe(0);
    expect(treeCellOf("C00").style.paddingLeft).toBe("1.25rem");
    expect(indent("G010")).toBe(2 * indent("C00"));
  });

  it("indents by the given indent", () => {
    renderTree({ subRows: { ...expandedSubRows, indent: 2 } });
    expect(treeCellOf("C00").style.paddingLeft).toBe("2rem");
    expect(treeCellOf("G010").style.paddingLeft).toBe("4rem");
  });

  it("gives rows parent-aware ids: 0, 0.0, 0.1, 0.1.0", () => {
    renderTree({
      subRows: expandedSubRows,
      columns: [
        {
          id: "rowId",
          cell: ({ row }) => <span data-testid="row-id">{row.id}</span>,
        },
      ],
    });
    expect(screen.getAllByTestId("row-id").map((el) => el.textContent)).toEqual(
      ["0", "0.0", "0.1", "0.1.0", "1", "1.0", "1.1"]
    );
  });

  it("uses getRowId when one is given", () => {
    renderTree({
      subRows: expandedSubRows,
      getRowId: (node) => node.name,
      columns: [
        {
          id: "rowId",
          cell: ({ row }) => <span data-testid="row-id">{row.id}</span>,
        },
      ],
    });
    expect(screen.getAllByTestId("row-id").map((el) => el.textContent)).toEqual(
      ALL
    );
  });

  it("selects a child on its own, and still reports it after its parent collapses", () => {
    const onSelectionChange = jest.fn();
    renderTree({
      subRows: expandedSubRows,
      selection: { enabled: true, onSelectionChange },
    });
    const checkbox = (name: string) =>
      within(rowOf(name)).getByRole("checkbox");

    fireEvent.click(checkbox("C01"));
    expect(onSelectionChange).toHaveBeenLastCalledWith([c01]);
    expect(checkbox("C01")).toBeChecked();
    expect(checkbox("P0")).not.toBeChecked();
    expect(checkbox("C00")).not.toBeChecked();
    expect(checkbox("G010")).not.toBeChecked();

    fireEvent.click(
      within(rowOf("P0")).getByRole("button", { name: "Collapse row" })
    );
    expect(screen.queryByText("C01")).toBeNull();

    fireEvent.click(checkbox("P1"));
    expect(onSelectionChange).toHaveBeenLastCalledWith([c01, p1]);
    expect(checkbox("C10")).not.toBeChecked();
  });

  it("gives no checkbox to rows rowSelectable rejects", () => {
    const { container } = renderTree({
      subRows: expandedSubRows,
      selection: {
        enabled: true,
        rowSelectable: (node) => tree.includes(node),
      },
    });
    expect(container.querySelectorAll('tbody [role="checkbox"]')).toHaveLength(
      2
    );
    expect(within(rowOf("P0")).getByRole("checkbox")).toBeInTheDocument();
    expect(within(rowOf("C00")).queryByRole("checkbox")).toBeNull();
    expect(within(rowOf("G010")).queryByRole("checkbox")).toBeNull();
  });

  describe("select-all", () => {
    const selectAll = (container: HTMLElement) =>
      within(container.querySelector("thead")!).getByRole("checkbox", {
        name: "column.selectAll",
      });

    it("on a collapsed tree selects every row of the page, checks, and clears on the next click", () => {
      const onSelectionChange = jest.fn();
      const { container } = renderTree({
        selection: { enabled: true, onSelectionChange },
      });
      expect(rowNames(container)).toEqual(["P0", "P1"]);
      expect(selectAll(container)).not.toBeDisabled();
      expect(selectAll(container)).not.toBeChecked();

      fireEvent.click(selectAll(container));
      expect(onSelectionChange).toHaveBeenLastCalledWith([
        p0,
        c00,
        c01,
        g010,
        p1,
        c10,
        c11,
      ]);
      expect(selectAll(container)).toBeChecked();
      fireEvent.click(
        within(rowOf("P0")).getByRole("button", { name: "Expand row" })
      );
      expect(within(rowOf("C00")).getByRole("checkbox")).toBeChecked();

      fireEvent.click(selectAll(container));
      expect(onSelectionChange).toHaveBeenLastCalledWith([]);
      expect(selectAll(container)).not.toBeChecked();
      expect(within(rowOf("C00")).getByRole("checkbox")).not.toBeChecked();
    });

    it("never sets a row rowSelectable rejects", () => {
      const onSelectionChange = jest.fn();
      const { container } = renderTree({
        selection: {
          enabled: true,
          onSelectionChange,
          rowSelectable: (node) => tree.includes(node),
        },
      });
      fireEvent.click(selectAll(container));
      expect(onSelectionChange).toHaveBeenLastCalledWith([p0, p1]);
      expect(selectAll(container)).toBeChecked();
      fireEvent.click(selectAll(container));
      expect(onSelectionChange).toHaveBeenLastCalledWith([]);
      expect(selectAll(container)).not.toBeChecked();
    });

    it("is enabled when the only selectable rows are collapsed children", () => {
      const onSelectionChange = jest.fn();
      const { container } = renderTree({
        selection: {
          enabled: true,
          onSelectionChange,
          rowSelectable: (node) => !tree.includes(node),
        },
      });
      expect(selectAll(container)).not.toBeDisabled();
      fireEvent.click(selectAll(container));
      expect(onSelectionChange).toHaveBeenLastCalledWith([
        c00,
        c01,
        g010,
        c10,
        c11,
      ]);
      expect(selectAll(container)).toBeChecked();
    });

    it("covers the current page only", () => {
      const onSelectionChange = jest.fn();
      const { container } = renderTree({
        selection: { enabled: true, onSelectionChange },
        pageSize: 1,
      });
      fireEvent.click(selectAll(container));
      expect(onSelectionChange).toHaveBeenLastCalledWith([p0, c00, c01, g010]);
      expect(selectAll(container)).toBeChecked();
    });
  });

  it("sorts siblings within their parent", async () => {
    const user = userEvent.setup();
    const { container } = renderTree({ subRows: expandedSubRows });
    await user.click(
      within(container.querySelector("thead")!).getByRole("button", {
        name: /score/i,
      })
    );
    await user.click(await screen.findByText("column.sortAsc"));
    expect(rowNames(container)).toEqual([
      "P1",
      "C10",
      "C11",
      "P0",
      "C01",
      "G010",
      "C00",
    ]);
  });

  it("pages by top-level rows: at pageSize 1, page 1 holds parent 0 and its children", () => {
    const { container } = renderTree({ subRows: expandedSubRows, pageSize: 1 });
    expect(rowNames(container)).toEqual(["P0", "C00", "C01", "G010"]);
    expect(container.textContent).toContain(
      "pagination.page 1 pagination.of 2"
    );
    expect(screen.getByTestId("row-count-summary")).toHaveTextContent(
      "pagination.totalItems: 2"
    );
  });

  it("searches top-level rows only: a match keeps its children, a miss hides them", async () => {
    const user = userEvent.setup();
    const { container } = renderTree({ subRows: expandedSubRows });
    const search = screen.getByPlaceholderText("toolbar.search");
    // The toolbar debounces the global filter (300ms), so wait for it to land.
    await user.type(search, "P1");
    await waitFor(() =>
      expect(rowNames(container)).toEqual(["P1", "C10", "C11"])
    );
    await user.clear(search);
    await user.type(search, "C10");
    await waitFor(() =>
      expect(container.querySelector("tbody")).toHaveTextContent(
        "table.noResults"
      )
    );
  });

  it("exports top-level rows only, even when expanded", async () => {
    const parts: string[] = [];
    const RealBlob = global.Blob;
    jest.spyOn(global, "Blob").mockImplementation(((
      p: BlobPart[],
      o?: BlobPropertyBag
    ) => {
      parts.push(String(p[0]));
      return new RealBlob(p, o);
    }) as never);
    URL.createObjectURL = jest.fn(() => "blob:x");
    URL.revokeObjectURL = jest.fn();
    jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    try {
      renderTree({ subRows: expandedSubRows });
      await userEvent.click(
        screen.getAllByRole("button", { name: /toolbar.export/ })[0]!
      );
      expect(parts[0]).toContain("P0");
      expect(parts[0]).toContain("P1");
      expect(parts[0]).not.toContain("C00");
      expect(parts[0]).not.toContain("G010");
    } finally {
      jest.restoreAllMocks();
    }
  });

  it("renders the children in virtual mode", () => {
    const { container } = renderTree({
      subRows: expandedSubRows,
      enableVirtualization: true,
    });
    expect(rowNames(container)).toEqual(ALL);
    expect(
      within(rowOf("C01")).getByRole("button", { name: "Collapse row" })
    ).toBeInTheDocument();
  });

  it("keys row editing by row id, so a child edits on its own", async () => {
    const user = userEvent.setup();
    renderTree({
      subRows: expandedSubRows,
      editing: { enabled: true, mode: "row", onRowSave: jest.fn() },
    });
    // C01 is index 1 under its parent, like P1 and C11: keyed by row.index,
    // all three would open for editing.
    const c01Row = rowOf("C01");
    await user.click(
      within(c01Row).getByRole("button", { name: "column.edit" })
    );
    const saves = screen.getAllByRole("button", { name: "column.save" });
    expect(saves).toHaveLength(1);
    expect(c01Row).toContainElement(saves[0]!);
    expect(within(c01Row).getByDisplayValue("C01")).toBeInTheDocument();
  });

  describe("combined with an option that draws rows of its own", () => {
    let warn: jest.SpyInstance;
    beforeEach(() => {
      warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    });
    afterEach(() => warn.mockRestore());
    const subRowsWarnings = () =>
      warn.mock.calls.filter((args) => String(args[0]).includes("subRows"));

    it("subRows plus grouping logs one warning and renders flat, as grouping does alone", () => {
      const grouping = {
        enabled: true,
        groupBy: ["name"],
        expanded: true as const,
      };
      // @ts-expect-error grouping.enabled cannot be combined with subRows
      const config: MasterDataGridConfig<Node> = {
        schema,
        subRows,
        grouping,
        localization: { locale: "en-US", timeZone: "UTC", lang: "en" },
      };

      const withSubRows = renderTree(config);
      expect(subRowsWarnings()).toHaveLength(1);
      expect(String(subRowsWarnings()[0]![0])).toContain("grouping");
      expect(screen.queryByRole("button", { name: "Expand row" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Collapse row" })).toBeNull();
      expect(screen.queryByText("C00")).toBeNull();
      const treeMarkup = markup(withSubRows.container);

      // Re-rendering (a group toggles) does not warn again.
      fireEvent.click(bodyRows(withSubRows.container)[0]!);
      expect(subRowsWarnings()).toHaveLength(1);
      withSubRows.unmount();

      const flat = renderTree({ ...config, subRows: undefined } as never);
      expect(markup(flat.container)).toBe(treeMarkup);
    });

    it("subRows plus expansion.renderContent logs one warning and renders as if subRows were absent", () => {
      const expansion = {
        enabled: true,
        renderContent: (node: Node) => <div>detail-{node.name}</div>,
        expanderColumns: ["name"],
      };
      // @ts-expect-error expansion.renderContent cannot be combined with subRows
      const config: MasterDataGridConfig<Node> = {
        schema,
        subRows,
        expansion,
        localization: { locale: "en-US", timeZone: "UTC", lang: "en" },
      };

      const withSubRows = renderTree(config);
      expect(subRowsWarnings()).toHaveLength(1);
      expect(String(subRowsWarnings()[0]![0])).toContain("renderContent");
      expect(screen.queryByRole("button", { name: "Expand row" })).toBeNull();
      const treeMarkup = markup(withSubRows.container);

      fireEvent.click(screen.getByText("P0").closest(".expander")!);
      expect(screen.getByText("detail-P0")).toBeInTheDocument();
      expect(screen.queryByText("C00")).toBeNull();
      expect(subRowsWarnings()).toHaveLength(1);
      withSubRows.unmount();

      const flat = renderTree({ ...config, subRows: undefined } as never);
      expect(markup(flat.container)).toBe(treeMarkup);
    });

    it("does not warn without a conflict", () => {
      renderTree({ subRows: expandedSubRows });
      expect(subRowsWarnings()).toHaveLength(0);
    });
  });
});

describe("MasterDataGrid without subRows keeps today's row ids", () => {
  it("numbers rows by their index", () => {
    renderGrid<Node>(tree, {
      schema,
      columns: [
        {
          id: "rowId",
          cell: ({ row }) => <span data-testid="row-id">{row.id}</span>,
        },
      ],
    });
    expect(screen.getAllByTestId("row-id").map((el) => el.textContent)).toEqual(
      ["0", "1"]
    );
    expect(screen.queryByRole("button", { name: "Expand row" })).toBeNull();
  });
});
