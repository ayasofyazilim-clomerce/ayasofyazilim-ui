import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { render, screen } from "@testing-library/react";
import { RowCountSummary } from "../custom/master-data-grid/components/row-count-summary";
import type {
  Localization,
  MasterDataGridResources,
} from "../custom/master-data-grid/types";

interface Row {
  name: string;
}

const columns = [
  {
    accessorKey: "name",
    header: "Name",
    filterFn: "includesString" as const,
  },
];

function Harness({
  data,
  rowCount,
  unfilteredRowCount,
  columnFilters = [],
  t,
  localization,
}: {
  data: Row[];
  rowCount?: number;
  unfilteredRowCount?: number;
  columnFilters?: ColumnFiltersState;
  t?: MasterDataGridResources;
  localization?: Localization;
}) {
  const table = useReactTable({
    data,
    columns,
    state: { columnFilters },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // Mirrors the default MasterDataGrid applies.
    manualPagination: rowCount != null,
    rowCount,
  });

  return (
    <RowCountSummary
      table={table}
      t={t}
      localization={localization}
      unfilteredRowCount={unfilteredRowCount}
    />
  );
}

const page = (count: number): Row[] =>
  Array.from({ length: count }, (_, index) => ({ name: `row-${index}` }));

const summary = () => screen.getByTestId("row-count-summary").textContent;

// The interface demands all 65 keys; these tests only care about a couple.
const resources = (overrides: Partial<MasterDataGridResources>) =>
  overrides as MasterDataGridResources;

describe("RowCountSummary", () => {
  it("shows the server total rather than the loaded page size", () => {
    render(<Harness data={page(10)} rowCount={1204} />);
    expect(summary()).toBe("1,204");
  });

  it("shows the row count for a client-paged grid", () => {
    render(<Harness data={page(3)} />);
    expect(summary()).toBe("3");
  });

  it("shows filtered of unfiltered once a client filter narrows the rows", () => {
    render(
      <Harness
        data={[{ name: "alpha" }, { name: "beta" }, { name: "gamma" }]}
        columnFilters={[{ id: "name", value: "al" }]}
      />
    );
    expect(summary()).toBe("1 of 3");
  });

  it("shows filtered of unfiltered when the API reports an unfiltered total", () => {
    render(<Harness data={page(10)} rowCount={24} unfilteredRowCount={1204} />);
    expect(summary()).toBe("24 of 1,204");
  });

  it("collapses to a single count when the unfiltered total matches", () => {
    render(<Harness data={page(10)} rowCount={1204} unfilteredRowCount={1204} />);
    expect(summary()).toBe("1,204");
  });

  it("ignores the loaded page size as an unfiltered total when server-paged", () => {
    // Without the manualPagination guard this would read "1,204 of 10".
    render(<Harness data={page(10)} rowCount={1204} />);
    expect(summary()).not.toContain("of");
  });

  it("prefixes the label once the resources define one", () => {
    render(
      <Harness
        data={page(10)}
        rowCount={1204}
        t={resources({ "pagination.totalItems": "Total" })}
      />
    );
    expect(summary()).toBe("Total: 1,204");
  });

  it("uses the tenant locale for grouping separators and the translated of", () => {
    render(
      <Harness
        data={page(10)}
        rowCount={24}
        unfilteredRowCount={1204}
        localization={{ locale: "tr-TR", timeZone: "Europe/Istanbul", lang: "tr" }}
        t={resources({
          "pagination.totalItems": "Toplam",
          "pagination.of": "/",
        })}
      />
    );
    expect(summary()).toBe("Toplam: 24 / 1.204");
  });

  it("falls back to a valid locale when the tenant has not loaded one", () => {
    // localization.locale is "" until the tenant resolves, and "" throws in Intl.
    render(
      <Harness
        data={page(10)}
        rowCount={1204}
        localization={{ locale: "", timeZone: "", lang: "tr" }}
      />
    );
    expect(summary()).toBe("1.204");
  });
});
