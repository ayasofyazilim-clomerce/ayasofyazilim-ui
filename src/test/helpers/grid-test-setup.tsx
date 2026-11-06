import { render, type RenderResult } from "@testing-library/react";
import type {
  MasterDataGridConfig,
  MasterDataGridResources,
} from "../../custom/master-data-grid/types";

// Hoisting note: the jest.mock calls below are hoisted to the top of THIS
// module, and they register in the module registry shared by the whole test
// file. They only take effect for grid modules that load afterwards, so a test
// file must import this helper BEFORE it imports MasterDataGrid.
import { MasterDataGrid } from "../../custom/master-data-grid/components/master-data-grid";

export const mockNavigate = jest.fn();
export const mockRouterPush = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock("../../custom/master-data-grid/hooks/use-grid-navigation", () => ({
  useGridNavigation: () => ({
    navigate: (url: string, options?: { replace?: boolean }) =>
      mockNavigate(url, options),
    isNavigating: false,
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush, replace: jest.fn() }),
  usePathname: () => "/en/management/logs/audit",
  useSearchParams: () => mockSearchParams,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }: { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

const RESOURCE_KEYS = [
  "cell.boolean.no",
  "cell.boolean.yes",
  "column.actions",
  "column.cancel",
  "column.edit",
  "column.filter",
  "column.hide",
  "column.openMenu",
  "column.pinLeft",
  "column.pinRight",
  "column.resetSize",
  "column.save",
  "column.selectAll",
  "column.selectRow",
  "column.sortAsc",
  "column.sortDesc",
  "column.unpin",
  "filter.addFilter",
  "filter.and",
  "filter.apply",
  "filter.clear",
  "filter.clearFilter",
  "filter.false",
  "filter.max",
  "filter.min",
  "filter.resetFilters",
  "filter.selectColumn",
  "filter.title",
  "filter.to",
  "filter.true",
  "filter.value",
  "filter.where",
  "pagination.firstPage",
  "pagination.lastPage",
  "pagination.nextPage",
  "pagination.of",
  "pagination.page",
  "pagination.previousPage",
  "pagination.rowsPerPage",
  "pagination.rowsSelected",
  "pagination.totalItems",
  "table.noResults",
  "toolbar.actions",
  "toolbar.columns",
  "toolbar.export",
  "toolbar.filters",
  "toolbar.refresh",
  "toolbar.reset",
  "toolbar.search",
  "toolbar.selected",
  "validation.invalidBoolean",
  "validation.invalidEmail",
  "validation.invalidEnum",
  "validation.invalidInteger",
  "validation.invalidNumber",
  "validation.invalidString",
  "validation.invalidUrl",
  "validation.invalidUuid",
  "validation.maxLength",
  "validation.maxValue",
  "validation.minLength",
  "validation.minValue",
  "validation.mustBeInteger",
] as const;

/** Every MasterDataGridResources key, each value equal to its key. */
export const testResources = Object.fromEntries(
  RESOURCE_KEYS.map((key) => [key, key])
) as MasterDataGridResources;

/**
 * Registers the matchMedia stub and per-test resets. Call once at the top of a
 * describe/test file. The module mocks themselves are registered by importing
 * this file (see the hoisting note above).
 */
export function setupGridMocks() {
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
  beforeEach(() => {
    mockNavigate.mockClear();
    mockRouterPush.mockClear();
    mockSearchParams = new URLSearchParams();
  });
  return {
    navigateMock: mockNavigate,
    routerPushMock: mockRouterPush,
    setSearchParams(qs: string) {
      mockSearchParams = new URLSearchParams(qs);
    },
  };
}

export function renderGrid<T>(
  data: T[],
  config: Partial<MasterDataGridConfig<T>> = {}
): RenderResult {
  const full = {
    localization: { locale: "en-US", timeZone: "UTC", lang: "en" },
    schema: { type: "object", properties: { name: { type: "string" } } },
    t: testResources,
    ...config,
  } as MasterDataGridConfig<T>;
  return render(<MasterDataGrid data={data} config={full} />);
}
