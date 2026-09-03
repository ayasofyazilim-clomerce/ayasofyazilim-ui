import { render, screen } from "@testing-library/react";
import { MasterDataGrid } from "../custom/master-data-grid/components/master-data-grid";
import type { MasterDataGridConfig } from "../custom/master-data-grid/types";

// jsdom has no matchMedia, which the toolbar's useIsMobile needs.
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

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => "/tags",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }: { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

interface Row {
  name: string;
}

const data: Row[] = Array.from({ length: 10 }, (_, index) => ({
  name: `row-${index}`,
}));

const baseConfig: MasterDataGridConfig<Row> = {
  localization: { locale: "en-US", timeZone: "UTC", lang: "en" },
  schema: {
    type: "object",
    properties: { name: { type: "string" } },
  },
  columns: [{ id: "name", accessorKey: "name", header: "Name" }],
};

const summary = () => screen.getByTestId("row-count-summary").textContent;

describe("MasterDataGrid row count coverage", () => {
  it("shows the server total in the pagination footer", () => {
    render(
      <MasterDataGrid data={data} config={{ ...baseConfig, rowCount: 1204 }} />
    );
    expect(summary()).toBe("1,204");
  });

  it("shows the count for a client-paged grid with no rowCount", () => {
    render(<MasterDataGrid data={data} config={baseConfig} />);
    expect(summary()).toBe("10");
  });

  it("shows filtered of unfiltered when the API reports an unfiltered total", () => {
    render(
      <MasterDataGrid
        data={data}
        config={{ ...baseConfig, rowCount: 24, unfilteredRowCount: 1204 }}
      />
    );
    expect(summary()).toBe("24 of 1,204");
  });

  it("falls back to the toolbar when pagination is disabled", () => {
    render(
      <MasterDataGrid
        data={data}
        config={{ ...baseConfig, enablePagination: false }}
      />
    );
    expect(summary()).toBe("10");
  });

  // The toolbar used to return null with every feature off, which would have
  // swallowed the count on the grids that disable both it and pagination.
  it("shows the count with pagination off and every toolbar feature off", () => {
    render(
      <MasterDataGrid
        data={data}
        config={{
          ...baseConfig,
          enablePagination: false,
          enableSearch: false,
          enableFiltering: false,
          enableColumnVisibility: false,
          enableExport: false,
          enableSorting: false,
          enablePinning: false,
          enableResizing: false,
        }}
      />
    );
    expect(summary()).toBe("10");
  });

  it("renders exactly one count when pagination is enabled", () => {
    render(
      <MasterDataGrid data={data} config={{ ...baseConfig, rowCount: 1204 }} />
    );
    expect(screen.getAllByTestId("row-count-summary")).toHaveLength(1);
  });
});
