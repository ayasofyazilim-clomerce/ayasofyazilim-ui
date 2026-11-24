// Import the helper FIRST: its jest.mock calls must register before the grid loads.
import { setupGridMocks, testResources } from "./helpers/grid-test-setup";
import { render, screen, within } from "@testing-library/react";
import { MasterDataGrid } from "../custom/master-data-grid/components/master-data-grid";
import type { MasterDataGridConfig, RowAction } from "../custom/master-data-grid";

setupGridMocks();

interface Item {
  id: string;
  name: string;
}

// Everything the columns are built from stays the same object across renders, as a caller keeps
// it: only `data` changes below.
const schema = { type: "object", properties: { name: { type: "string" } } };
const getRowId = (item: Item) => item.id;
const localization = { locale: "en-US", timeZone: "UTC", lang: "en" };
const rowActions: RowAction<Item>[] = [{ id: "open", label: "Open", onClick: () => {} }];
const config = {
  schema,
  getRowId,
  localization,
  t: testResources,
  enablePagination: false,
  selection: { enabled: true },
  rowActions,
} as MasterDataGridConfig<Item>;

const rowOf = (name: string) => screen.getByText(name).closest("tr")!;
const rowBox = (name: string) => within(rowOf(name)).getByRole("checkbox");
const rowMenu = (name: string) =>
  within(rowOf(name)).getByRole("button", { name: "column.openMenu" });
const headerBox = () =>
  within(document.querySelector("thead")!).getByRole("checkbox");

const first: Item[] = [
  { id: "a", name: "Invoice 1" },
  { id: "b", name: "Invoice 2" },
];

describe("a data change keeps the grid's own cells mounted", () => {
  it("keeps a focused row checkbox, its row's ⋯ trigger and the header box when the rows are reordered", () => {
    const { rerender } = render(<MasterDataGrid data={first} config={config} />);
    const box = rowBox("Invoice 1");
    const menu = rowMenu("Invoice 1");
    const header = headerBox();
    box.focus();
    expect(document.activeElement).toBe(box);

    // A new array, reordered (a sort), as a list reload or a sort hands the grid.
    rerender(<MasterDataGrid data={[first[1]!, first[0]!]} config={config} />);
    expect(rowBox("Invoice 1")).toBe(box);
    expect(rowMenu("Invoice 1")).toBe(menu);
    expect(headerBox()).toBe(header);
    expect(document.activeElement).toBe(box);
  });

  it("keeps them when a row's data changes and a row is added (a reload after an action)", () => {
    const { rerender } = render(<MasterDataGrid data={first} config={config} />);
    const menu = rowMenu("Invoice 2");
    menu.focus();
    const reloaded: Item[] = [
      { id: "a", name: "Invoice 1" },
      { id: "b", name: "Invoice 2" },
      { id: "c", name: "Invoice 3" },
    ];
    rerender(<MasterDataGrid data={reloaded} config={config} />);
    expect(rowMenu("Invoice 2")).toBe(menu);
    expect(document.activeElement).toBe(menu);
  });
});
