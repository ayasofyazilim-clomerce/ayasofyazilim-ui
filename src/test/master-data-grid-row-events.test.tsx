// Import the helper FIRST: its jest.mock calls must register before the grid loads.
import { renderGrid, setupGridMocks } from "./helpers/grid-test-setup";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pencil } from "lucide-react";
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
const child: Node = { name: "Child" };
const a: Node = { name: "Alpha", children: [child] };
const b: Node = { name: "Beta" };
const data: Node[] = [a, b];
const schema = { type: "object", properties: { name: { type: "string" } } };

const render = (config: Partial<MasterDataGridConfig<Node>>) =>
  renderGrid<Node>(data, { schema, ...config } as Partial<
    MasterDataGridConfig<Node>
  >);

const cellOf = (text: string) => screen.getByText(text).closest("td")!;

describe.each([
  ["normal", {}],
  ["virtual", { virtualization: { enabled: true } }],
] as const)("row events (%s mode)", (_mode, extra) => {
  it("reports the hovered row, then null on leave", async () => {
    const user = userEvent.setup();
    const onRowHover = jest.fn();
    render({ ...extra, rowEvents: { onRowHover } });
    await user.hover(cellOf("Alpha"));
    expect(onRowHover).toHaveBeenLastCalledWith(a);
    await user.unhover(cellOf("Alpha"));
    expect(onRowHover).toHaveBeenLastCalledWith(null);
  });

  it("reports the clicked row", async () => {
    const user = userEvent.setup();
    const onRowClick = jest.fn();
    render({ ...extra, rowEvents: { onRowClick } });
    await user.click(cellOf("Beta"));
    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledWith(b);
  });

  it("ignores clicks on the selection checkbox", async () => {
    const user = userEvent.setup();
    const onRowClick = jest.fn();
    render({
      ...extra,
      selection: { enabled: true },
      rowEvents: { onRowClick },
    });
    const box = screen.getAllByRole("checkbox", {
      name: "column.selectRow",
    })[0]!;
    await user.click(box);
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("ignores clicks on a row-action button", async () => {
    const user = userEvent.setup();
    const onRowClick = jest.fn();
    const onClick = jest.fn();
    render({
      ...extra,
      rowActions: [{ id: "edit", label: "Edit", icon: Pencil, onClick }],
      rowActionsDisplay: "inline",
      rowEvents: { onRowClick },
    });
    await user.click(
      document.querySelector<HTMLElement>("tbody tr td:last-child button")!,
    );
    expect(onClick).toHaveBeenCalled();
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("ignores clicks inside [data-row-click-ignore]", async () => {
    const user = userEvent.setup();
    const onRowClick = jest.fn();
    render({
      ...extra,
      columns: [
        {
          id: "name",
          accessorKey: "name",
          cell: ({ row }: { row: { original: Node } }) => (
            <span data-row-click-ignore>
              <i>{row.original.name}</i>
            </span>
          ),
        },
      ],
      rowEvents: { onRowClick },
    } as Partial<MasterDataGridConfig<Node>>);
    await user.click(screen.getByText("Beta"));
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("ignores a click on the select cell and the actions cell, but not a data cell", async () => {
    const user = userEvent.setup();
    const onRowClick = jest.fn();
    render({
      ...extra,
      selection: { enabled: true },
      rowActions: [
        { id: "edit", label: "Edit", icon: Pencil, onClick: jest.fn() },
      ],
      rowActionsDisplay: "inline",
      rowEvents: { onRowClick },
    });
    const row = cellOf("Beta").closest("tr")!;
    const selectCell = row.querySelector("td:first-child")!;
    const actionsCell = row.querySelector("td:last-child")!;
    expect(selectCell).toHaveAttribute("data-row-click-ignore");
    expect(actionsCell).toHaveAttribute("data-row-click-ignore");

    await user.click(selectCell);
    await user.click(actionsCell);
    expect(onRowClick).not.toHaveBeenCalled();

    await user.click(cellOf("Beta"));
    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledWith(b);
  });

  it("reports a child row when tree rows are on", async () => {
    const user = userEvent.setup();
    const onRowHover = jest.fn();
    const onRowClick = jest.fn();
    render({
      ...extra,
      subRows: {
        getSubRows: (n: Node) => n.children,
        expanderColumn: "name",
        defaultExpanded: true,
      },
      rowEvents: { onRowHover, onRowClick },
    } as Partial<MasterDataGridConfig<Node>>);
    await user.hover(cellOf("Child"));
    expect(onRowHover).toHaveBeenLastCalledWith(child);
    await user.click(cellOf("Child"));
    expect(onRowClick).toHaveBeenLastCalledWith(child);
  });

  it("attaches nothing without rowEvents", () => {
    render({ ...extra });
    expect(cellOf("Alpha").closest("tr")!.className).not.toMatch(
      /cursor-pointer/,
    );
  });
});
