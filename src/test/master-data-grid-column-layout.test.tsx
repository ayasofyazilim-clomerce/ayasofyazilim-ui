// Import the helper FIRST: its jest.mock calls must register before the grid loads.
import { renderGrid, setupGridMocks } from "./helpers/grid-test-setup";
import { screen, within } from "@testing-library/react";
import { Pencil } from "lucide-react";
import type { MasterDataGridConfig } from "../custom/master-data-grid";

setupGridMocks();

interface Item {
  id: string;
  name: string;
  status: string;
  summary: string;
}

const schema = {
  type: "object",
  properties: {
    name: { type: "string" },
    status: { type: "string" },
    summary: { type: "string" },
  },
};
const items: Item[] = [
  { id: "a", name: "Invoice 1", status: "open", summary: "First" },
];
const getRowId = (item: Item) => item.id;
const localization = { locale: "en-US", timeZone: "UTC", lang: "en" };
const rowActions = [
  { id: "edit", label: "Edit", icon: Pencil, onClick: jest.fn() },
];

type Config = Partial<MasterDataGridConfig<Item>>;
// columnOrder is typed as data keys; "select" and "actions" are column ids.
const ids = (...list: string[]) => list as unknown as Array<keyof Item>;

/** The header row as column ids: "select", "actions" or the header's text. */
function headerOrder(): string[] {
  const headers = within(document.querySelector("thead")!).getAllByRole(
    "columnheader"
  );
  return headers.map((th) => {
    if (within(th).queryByRole("checkbox")) return "select";
    const text = th.textContent ?? "";
    if (text.includes("column.actions")) return "actions";
    if (text.includes("column.edit")) return "edit-actions";
    return ["name", "status", "summary"].find((key) => text.includes(key))!;
  });
}

function render(config: Config) {
  return renderGrid<Item>(items, {
    schema,
    getRowId,
    localization,
    selection: { enabled: true },
    rowActions,
    ...config,
  });
}

describe("columnOrder keeps the select column first and actions last (#1090)", () => {
  it("without columnOrder", () => {
    render({});
    expect(headerOrder()).toEqual([
      "select",
      "name",
      "status",
      "summary",
      "actions",
    ]);
  });

  it("with columnOrder listing only data columns", () => {
    render({ columnOrder: ids("status", "name") });
    expect(headerOrder()).toEqual([
      "select",
      "status",
      "name",
      "summary",
      "actions",
    ]);
  });

  it("with select and actions listed explicitly", () => {
    render({ columnOrder: ids("select", "summary", "name", "actions") });
    expect(headerOrder()).toEqual([
      "select",
      "summary",
      "name",
      "status",
      "actions",
    ]);
  });

  it("with select and actions listed in the wrong places", () => {
    render({ columnOrder: ids("actions", "name", "select") });
    expect(headerOrder()).toEqual([
      "select",
      "name",
      "status",
      "summary",
      "actions",
    ]);
  });

  it("keeps the row-edit column with the trailing columns", () => {
    // "actions" is pinned right by default, so it renders after "edit-actions",
    // with or without columnOrder.
    const editing = { enabled: true, mode: "row" } as Config["editing"];
    const first = render({ editing });
    const withoutOrder = headerOrder();
    first.unmount();

    render({ columnOrder: ids("summary"), editing });
    expect(headerOrder()).toEqual([
      "select",
      "summary",
      "name",
      "status",
      ...withoutOrder.slice(-2),
    ]);
    expect(withoutOrder.slice(-2)).toEqual(["edit-actions", "actions"]);
  });

  it("keeps actions last by column order alone, with no pinning", () => {
    render({
      columnOrder: ids("status", "name"),
      editing: { enabled: true, mode: "row" },
      pinning: { right: [] },
    } as Config);
    expect(headerOrder()).toEqual([
      "select",
      "status",
      "name",
      "summary",
      "actions",
      "edit-actions",
    ]);
  });

  it("with a columnVisibility show list instead of columnOrder", () => {
    render({
      columnVisibility: { mode: "show", columns: ["status", "name"] },
    });
    const order = headerOrder();
    expect(order[0]).toBe("select");
    expect(order[order.length - 1]).toBe("actions");
    expect(order.indexOf("status")).toBeLessThan(order.indexOf("name"));
  });
});

describe("width, minWidth and maxWidth on schema columns (#1089)", () => {
  const cellOf = (text: string) => screen.getByText(text).closest("td")!;

  it("sizes a schema column from its column config", () => {
    render({
      selection: undefined,
      rowActions: undefined,
      columns: [{ id: "summary", width: 420, minWidth: 300, maxWidth: 500 }],
    } as Config);
    const style = cellOf("First").style;
    expect(style.width).toBe("420px");
    expect(style.minWidth).toBe("300px");
    expect(style.maxWidth).toBe("500px");
  });

  it("leaves the other schema columns at the default size", () => {
    render({
      selection: undefined,
      rowActions: undefined,
      columns: [{ id: "summary", width: 420 }],
    } as Config);
    const sized = cellOf("First").style;
    expect(sized.width).toBe("420px");
    // Only width was given: minSize and maxSize keep TanStack's defaults.
    expect(sized.minWidth).toBe("20px");
    expect(sized.maxWidth).toBe(`${Number.MAX_SAFE_INTEGER}px`);
    expect(cellOf("Invoice 1").style.width).toBe("150px");
  });
});
