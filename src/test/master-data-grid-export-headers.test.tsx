import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MasterDataGrid } from "../custom/master-data-grid/components/master-data-grid";
import type {
  JSONSchema,
  MasterDataGridConfig,
  MasterDataGridResources,
} from "../custom/master-data-grid/types";
import { generateColumnsFromSchema } from "../custom/master-data-grid/utils/column-generator";
import {
  buildExportTable,
  exportToCSV,
  exportToExcel,
} from "../custom/master-data-grid/utils/export-utils";

const writeXlsxFile = jest.fn();
jest.mock("write-excel-file/browser", () => ({
  __esModule: true,
  default: (...args: unknown[]) => {
    writeXlsxFile(...args);
    return { toFile: async () => undefined };
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
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
  createdBy: string;
  note: string;
}

const data: Row[] = [{ createdBy: "Ann", note: "hi" }];
const localization = { locale: "en-US", timeZone: "UTC", lang: "en" };
const schema: JSONSchema = {
  type: "object",
  properties: {
    createdBy: { type: "string", title: "Created by" },
    note: { type: "string", title: "Remark" },
  },
};
// A key for one column only: the other has nothing but its schema title.
const t = { "column.note": "Note" } as MasterDataGridResources;

const schemaTable = () =>
  renderHook(function useSchemaTable() {
    return useReactTable({
      data,
      columns: generateColumnsFromSchema<Row>(schema, localization, t),
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
    });
  }).result.current;

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
  jest
    .spyOn(HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => undefined);
  return parts;
};

afterEach(() => {
  jest.restoreAllMocks();
  writeXlsxFile.mockClear();
});

describe("translated export headers fall back like the screen header", () => {
  it("uses the schema title when t has no key for the column, and the t key when it has one", () => {
    expect(
      buildExportTable(schemaTable(), { headers: "translated", t }).headers
    ).toEqual(["Created by", "Note"]);
  });

  it("writes the same headers to Excel", async () => {
    await exportToExcel(schemaTable(), { filename: "f", t });
    const sheet = writeXlsxFile.mock.calls[0]?.[0] as Array<
      Array<{ value?: unknown }>
    >;
    expect(sheet[0]?.map((cell) => cell.value)).toEqual(["Created by", "Note"]);
  });

  it("keeps CSV's legacy headers (the column id)", () => {
    const parts = captureBlob();
    exportToCSV(schemaTable(), { filename: "f", t });
    expect(parts[0]?.split("\n")[0]).toBe(
      `${String.fromCharCode(0xfeff)}createdBy,note`
    );
  });

  it("names each JSON key as the grid's header shows it", async () => {
    const parts = captureBlob();
    const config: MasterDataGridConfig<Row> = {
      schema,
      localization,
      t,
      export: { formats: ["json"] },
    };
    render(<MasterDataGrid<Row> data={data} config={config} />);
    const shown = screen
      .getAllByRole("columnheader")
      .map((cell) => cell.textContent?.trim())
      .filter(Boolean);
    expect(shown).toEqual(["Created by", "Note"]);

    await userEvent.click(
      screen.getAllByRole("button", { name: /export/i })[0] as HTMLElement
    );
    await userEvent.click(await screen.findByRole("menuitem", { name: "JSON" }));
    expect(Object.keys(JSON.parse(parts[0] as string)[0])).toEqual(shown);
  });
});
