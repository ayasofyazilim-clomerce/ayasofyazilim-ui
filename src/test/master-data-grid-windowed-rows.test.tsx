// Import the helper FIRST: its jest.mock calls must register before the grid loads.
import { setupGridMocks, testResources } from "./helpers/grid-test-setup";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MasterDataGrid } from "../custom/master-data-grid";
import type {
  MasterDataGridConfig,
  SubRowsConfig,
} from "../custom/master-data-grid";

/**
 * Windowed rows (`windowedRows`) with the real virtualizer. jsdom has no
 * layout, so the sizes it reads are stubbed on the prototypes below:
 * - the scroller (`data-testid="scroller"`) is VIEWPORT px high and its
 *   content much taller; every other element has no height;
 * - a drawn row (`tr[data-index]`) is ROW px high unless `rowHeight` says
 *   otherwise, and an open expansion row is `expansionHeight` px high;
 * - the table body's top sits `bodyTop` px into the scroller's content (or the
 *   page), less the scroll offset, as a browser would report it.
 */

setupGridMocks();

const ROW = 36;
const VIEWPORT = 360;
const OVERSCAN = 12;

let bodyTop = 0;
let rowHeight: (index: number) => number = () => ROW;
let expansionHeight = 0;
let scrollToCalls: number[] = [];

const saved = new Map<string, PropertyDescriptor | undefined>();
const stub = (proto: object, key: string, descriptor: PropertyDescriptor) => {
  saved.set(
    `${proto === Element.prototype ? "Element" : "HTMLElement"}.${key}`,
    Object.getOwnPropertyDescriptor(proto, key)
  );
  Object.defineProperty(proto, key, { configurable: true, ...descriptor });
};
const isScroller = (el: Element) =>
  el instanceof HTMLElement && el.dataset.testid === "scroller";

beforeAll(() => {
  stub(Element.prototype, "clientHeight", {
    get(this: Element) {
      return isScroller(this) ? VIEWPORT : 0;
    },
  });
  stub(Element.prototype, "scrollHeight", {
    get(this: Element) {
      return isScroller(this) ? 1_000_000 : 0;
    },
  });
  stub(HTMLElement.prototype, "offsetHeight", {
    get(this: HTMLElement) {
      if (this.tagName !== "TR") return 0;
      const index = this.getAttribute("data-index");
      if (index !== null) return rowHeight(Number(index));
      return this.hasAttribute("data-windowed-expansion") ? expansionHeight : 0;
    },
  });
  stub(Element.prototype, "getBoundingClientRect", {
    value(this: Element) {
      let top = 0;
      if (this.getAttribute("data-slot") === "table-body") {
        const scroller = this.closest<HTMLElement>('[data-testid="scroller"]');
        top = bodyTop - (scroller ? scroller.scrollTop : window.scrollY);
      }
      return { top, bottom: top, left: 0, right: 0, width: 0, height: 0 };
    },
  });
  // jsdom has no Element.scrollTo: record every write the window makes.
  stub(Element.prototype, "scrollTo", {
    value(this: HTMLElement, options: ScrollToOptions) {
      scrollToCalls.push(options.top ?? 0);
      this.scrollTop = options.top ?? 0;
    },
  });
});

afterAll(() => {
  for (const [name, descriptor] of saved) {
    const [owner, key] = name.split(".") as [string, string];
    const proto =
      owner === "Element" ? Element.prototype : HTMLElement.prototype;
    if (descriptor) Object.defineProperty(proto, key, descriptor);
    else Reflect.deleteProperty(proto, key);
  }
});

beforeEach(() => {
  jest.useFakeTimers();
  bodyTop = 0;
  rowHeight = () => ROW;
  expansionHeight = 0;
  scrollToCalls = [];
});

