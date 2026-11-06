// Import the helper FIRST: its jest.mock calls must register before the grid loads.
import { renderGrid, setupGridMocks } from "./helpers/grid-test-setup";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pencil } from "lucide-react";

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

const { navigateMock } = setupGridMocks();

interface Row {
  name: string;
}

const names = ["Charlie", "Alice", "Bob"];
const data: Row[] = names.map((name) => ({ name }));

const bodyRows = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("tbody tr"));

describe("grid test setup", () => {
  it("registers its module mocks before the grid loads", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nav = require("next/navigation");
    expect(nav.usePathname()).toBe("/en/management/logs/audit");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useGridNavigation } = require("../custom/master-data-grid/hooks/use-grid-navigation");
    useGridNavigation().navigate("/x", { replace: true });
    expect(navigateMock).toHaveBeenCalledWith("/x", { replace: true });
  });
});

describe("MasterDataGrid today (characterization)", () => {
  it("renders one header row with a cell per visible column and no tfoot", () => {
    const { container } = renderGrid(data, {
      columns: [{ id: "name", accessorKey: "name" }],
    });
    expect(container.querySelectorAll("thead tr")).toHaveLength(1);
    expect(container.querySelectorAll("thead th")).toHaveLength(1);
    expect(container.querySelector("tfoot")).toBeNull();
  });

  it("ignores ColumnConfig.footer (today's behaviour)", () => {
    const { container } = renderGrid(data, {
      columns: [{ id: "name", accessorKey: "name", footer: () => "TOTAL" }],
    });
    expect(screen.queryByText("TOTAL")).toBeNull();
    expect(container.querySelector("tfoot")).toBeNull();
  });

  it("sorts ascending from the header menu", async () => {
    const user = userEvent.setup();
    const { container } = renderGrid(data, {
      columns: [{ id: "name", accessorKey: "name" }],
    });
    expect(bodyRows(container)[0]).toHaveTextContent("Charlie");

    const headerButton = within(container.querySelector("thead")!).getByRole(
      "button",
      { name: /name/i }
    );
    await user.click(headerButton);
    await user.click(await screen.findByText("column.sortAsc"));

    expect(bodyRows(container)[0]).toHaveTextContent("Alice");
    expect(bodyRows(container)[2]).toHaveTextContent("Charlie");
  });

  it("hides a column from the header menu", async () => {
    const user = userEvent.setup();
    const { container } = renderGrid(data, {
      columns: [{ id: "name", accessorKey: "name" }],
    });
    expect(container.querySelectorAll("thead th")).toHaveLength(1);

    const headerButton = within(container.querySelector("thead")!).getByRole(
      "button",
      { name: /name/i }
    );
    await user.click(headerButton);
    await user.click(await screen.findByText("column.hide"));

    expect(container.querySelectorAll("thead th")).toHaveLength(0);
    expect(screen.queryByText("Alice")).toBeNull();
  });

  it("applies rowClassName and cellClassName functions to body rows and cells", () => {
    const { container } = renderGrid(data, {
      columns: [{ id: "name", accessorKey: "name" }],
      rowClassName: (r) => `row-${r.name}`,
      cellClassName: ({ columnId }) => `cell-${columnId}`,
    });
    const rows = bodyRows(container);
    expect(rows[0]).toHaveClass("row-Charlie");
    expect(rows[1]).toHaveClass("row-Alice");
    expect(rows[2]).toHaveClass("row-Bob");
    rows.forEach((row) => {
      expect(row.querySelector("td")).toHaveClass("cell-name");
    });
  });

  it("shows t['table.noResults'] in one full-width cell when filtered to nothing", async () => {
    const user = userEvent.setup();
    const { container } = renderGrid(data, {
      columns: [{ id: "name", accessorKey: "name" }],
    });
    const search = screen.getByPlaceholderText("toolbar.search");
    // The toolbar debounces the global filter (300ms), so wait for it to land.
    await user.type(search, "zzz-no-match");
    await waitFor(() =>
      expect(container.querySelectorAll("tbody td")).toHaveLength(1)
    );

    const cells = container.querySelectorAll("tbody td");
    expect(cells[0]).toHaveTextContent("table.noResults");
    expect(cells[0]).toHaveAttribute("colspan", "1");
  });

  it("renders the select column, centred, when selection.enabled", () => {
    const { container } = renderGrid(data, {
      columns: [{ id: "name", accessorKey: "name" }],
      selection: { enabled: true },
    });
    const firstCell = container.querySelector("tbody tr td")!;
    const wrapper = firstCell.firstElementChild as HTMLElement;
    expect(wrapper.className).toBe("flex items-center justify-center");
    expect(
      within(wrapper).getByRole("checkbox", { name: "column.selectRow" })
    ).toBeInTheDocument();
  });

  describe("row actions display", () => {
    const rowActions = [
      {
        id: "edit",
        label: "Edit-action",
        icon: Pencil,
        onClick: jest.fn(),
      },
    ];
    const columns = [{ id: "name", accessorKey: "name" }];

    it("defaults to a dropdown", async () => {
      const user = userEvent.setup();
      renderGrid(data, { columns, rowActions });
      const triggers = screen.getAllByRole("button", {
        name: "column.openMenu",
      });
      expect(triggers).toHaveLength(3);
      expect(screen.queryByText("Edit-action")).toBeNull();
      await user.click(triggers[0]);
      expect(
        await screen.findByRole("menuitem", { name: "Edit-action" })
      ).toBeInTheDocument();
    });

    it("renders inline buttons in inline mode", () => {
      renderGrid(data, { columns, rowActions, rowActionsDisplay: "inline" });
      expect(
        screen.queryByRole("button", { name: "column.openMenu" })
      ).toBeNull();
      const cell = document.querySelector("tbody tr td:last-child")!;
      expect(cell.querySelectorAll("button")).toHaveLength(1);
      expect(
        cell.querySelector(".flex.items-center.gap-1.px-2")
      ).not.toBeNull();
    });

    it("renders both the dropdown and inline buttons in responsive mode", () => {
      renderGrid(data, {
        columns,
        rowActions,
        rowActionsDisplay: "responsive",
      });
      const cell = document.querySelector("tbody tr td:last-child")!;
      expect(cell.querySelector("div.md\\:hidden")).not.toBeNull();
      expect(cell.querySelector("div.hidden.md\\:flex")).not.toBeNull();
      expect(
        within(cell as HTMLElement).getByRole("button", {
          name: "column.openMenu",
        })
      ).toBeInTheDocument();
      expect(
        cell.querySelectorAll("div.hidden.md\\:flex button")
      ).toHaveLength(1);
    });
  });

  it("toggles expansion content from an expander column", () => {
    renderGrid(data, {
      columns: [{ id: "name", accessorKey: "name" }],
      expansion: {
        enabled: true,
        renderContent: (r) => <div>detail-{r.name}</div>,
        expanderColumns: ["name"],
      },
    });
    expect(screen.queryByText("detail-Charlie")).toBeNull();

    fireEvent.click(screen.getByText("Charlie").closest(".expander")!);
    expect(screen.getByText("detail-Charlie")).toBeInTheDocument();
    expect(screen.queryByText("detail-Alice")).toBeNull();

    fireEvent.click(screen.getByText("Charlie").closest(".expander")!);
    expect(screen.queryByText("detail-Charlie")).toBeNull();
  });

  it("edits a row in row mode and calls onRowSave with the changes", async () => {
    const user = userEvent.setup();
    const onRowSave = jest.fn();
    renderGrid(data, {
      columns: [{ id: "name", accessorKey: "name" }],
      editing: { enabled: true, mode: "row", onRowSave },
    });

    const editButtons = screen.getAllByRole("button", { name: "column.edit" });
    await user.click(editButtons[0]);

    const input = screen.getByDisplayValue("Charlie");
    fireEvent.change(input, { target: { value: "Charles" } });
    // The cell debounces its update (150ms) before it reaches the editing state.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });
    await user.click(screen.getByRole("button", { name: "column.save" }));

    expect(onRowSave).toHaveBeenCalledTimes(1);
    expect(onRowSave).toHaveBeenCalledWith(
      { name: "Charlie" },
      { name: "Charles" }
    );
    expect(screen.queryByRole("button", { name: "column.save" })).toBeNull();
  });

  it("normal mode body cells have neither border-r nor border-dashed without editing", () => {
    const { container } = renderGrid(data, {
      columns: [{ id: "name", accessorKey: "name" }],
    });
    const cells = container.querySelectorAll("tbody td");
    expect(cells.length).toBeGreaterThan(0);
    cells.forEach((td) => {
      expect(td).not.toHaveClass("border-r");
      expect(td).not.toHaveClass("border-dashed");
    });
  });

  describe("virtual mode", () => {
    it("renders virtual mode rows with 'border-b border-r' cell classes", () => {
      const { container } = renderGrid(data, {
        columns: [{ id: "name", accessorKey: "name" }],
        enableVirtualization: true,
      });
      const cells = container.querySelectorAll("tbody td");
      expect(bodyRows(container)).toHaveLength(3);
      expect(cells.length).toBeGreaterThan(0);
      cells.forEach((td) => {
        expect(td).toHaveClass("border-b");
        expect(td).toHaveClass("border-r");
        expect(td).not.toHaveClass("border-dashed");
      });
    });

    it("replaces 'border-b border-r' with a dashed full border when editing.enabled", () => {
      const { container } = renderGrid(data, {
        columns: [{ id: "name", accessorKey: "name" }],
        enableVirtualization: true,
        editing: { enabled: true },
      });
      const cells = container.querySelectorAll("tbody td");
      expect(cells.length).toBeGreaterThan(0);
      cells.forEach((td) => {
        // cn() (tailwind-merge) lets the later "border" utility swallow
        // "border-b border-r", so editing cells end up with a full dashed border.
        expect(td).toHaveClass("border");
        expect(td).toHaveClass("border-dashed");
        expect(td).not.toHaveClass("border-b");
        expect(td).not.toHaveClass("border-r");
      });
    });

    it("does not centre the select cell in virtual mode", () => {
      const { container } = renderGrid(data, {
        columns: [{ id: "name", accessorKey: "name" }],
        enableVirtualization: true,
        selection: { enabled: true },
      });
      const firstCell = container.querySelector("tbody tr td")!;
      expect(
        within(firstCell as HTMLElement).getByRole("checkbox")
      ).toBeInTheDocument();
      expect(firstCell.querySelector(".justify-center")).toBeNull();
      // Positive: the checkbox is the cell's direct child, with no wrapper.
      const checkbox = within(firstCell as HTMLElement).getByRole("checkbox");
      expect(checkbox.parentElement).toBe(firstCell);
      expect(firstCell.children).toHaveLength(1);
    });

    it("has no grouping branch: grouping.enabled renders flat rows, no group header colSpan", () => {
      const { container } = renderGrid(data, {
        columns: [{ id: "name", accessorKey: "name" }],
        enableVirtualization: true,
        grouping: { enabled: true, groupBy: ["name"], expanded: true },
      } as never);
      // Virtual mode has no grouping branch: with 3 distinct names, the grouped
      // row model yields 3 group rows + 3 leaves, all drawn as plain rows.
      expect(bodyRows(container)).toHaveLength(6);
      expect(container.querySelectorAll("td[colspan]")).toHaveLength(0);
    });
  });
});
