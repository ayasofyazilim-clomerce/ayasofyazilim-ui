import { render } from "@testing-library/react";
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