afterEach(() => {
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

interface Item {
  id: string;
  name: string;
  children?: Item[];
}
const items = (count: number, prefix = "Row") =>
  Array.from({ length: count }, (_, i) => ({
    id: `r${i}`,
    name: `${prefix} ${i}`,
  }));
const TOTAL = 200;
const data: Item[] = items(TOTAL);
const schema = { type: "object", properties: { name: { type: "string" } } };

const config = (
  extra: Partial<MasterDataGridConfig<Item>> = {}
): MasterDataGridConfig<Item> =>
  ({
    localization: { locale: "en-US", timeZone: "UTC", lang: "en" },
    schema,
    t: testResources,
    enablePagination: false,
    getRowId: (row: Item) => row.id,
    ...extra,
  }) as MasterDataGridConfig<Item>;

/** The grid inside a scrolling ancestor, as in the consuming app. */
const Scrolled = ({
  rows = data,
  extra,
}: {
  rows?: Item[];
  extra?: Partial<MasterDataGridConfig<Item>>;
}) => (
  <div data-testid="scroller" style={{ overflowY: "auto" }}>
    <div>Filters above the grid</div>
    <MasterDataGrid data={rows} config={config(extra)} />
  </div>
);

const renderWindowed = (
  extra: Partial<MasterDataGridConfig<Item>> = {},
  rows: Item[] = data
) => render(<Scrolled rows={rows} extra={{ windowedRows: {}, ...extra }} />);

const scroller = () => screen.getByTestId("scroller");
const table = () => document.querySelector("table")!;
const dataRows = () =>
  Array.from(document.querySelectorAll<HTMLElement>("tbody tr[data-index]"));
const drawnIndexes = () => dataRows().map((tr) => Number(tr.dataset.index));
const spacers = () =>
  Array.from(
    document.querySelectorAll<HTMLElement>('tbody tr[aria-hidden="true"]')
  );
const spacerHeight = (tr: HTMLElement) =>
  parseFloat(tr.querySelector("td")!.style.height);
const rowNamed = (name: string) =>
  screen.getByText(name, { exact: true }).closest("tr")!;

/** Scrolls an element as a user would, then lets the scroll settle. */
const scrollTo = (top: number, el: HTMLElement = scroller()) => {
  act(() => {
    el.scrollTop = top;
    fireEvent.scroll(el);
  });
  act(() => {
    jest.advanceTimersByTime(200);
  });
};
/** The scroll offset that puts row `index` at the top (rows of ROW px). */
const offsetOf = (index: number) => bodyTop + index * ROW;

describe("windowed rows: off by default", () => {
  it("draws every row, with no row semantics or spacers", () => {
    render(<Scrolled />);
    const rows = document.querySelectorAll("tbody tr");
    expect(rows).toHaveLength(TOTAL);
    expect(table()).not.toHaveAttribute("aria-rowcount");
    expect(document.querySelector("[aria-rowindex]")).toBeNull();
    expect(document.querySelector("[data-index]")).toBeNull();
    expect(spacers()).toHaveLength(0);
  });
});

describe("windowed rows: on", () => {
  it("draws only the rows in view plus overscan, in the normal markup", () => {
    renderWindowed();
    // Rows 0-9 fill the 360 px viewport, then overscan rows follow.
    const visible = VIEWPORT / ROW;
    expect(drawnIndexes()).toEqual(
      Array.from({ length: visible + OVERSCAN }, (_, i) => i)
    );
    expect(dataRows().length).toBeLessThan(TOTAL / 4);
    // Normal mode: no fixed height, no border-separate, normal cell classes.
    expect(table()).not.toHaveClass("border-separate");
    expect(table().closest('[style*="600px"]')).toBeNull();
    expect(dataRows()[0]!.querySelector("td")).toHaveClass("h-9");
  });

  it("sets aria-rowcount to the rows in the model plus the header row", () => {
    renderWindowed();
    expect(table()).toHaveAttribute("aria-rowcount", String(TOTAL + 1));
  });

  it("numbers the header row 1 and each drawn row index + 2, also after scrolling", () => {
    renderWindowed();
    expect(document.querySelector("thead tr")).toHaveAttribute(
      "aria-rowindex",
      "1"
    );
    const check = () =>
      dataRows().forEach((tr) =>
        expect(tr).toHaveAttribute(
          "aria-rowindex",
          String(Number(tr.dataset.index) + 2)
        )
      );
    check();
    expect(rowNamed("Row 0")).toHaveAttribute("aria-rowindex", "2");

    scrollTo(offsetOf(100));
    expect(drawnIndexes()[0]).toBe(100 - OVERSCAN);
    check();
    expect(rowNamed("Row 100")).toHaveAttribute("aria-rowindex", "102");
    expect(screen.queryByText("Row 0")).toBeNull();
  });

  it("pads the rows not drawn with hidden spacer rows spanning the visible columns", () => {
    renderWindowed({ selection: { enabled: true } });
    const columns = document.querySelectorAll("thead th").length;
    expect(columns).toBe(2);

    // At the top: no spacer above, one below for the rest.
    const [below] = spacers();
    expect(spacers()).toHaveLength(1);
    expect(below!.nextElementSibling).toBeNull();
    const drawn = dataRows().length;
    expect(spacerHeight(below!)).toBe((TOTAL - drawn) * ROW);

    scrollTo(offsetOf(100));
    const [above, after] = spacers();
    expect(spacers()).toHaveLength(2);
    expect(spacerHeight(above!)).toBe((100 - OVERSCAN) * ROW);
    const last = drawnIndexes().at(-1)!;
    expect(spacerHeight(after!)).toBe((TOTAL - last - 1) * ROW);
    for (const spacer of spacers()) {
      expect(spacer).toHaveAttribute("aria-hidden", "true");
      const cells = spacer.querySelectorAll("td");
      expect(cells).toHaveLength(1);
      expect(cells[0]).toHaveAttribute("colspan", String(columns));
      expect(cells[0]).toHaveStyle({ padding: "0px" });
      expect(spacer).toHaveTextContent("");
    }
  });

  it("draws the last row once scrolled to the end, with no spacer below", () => {
    renderWindowed();
    scrollTo(offsetOf(TOTAL) - VIEWPORT);
    expect(rowNamed(`Row ${TOTAL - 1}`)).toBeInTheDocument();
    expect(drawnIndexes().at(-1)).toBe(TOTAL - 1);
    expect(dataRows().at(-1)!.nextElementSibling).toBeNull();
  });

  it("does not move a scroller that is already scrolled when it turns on", () => {
    const { rerender } = render(<Scrolled />);
    act(() => {
      scroller().scrollTop = offsetOf(50);
    });
    rerender(<Scrolled extra={{ windowedRows: {} }} />);
    expect(scroller().scrollTop).toBe(offsetOf(50));
    expect(scrollToCalls.every((top) => top === offsetOf(50))).toBe(true);
    expect(drawnIndexes()[0]).toBe(50 - OVERSCAN);
  });

  it("shows the empty message when there are no rows", () => {
    renderWindowed({}, []);
    expect(screen.getByText("table.noResults")).toBeInTheDocument();
    expect(spacers()).toHaveLength(0);
  });
});

describe("windowed rows: the scroller", () => {
  it("passes over an overflow:auto ancestor that does not scroll", () => {
    render(
      <div data-testid="scroller" style={{ overflowY: "auto" }}>
        {/* Grows with its content (scrollHeight === clientHeight). */}
        <div data-testid="inner" style={{ overflowY: "auto" }}>
          <MasterDataGrid data={data} config={config({ windowedRows: {} })} />
        </div>
      </div>
    );
    scrollTo(offsetOf(100));
    expect(drawnIndexes()[0]).toBe(100 - OVERSCAN);
  });

  it("uses scrollElement when given", () => {
    const other = document.createElement("div");
    Object.defineProperty(other, "clientHeight", { value: VIEWPORT * 2 });
    document.body.appendChild(other);
    renderWindowed({ windowedRows: { scrollElement: () => other } });
    // The given element's 720 px, not the scroller's 360 px, set the window.
    expect(drawnIndexes()).toHaveLength((VIEWPORT * 2) / ROW + OVERSCAN);
    // Scrolling the ancestor that would have been found changes nothing.
    scrollTo(offsetOf(100));
    expect(drawnIndexes()[0]).toBe(0);
    scrollTo(offsetOf(100), other);
    expect(drawnIndexes()[0]).toBe(100 - OVERSCAN);
    other.remove();
  });

  it("falls back to the document when no ancestor scrolls", () => {
    const windowScrollTo = jest
      .spyOn(window, "scrollTo")
      .mockImplementation(() => {});
    bodyTop = 120;
    render(
      <MasterDataGrid data={data} config={config({ windowedRows: {} })} />
    );
    // jsdom's window is 768 px high.
    const visible = Math.ceil(window.innerHeight / ROW);
    expect(drawnIndexes()[0]).toBe(0);
    expect(drawnIndexes().length).toBeLessThanOrEqual(visible + OVERSCAN + 1);

    const scrollY = Object.getOwnPropertyDescriptor(window, "scrollY");
    try {
      Object.defineProperty(window, "scrollY", {
        configurable: true,
        value: offsetOf(100),
      });
      act(() => {
        fireEvent.scroll(window);
      });
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(drawnIndexes()[0]).toBe(100 - OVERSCAN);
    } finally {
      if (scrollY) Object.defineProperty(window, "scrollY", scrollY);
      windowScrollTo.mockRestore();
    }
  });

  it("offsets the rows by the content above the table, measured again when it changes", () => {
    const observers: { callback: () => void; targets: Element[] }[] = [];
    const original = window.ResizeObserver;
    window.ResizeObserver = class {
      targets: Element[] = [];
      constructor(public callback: () => void) {
        observers.push(this);
      }
      observe(target: Element) {
        this.targets.push(target);
      }
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
    try {
      bodyTop = 200;
      renderWindowed();
      scrollTo(offsetOf(100));
      expect(drawnIndexes()[0]).toBe(100 - OVERSCAN);

      // A banner above the grid grows by ten rows' height.
      bodyTop = 200 + 10 * ROW;
      const watching = observers.filter((o) =>
        o.targets.some((t) => t.tagName === "TABLE")
      );
      expect(watching).toHaveLength(1);
      expect(watching[0]!.targets).toContain(scroller().firstElementChild);
      act(() => watching[0]!.callback());
      // The same scroll offset now shows ten rows earlier.
      expect(drawnIndexes()[0]).toBe(90 - OVERSCAN);
    } finally {
      window.ResizeObserver = original;
    }
  });
});

describe("windowed rows: measured heights", () => {
  it("replaces the estimate with each drawn row's height", () => {
    // Row 2 wraps to 100 px; the estimate is 36.
    rowHeight = (index) => (index === 2 ? 100 : ROW);
    renderWindowed();
    // With row 2 measured, row 50 starts 64 px further down.
    scrollTo(offsetOf(50) + 64);
    expect(drawnIndexes()[0]).toBe(50 - OVERSCAN);
    expect(spacerHeight(spacers()[0]!)).toBe((50 - OVERSCAN) * ROW + 64);
  });

  it("counts an open expansion row as part of its row", () => {
    expansionHeight = 64;
    renderWindowed({
      expansion: {
        enabled: true,
        expanderColumns: ["name"],
        renderContent: (row: Item) => <div>Details of {row.name}</div>,
      },
    });
    fireEvent.click(screen.getByText("Row 2"));
    expect(screen.getByText("Details of Row 2")).toBeInTheDocument();
    const expansion = screen.getByText("Details of Row 2").closest("tr")!;
    expect(expansion).toHaveAttribute("data-windowed-expansion");
    expect(expansion.previousElementSibling).toBe(rowNamed("Row 2"));

    scrollTo(offsetOf(50) + 64);
    expect(drawnIndexes()[0]).toBe(50 - OVERSCAN);
  });
});

describe("windowed rows: kept rows", () => {
  it("keeps the row holding focus drawn when the window scrolls past it", () => {
    renderWindowed({ selection: { enabled: true } });
    const checkbox = within(rowNamed("Row 3")).getByRole("checkbox");
    act(() => checkbox.focus());
    expect(document.activeElement).toBe(checkbox);

    scrollTo(offsetOf(150));
    expect(drawnIndexes()).toContain(3);
    expect(drawnIndexes()[1]).toBe(150 - OVERSCAN);
    expect(document.activeElement).toBe(checkbox);
    // Spacers above it, between it and the window, and below.
    const [above, gap] = spacers();
    expect(spacerHeight(above!)).toBe(3 * ROW);
    expect(gap!.previousElementSibling).toBe(rowNamed("Row 3"));
    expect(spacerHeight(gap!)).toBe((150 - OVERSCAN - 4) * ROW);

    // Once focus leaves the grid, the row goes with the next scroll.
    act(() => checkbox.blur());
    scrollTo(offsetOf(151));
    expect(drawnIndexes()).not.toContain(3);
  });

  it("keeps the rows in keepMountedIds drawn wherever the window is", () => {
    renderWindowed({ windowedRows: { keepMountedIds: ["r150", "r199"] } });
    expect(drawnIndexes()).toEqual(
      expect.arrayContaining([0, OVERSCAN, 150, 199])
    );
    expect(rowNamed("Row 150")).toHaveAttribute("aria-rowindex", "152");
    // A spacer before each kept row, and the kept rows sit in order.
    expect(rowNamed("Row 150").previousElementSibling).toHaveAttribute(
      "aria-hidden",
      "true"
    );
    const indexes = drawnIndexes();
    expect([...indexes].sort((a, b) => a - b)).toEqual(indexes);
    // The spacers and rows still add up to the full height.
    const height =
      spacers().reduce((sum, tr) => sum + spacerHeight(tr), 0) +
      dataRows().length * ROW;
    expect(height).toBe(TOTAL * ROW);
  });
});

describe("windowed rows: tree rows", () => {
  const tree: Item[] = items(100, "P").map((parent, i) => ({
    ...parent,
    children: [0, 1].map((c) => ({
      id: `r${i}.${c}`,
      name: `P ${i} child ${c}`,
    })),
  }));
  const subRows: SubRowsConfig<Item> = {
    getSubRows: (row) => row.children,
    expanderColumn: "name",
  };

  it("expanding a parent redraws the window in place, without moving the scroll", () => {
    renderWindowed({ subRows }, tree);
    expect(table()).toHaveAttribute("aria-rowcount", "101");
    scrollTo(offsetOf(40));
    const before = scroller().scrollTop;
    const writes = scrollToCalls.length;
    expect(drawnIndexes()[0]).toBe(40 - OVERSCAN);

    fireEvent.click(
      within(rowNamed("P 45")).getByRole("button", { name: "Expand row" })
    );
    expect(table()).toHaveAttribute("aria-rowcount", "103");
    expect(scroller().scrollTop).toBe(before);
    expect(scrollToCalls).toHaveLength(writes);
    expect(drawnIndexes()[0]).toBe(40 - OVERSCAN);
    expect(rowNamed("P 45 child 0")).toHaveAttribute("data-index", "46");
    expect(rowNamed("P 45 child 1")).toHaveAttribute("aria-rowindex", "49");
    expect(rowNamed("P 46")).toHaveAttribute("data-index", "48");
  });

  it("memoized rows below an expanded parent take their new positions", () => {
    renderWindowed({ subRows, memoizeRows: true }, tree);
    expect(rowNamed("P 1")).toHaveAttribute("data-index", "1");
    fireEvent.click(
      within(rowNamed("P 0")).getByRole("button", { name: "Expand row" })
    );
    expect(rowNamed("P 0 child 1")).toHaveAttribute("data-index", "2");
    expect(rowNamed("P 1")).toHaveAttribute("data-index", "3");
    expect(rowNamed("P 1")).toHaveAttribute("aria-rowindex", "5");
  });
});

describe("windowed rows: what a normal body does", () => {
  it("reports hovered and clicked rows, also after scrolling", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onRowHover = jest.fn();
    const onRowClick = jest.fn();
    renderWindowed({ rowEvents: { onRowHover, onRowClick } });
    await user.hover(rowNamed("Row 1").querySelector("td")!);
    expect(onRowHover).toHaveBeenLastCalledWith(data[1]);
    await user.click(rowNamed("Row 1").querySelector("td")!);
    expect(onRowClick).toHaveBeenLastCalledWith(data[1]);

    scrollTo(offsetOf(100));
    await user.click(rowNamed("Row 105").querySelector("td")!);
    expect(onRowClick).toHaveBeenLastCalledWith(data[105]);
  });

  it("draws memoized rows that follow selection and the window", () => {
    renderWindowed({ memoizeRows: true, selection: { enabled: true } });
    const checkbox = within(rowNamed("Row 1")).getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(rowNamed("Row 1")).toHaveAttribute("data-state", "selected");
    expect(rowNamed("Row 2")).not.toHaveAttribute("data-state", "selected");

    scrollTo(offsetOf(100));
    expect(rowNamed("Row 100")).toHaveAttribute("aria-rowindex", "102");
  });

  it("selects every row, drawn or not, with select-all", () => {
    const onSelectionChange = jest.fn();
    renderWindowed({ selection: { enabled: true, onSelectionChange } });
    fireEvent.click(
      within(document.querySelector("thead")!).getByRole("checkbox")
    );
    expect(onSelectionChange).toHaveBeenLastCalledWith(data);
    dataRows().forEach((tr) =>
      expect(tr).toHaveAttribute("data-state", "selected")
    );
  });

  it("applies rowClassName, cellClassName and bodyClassName", () => {
    renderWindowed({
      rowClassName: (row: Item) => `row-${row.id}`,
      cellClassName: "cell-x",
      bodyClassName: "body-x",
    });
    expect(rowNamed("Row 4")).toHaveClass("row-r4");
    expect(rowNamed("Row 4").querySelector("td")).toHaveClass("cell-x");
    expect(document.querySelector("tbody")).toHaveClass("body-x");
  });
});

describe("windowed rows: other modes", () => {
  it("leaves enableVirtualization in charge when both are set", () => {
    const { container } = renderWindowed({ enableVirtualization: true });
    expect(table()).toHaveClass("border-separate");
    expect(
      container.querySelector<HTMLElement>('[style*="height: 600px"]')
    ).not.toBeNull();
    expect(table()).not.toHaveAttribute("aria-rowcount");
    expect(document.querySelector("[data-index]")).toBeNull();
  });

  it("draws the normal body with grouping", async () => {
    renderWindowed({
      grouping: { enabled: true, groupBy: ["name"], expanded: true },
    } as Partial<MasterDataGridConfig<Item>>);
    // TanStack resets the page index in a microtask after grouping.
    await act(async () => {});
    expect(table()).not.toHaveAttribute("aria-rowcount");
    expect(document.querySelector("[data-index]")).toBeNull();
  });
});
