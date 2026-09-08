import { render, screen } from "@testing-library/react";
import { MasterDataGrid } from "../custom/master-data-grid/components/master-data-grid";
import type {
  MasterDataGridConfig,
  ServerFilterConfig,
} from "../custom/master-data-grid/types";

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
  Element.prototype.scrollIntoView = jest.fn();
});

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/en/management/logs/audit",
  useSearchParams: () => new URLSearchParams("userName=john"),
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

const data: Row[] = [{ name: "row-0" }];

const serverFilters: ServerFilterConfig[] = [
  {
    type: "string",
    key: "userName",
    label: "User Name",
    placeholder: "Filter with User Name",
  },
];

const base: MasterDataGridConfig<Row> = {
  localization: { locale: "en-GB", timeZone: "UTC", lang: "en" },
  schema: { type: "object", properties: { name: { type: "string" } } },
  columns: [{ id: "name", accessorKey: "name", header: "Name" }],
  rowCount: 4312,
  t: { "toolbar.filters": "Filters" } as MasterDataGridConfig<Row>["t"],
};

describe("server filter primacy", () => {
  it("renders the chip bar when serverFilters is defined", () => {
    render(
      <MasterDataGrid data={data} config={{ ...base, serverFilters }} />
    );
    expect(screen.getByTestId("server-filter-add")).toBeInTheDocument();
    expect(
      screen.getByTestId("server-filter-chip-userName")
    ).toHaveTextContent("john");
  });

  it("renders no client Filters button on a server-filtered grid", () => {
    render(
      <MasterDataGrid data={data} config={{ ...base, serverFilters }} />
    );
    expect(screen.queryByText("Filters")).toBeNull();
  });

  it("still renders the client Filters button when there are no serverFilters", () => {
    render(
      <MasterDataGrid
        data={data}
        config={{
          ...base,
          t: { "toolbar.filters": "Filters" } as MasterDataGridConfig<Row>["t"],
        }}
      />
    );
    expect(screen.getByText("Filters")).toBeInTheDocument();
    expect(screen.queryByTestId("server-filter-add")).toBeNull();
  });

  it("renders no chip bar when every filter is hidden by when", () => {
    render(
      <MasterDataGrid
        data={data}
        config={{
          ...base,
          serverFilters: [{ ...serverFilters[0]!, when: false }],
        }}
      />
    );
    expect(screen.queryByTestId("server-filter-add")).toBeNull();
  });

  it("keeps the sidebar rather than the bar for a right-located grid", () => {
    render(
      <MasterDataGrid
        data={data}
        config={{ ...base, serverFilters, serverFilterLocation: "right" }}
      />
    );
    expect(screen.queryByTestId("server-filter-add")).toBeNull();
  });
});
