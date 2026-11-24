// Import the helper FIRST: its jest.mock calls must register before the grid loads.
import { renderGrid, setupGridMocks, testResources } from "./helpers/grid-test-setup";
import { screen, within } from "@testing-library/react";
import { MasterDataGrid } from "../custom/master-data-grid/components/master-data-grid";
import type { MasterDataGridConfig } from "../custom/master-data-grid";

setupGridMocks();

interface Item {
  id: string;
  name: string;
}
const schema = { type: "object", properties: { name: { type: "string" } } };
const items: Item[] = [
  { id: "a", name: "Invoice 1" },
  { id: "b", name: "Invoice 2" },
];

const rowBox = (name: string) =>
  within(screen.getByText(name).closest("tr")!).getByRole("checkbox");

// Stable across renders, as a caller keeps them: a new `getRowId` or `localization` rebuilds the columns.
const getRowId = (item: Item) => item.id;
const localization = { locale: "en-US", timeZone: "UTC", lang: "en" };

const config = (selection: MasterDataGridConfig<Item>["selection"]) =>
  ({
    schema,
    getRowId,
    localization,
    selection,
  }) as Partial<MasterDataGridConfig<Item>>;

describe("selection.rowLabel", () => {
  it("names each row's checkbox after its row", () => {
    const rowLabel = jest.fn((item: Item) => `Select ${item.name}`);
    renderGrid<Item>(items, config({ enabled: true, rowLabel }));
    expect(rowBox("Invoice 1")).toHaveAccessibleName("Select Invoice 1");
    expect(rowBox("Invoice 2")).toHaveAccessibleName("Select Invoice 2");
    expect(rowLabel).toHaveBeenCalledWith(items[0]);
    expect(rowLabel).toHaveBeenCalledWith(items[1]);
  });

  it("falls back to the column.selectRow resource without it", () => {
    renderGrid<Item>(items, config({ enabled: true }));
    expect(rowBox("Invoice 1")).toHaveAccessibleName("column.selectRow");
    expect(rowBox("Invoice 2")).toHaveAccessibleName("column.selectRow");
  });

  it("leaves the select-all checkbox's name alone", () => {
    renderGrid<Item>(items, config({ enabled: true, rowLabel: (item) => `Select ${item.name}` }));
    expect(
      within(document.querySelector("thead")!).getByRole("checkbox")
    ).toHaveAccessibleName("column.selectAll");
  });

  it("keeps each checkbox while rowLabel stays the same, and names it anew when it changes", () => {
    const english = (item: Item) => `Select ${item.name}`;
    const turkish = (item: Item) => `Seç ${item.name}`;
    const full = (rowLabel: (item: Item) => string, selectedIds: string[]) =>
      ({ t: testResources, ...config({ enabled: true, rowLabel, selectedIds }) }) as MasterDataGridConfig<Item>;
    const { rerender } = renderGrid<Item>(items, full(english, []));
    const before = rowBox("Invoice 1");
    // A selection change with the same rowLabel draws the same checkbox (no remount).
    rerender(<MasterDataGrid data={items} config={full(english, ["a"])} />);
    expect(rowBox("Invoice 1")).toBe(before);
    expect(rowBox("Invoice 1")).toHaveAttribute("aria-checked", "true");
    // A new rowLabel names the checkboxes anew.
    rerender(<MasterDataGrid data={items} config={full(turkish, ["a"])} />);
    expect(rowBox("Invoice 1")).toHaveAccessibleName("Seç Invoice 1");
    expect(rowBox("Invoice 2")).toHaveAccessibleName("Seç Invoice 2");
  });
});
