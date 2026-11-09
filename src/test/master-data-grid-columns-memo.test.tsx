import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useEffect } from "react";
import { MasterDataGrid } from "../custom/master-data-grid/components/master-data-grid";
import * as columnGenerator from "../custom/master-data-grid/utils/column-generator";
import type { MasterDataGridConfig } from "../custom/master-data-grid/types";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/en/test",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }: { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

beforeAll(() => {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })) as unknown as typeof window.matchMedia;
});

import type { JSONSchema } from "../custom/master-data-grid/types";
type Row = { id: string; name: string };
const data: Row[] = [{ id: "1", name: "Alpha" }];
const schema: JSONSchema = {
  type: "object",
  properties: { id: { type: "string" }, name: { type: "string" } },
};

describe("MasterDataGrid column memoization", () => {
  let spy: jest.SpyInstance;

  beforeEach(() => {
    spy = jest.spyOn(columnGenerator, "generateColumnsFromSchema");
  });
  afterEach(() => spy.mockRestore());

  it("does not rebuild columns when a rerender passes a new config object with the same field references", () => {
    const columns: MasterDataGridConfig<Row>["columns"] = [];
    const base = { schema, columns } as MasterDataGridConfig<Row>;
    const { rerender } = render(
      <MasterDataGrid<Row> data={data} config={{ ...base }} />
    );
    const callsAfterMount = spy.mock.calls.length;
    expect(callsAfterMount).toBeGreaterThan(0);

    rerender(<MasterDataGrid<Row> data={data} config={{ ...base }} />);
    expect(spy.mock.calls.length).toBe(callsAfterMount);
  });

  it("rebuilds columns when config.columns changes", () => {
    const base = { schema } as MasterDataGridConfig<Row>;
    const { rerender } = render(
      <MasterDataGrid<Row> data={data} config={{ ...base, columns: [] }} />
    );
    const callsAfterMount = spy.mock.calls.length;

    rerender(
      <MasterDataGrid<Row> data={data} config={{ ...base, columns: [] }} />
    );
    expect(spy.mock.calls.length).toBe(callsAfterMount + 1);
  });

  it("rebuilds columns when a value captured at build time (cellClassName) changes", () => {
    const columns: MasterDataGridConfig<Row>["columns"] = [];
    const base = { schema, columns } as MasterDataGridConfig<Row>;
    const { rerender } = render(
      <MasterDataGrid<Row>
        data={data}
        config={{ ...base, cellClassName: "a" }}
      />
    );
    const callsAfterMount = spy.mock.calls.length;

    rerender(
      <MasterDataGrid<Row>
        data={data}
        config={{ ...base, cellClassName: "b" }}
      />
    );
    expect(spy.mock.calls.length).toBe(callsAfterMount + 1);
  });
});

// Columns built once keep their cell and header functions, and TanStack renders
// those functions as components. Before the memo every grid re-render made new
// ones, so every library-built cell remounted (losing focus, open menus and
// dialogs). These pin the memoized behaviour.
describe("MasterDataGrid library-built cells keep their identity", () => {
  const localization = { locale: "en-US", timeZone: "UTC", lang: "en" };

  it("mounts an inline row-action render once across a mount and three parent rerenders", () => {
    let mounts = 0;
    function Probe() {
      useEffect(() => {
        mounts += 1;
      }, []);
      return <span>probe</span>;
    }
    const rowActions: MasterDataGridConfig<Row>["rowActions"] = [
      { id: "probe", render: () => <Probe /> },
    ];
    const config = {
      schema,
      localization,
      rowActionsDisplay: "inline",
      rowActions,
    } as MasterDataGridConfig<Row>;

    const { rerender } = render(
      <MasterDataGrid<Row> data={data} config={config} />
    );
    for (let i = 0; i < 3; i++) {
      rerender(<MasterDataGrid<Row> data={data} config={config} />);
    }

    expect(screen.getByText("probe")).toBeTruthy();
    expect(mounts).toBe(1);
  });

  it("keeps the row-edit input focused and mounted after the debounce and a parent rerender", async () => {
    const editing = { enabled: true, mode: "row" as const };
    const getRowId = (row: Row) => row.id;
    const t = { "column.edit": "Edit" } as MasterDataGridConfig<Row>["t"];
    const config = {
      schema,
      localization,
      editing,
      getRowId,
      t,
    } as MasterDataGridConfig<Row>;

    const { rerender } = render(
      <MasterDataGrid<Row> data={data} config={config} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    const input = within(screen.getByRole("table")).getByDisplayValue(
      "Alpha"
    ) as HTMLInputElement;
    act(() => input.focus());
    fireEvent.change(input, { target: { value: "AlphaX" } });

    // The cell debounces its update (150 ms) before it reaches the grid state.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
    });
    rerender(<MasterDataGrid<Row> data={data} config={config} />);

    expect(input.isConnected).toBe(true);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe("AlphaX");
  });
});
