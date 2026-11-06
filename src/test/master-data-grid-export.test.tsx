import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type Table,
} from "@tanstack/react-table";
import { render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MasterDataGrid } from "../custom/master-data-grid/components/master-data-grid";
import type { MasterDataGridConfig } from "../custom/master-data-grid/types";
import {
  buildExportTable,
  exportToCSV,
  exportToExcel,
  exportToJSON,
} from "../custom/master-data-grid/utils/export-utils";

const writeXlsxFile = jest.fn();
const toFile = jest.fn().mockResolvedValue(undefined);
// Delegates to the real writer so invalid input (e.g. a Date cell without a
// format) throws. Only toFile (the DOM download) is replaced, after toBlob()
// has built the real workbook in memory.
jest.mock("write-excel-file/browser", () => {
  const actual = jest.requireActual("write-excel-file/browser");
  return {
    __esModule: true,
    default: (...args: unknown[]) => {
      writeXlsxFile(...args);
      const real = actual.default(...args);
      return {
        toFile: async (name: string) => {
          await real.toBlob();
          return toFile(name);
        },
      };
    },
  };
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

interface Row {
  name: string;
  meta: { city?: string };
  amount: number;
}

const data: Row[] = [
  { name: "Ann, Jr", meta: { city: "Oslo" }, amount: 5 },
  { name: 'Bob "B"', meta: {}, amount: 7 },
];

const columns: ColumnDef<Row>[] = [
  { id: "select", header: "Sel", cell: () => null },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "meta.city", header: () => "City" },
  {
    id: "total",
    header: "Total",
    accessorFn: (row) => row.amount * 2,
  },
  { accessorKey: "amount", header: "Amount" },
  { id: "actions", header: "Actions", cell: () => null },
];

const useFixtureTable = (): Table<Row> =>
  renderHook(() =>
    useReactTable({
      data,
      columns,
      state: { columnVisibility: { amount: false } },
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
    })
  ).result.current;

const t = { "column.total": "Sum", "column.meta_city": "Town" } as never;

const captureBlob = () => {
  const parts: string[] = [];
  const RealBlob = global.Blob;
  jest.spyOn(global, "Blob").mockImplementation(((
    p: BlobPart[],
    o?: BlobPropertyBag
  ) => {
    parts.push(String(p[0]));
    return new RealBlob(p, o);
  }) as never);
  URL.createObjectURL = jest.fn(() => "blob:x");
  URL.revokeObjectURL = jest.fn();
  const click = jest
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => undefined);
  return { parts, click };
};

afterEach(() => {
  jest.restoreAllMocks();
  writeXlsxFile.mockClear();
  toFile.mockClear();
});

describe("buildExportTable", () => {
  it("excludes special columns and hidden ones, resolves paths and accessorFn (legacy headers)", () => {
    const table = useFixtureTable();
    expect(buildExportTable(table, { headers: "legacy" })).toEqual({
      headers: ["Name", "meta_city", "Total"],
      rows: [
        ["Ann, Jr", "Oslo", 10],
        ['Bob "B"', undefined, 14],
      ],
    });
  });

  it("uses translated headers in translated mode", () => {
    const table = useFixtureTable();
    expect(buildExportTable(table, { headers: "translated", t }).headers).toEqual(
      ["Name", "Town", "Sum"]
    );
  });
});

describe("exportToCSV", () => {
  it("keeps today's exact output", () => {
    const table = useFixtureTable();
    const { parts } = captureBlob();
    exportToCSV(table, { filename: "f" });
    expect(parts).toEqual([
      '﻿Name,meta_city,Total\n"Ann, Jr",Oslo,10\n"Bob ""B""",,14',
    ]);
  });
});

describe("exportToJSON", () => {
  it("writes objects keyed by translated header", () => {
    const table = useFixtureTable();
    const { parts } = captureBlob();
    exportToJSON(table, { filename: "f", t });
    expect(JSON.parse(parts[0] as string)).toEqual([
      { Name: "Ann, Jr", Town: "Oslo", Sum: 10 },
      { Name: 'Bob "B"', Town: null, Sum: 14 },
    ]);
  });
});

describe("exportToExcel", () => {
  it("calls the writer once with the header row first", async () => {
    const table = useFixtureTable();
    await exportToExcel(table, { filename: "f", t });
    expect(writeXlsxFile).toHaveBeenCalledTimes(1);
    const sheet = writeXlsxFile.mock.calls[0]?.[0] as Array<
      Array<{ value?: unknown } | unknown>
    >;
    const plain = (c: unknown) =>
      c && typeof c === "object" && "value" in c
        ? (c as { value: unknown }).value
        : c;
    expect(sheet[0]?.map(plain)).toEqual(["Name", "Town", "Sum"]);
    expect(sheet[1]?.map(plain)).toEqual(["Ann, Jr", "Oslo", 10]);
    expect(toFile).toHaveBeenCalledWith("f.xlsx");
  });
});

describe("exportToExcel with Date values", () => {
  it("passes dateFormat in the sheet options and builds a real workbook", async () => {
    const dated = [{ when: new Date(Date.UTC(2024, 0, 15, 10, 30)) }];
    const table = renderHook(() =>
      useReactTable({
        data: dated,
        columns: [{ accessorKey: "when", header: "When" }],
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
      })
    ).result.current;
    await exportToExcel(table, { filename: "d" });
    expect(writeXlsxFile.mock.calls[0]?.[1]).toEqual({
      dateFormat: "yyyy-mm-dd hh:mm",
    });
    expect(toFile).toHaveBeenCalledWith("d.xlsx");
  });
});

describe("Toolbar export", () => {
  const baseConfig: MasterDataGridConfig<Row> = {
    localization: { locale: "en-US", timeZone: "UTC", lang: "en" },
    schema: { type: "object", properties: { name: { type: "string" } } },
    columns: [{ id: "name", accessorKey: "name", header: "Name" }],
  };

  it("shows a single Export button that exports CSV when no formats are set", async () => {
    const { parts } = captureBlob();
    render(<MasterDataGrid data={data} config={baseConfig} />);
    const buttons = screen.getAllByRole("button", { name: /export/i });
    expect(buttons[0]?.getAttribute("aria-haspopup")).toBeNull();
    await userEvent.click(buttons[0] as HTMLElement);
    expect(parts[0]).toContain("Ann");
  });

  it("shows an Export dropdown with the configured formats", async () => {
    render(
      <MasterDataGrid
        data={data}
        config={{ ...baseConfig, export: { formats: ["csv", "excel"] } }}
      />
    );
    const trigger = screen.getAllByRole("button", { name: /export/i })[0];
    expect(trigger?.getAttribute("aria-haspopup")).toBe("menu");
    await userEvent.click(trigger as HTMLElement);
    expect(await screen.findByRole("menuitem", { name: "CSV" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Excel" })).toBeTruthy();
    expect(screen.queryByRole("menuitem", { name: "JSON" })).toBeNull();
  });
});
