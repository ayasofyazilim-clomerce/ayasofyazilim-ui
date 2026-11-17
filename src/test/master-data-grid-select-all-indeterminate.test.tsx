// Import the helper FIRST: its jest.mock calls must register before the grid loads.
import { renderGrid, setupGridMocks } from "./helpers/grid-test-setup";
import { fireEvent, screen, within } from "@testing-library/react";
import type { MasterDataGridConfig } from "../custom/master-data-grid";

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
  children?: Node[];
}
const schema = { type: "object", properties: { name: { type: "string" } } };

const selectAll = () =>
  within(document.querySelector("thead")!).getByRole("checkbox", {
    name: "column.selectAll",
  });
const rowBox = (name: string) =>
  within(screen.getByText(name).closest("tr")!).getByRole("checkbox");

const flat: Node[] = [{ name: "A" }, { name: "B" }, { name: "C" }];
const tree: Node[] = [
  { name: "P0", children: [{ name: "C00" }, { name: "C01" }] },
  { name: "P1" },
];

const renderFlat = () =>
  renderGrid<Node>(flat, {
    schema,
    selection: { enabled: true },
  } as Partial<MasterDataGridConfig<Node>>);

const renderTree = () =>
  renderGrid<Node>(tree, {
    schema,
    selection: { enabled: true },
    subRows: {
      getSubRows: (n: Node) => n.children,
      expanderColumn: "name",
      defaultExpanded: true,
    },
  } as Partial<MasterDataGridConfig<Node>>);

describe.each([
  ["flat", renderFlat, "A", ["A", "B", "C"]],
  ["tree", renderTree, "C00", ["P0", "C00", "C01", "P1"]],
] as const)("select-all checkbox (%s mode)", (_mode, mount, one, all) => {
  it("is mixed when some rows are selected", () => {
    mount();
    expect(selectAll()).toHaveAttribute("aria-checked", "false");
    fireEvent.click(rowBox(one));
    expect(selectAll()).toHaveAttribute("aria-checked", "mixed");
  });

  it("is true when every row is selected and false once cleared", () => {
    mount();
    fireEvent.click(selectAll());
    expect(selectAll()).toHaveAttribute("aria-checked", "true");
    fireEvent.click(selectAll());
    expect(selectAll()).toHaveAttribute("aria-checked", "false");
    for (const name of all) {
      expect(rowBox(name)).toHaveAttribute("aria-checked", "false");
    }
  });

  it("selects every row when clicked while mixed", () => {
    mount();
    fireEvent.click(rowBox(one));
    expect(selectAll()).toHaveAttribute("aria-checked", "mixed");
    fireEvent.click(selectAll());
    expect(selectAll()).toHaveAttribute("aria-checked", "true");
    for (const name of all) {
      expect(rowBox(name)).toHaveAttribute("aria-checked", "true");
    }
  });
});
