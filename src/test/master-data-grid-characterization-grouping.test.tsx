// Import the helper FIRST: its jest.mock calls must register before the grid loads.
import { renderGrid, setupGridMocks } from "./helpers/grid-test-setup";
import { screen, within } from "@testing-library/react";

setupGridMocks();

interface Party {
  id: string;
  name: string;
  parentId: string | null;
}

const schema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    parentId: { type: "string" },
  },
};

// unirefund's parties screen grouping config, verbatim.
const grouping = {
  enabled: true,
  groupBy: ["parentId"],
  expanded: true as const,
  hideNullGroups: true,
  groupLabelField: "name",
  hideGroupParentRows: true,
  groupFallbackRenderer: ({
    groupValue,
    subRowCount,
  }: {
    groupValue: string;
    subRowCount: number;
  }) => <span>{`fallback-${groupValue}-${subRowCount}`}</span>,
};

const data: Party[] = [
  { id: "h1", name: "HQ One", parentId: null },
  { id: "c1", name: "Child One", parentId: "h1" },
  { id: "c2", name: "Child Two", parentId: "h1" },
  { id: "c3", name: "Orphan Three", parentId: "x9" },
];

const render = () =>
  renderGrid<Party>(data, {
    schema,
    grouping,
    enablePagination: false,
  } as never);

describe("MasterDataGrid grouping today (characterization)", () => {
  it("draws the parent row in place of its group header", () => {
    const { container } = render();
    expect(screen.getAllByText("HQ One")).toHaveLength(1);
    const hqRow = screen.getByText("HQ One").closest("tr")!;
    // Normal row (not a colSpan group header) with a collapse button.
    expect(
      within(hqRow).getByRole("button", { name: "Collapse" })
    ).toBeInTheDocument();
    expect(hqRow.querySelectorAll("td").length).toBeGreaterThan(0);
    expect(hqRow.querySelector("td[colspan]")).toBeNull();
    // No default group header for h1: no "(2)" count span anywhere.
    expect(container.textContent).not.toContain("(2)");
  });

  it("uses groupFallbackRenderer when the parent is not in the data", () => {
    render();
    expect(screen.getByText("fallback-x9-1")).toBeInTheDocument();
  });

  it("hides the null group", () => {
    const { container } = render();
    // HQ One is the only null-parent row; its group header must not be drawn.
    expect(screen.queryByText(/fallback-null/)).toBeNull();
    expect(screen.queryByText(/fallback--/)).toBeNull();
    expect(screen.queryByText(/fallback-/, { selector: "span" })).not.toBeNull();
    expect(container.querySelectorAll("td[colspan]")).toHaveLength(1);
  });

  it("indents the first cell of grouped children with pl-9", () => {
    render();
    const childRow = screen.getByText("Child One").closest("tr")!;
    expect(childRow.querySelector("td")!.className).toContain("pl-9");
    const orphanRow = screen.getByText("Orphan Three").closest("tr")!;
    expect(orphanRow.querySelector("td")!.className).toContain("pl-9");
    const hqRow = screen.getByText("HQ One").closest("tr")!;
    expect(hqRow.querySelector("td")!.className).not.toContain("pl-9");
  });
});
