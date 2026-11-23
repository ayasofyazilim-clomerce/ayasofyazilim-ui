// Import the helper FIRST: its jest.mock calls must register before the grid loads.
import { renderGrid, setupGridMocks } from "./helpers/grid-test-setup";

/**
 * Pins the grid's exact markup for consumers that pass none of the opt-in
 * options (tree rows, ...). The snapshots were captured on
 * `fix/consumer-readiness` before tree rows existed, so a diff here means a
 * default grid changed, and the change has to go, not the snapshot.
 *
 * Two normalisations keep the strings exact but stable:
 * - React's `useId` values (`_r_3_`) count up across every render in the file,
 *   so they depend on test order; they become `_r_ID_`.
 * - A newline goes between adjacent tags, so a diff points at one element.
 */

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

setupGridMocks();

const markup = (container: HTMLElement) =>
  container.innerHTML
    .replace(/_r_[0-9a-z]+_/g, "_r_ID_")
    .replace(/></g, ">\n<");

interface Row {
  name: string;
}
const data: Row[] = ["Charlie", "Alice", "Bob"].map((name) => ({ name }));
const columns = [{ id: "name", accessorKey: "name" }];

interface Party {
  id: string;
  name: string;
  parentId: string | null;
}
const partySchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    parentId: { type: "string" },
  },
};
const parties: Party[] = [
  { id: "h1", name: "HQ One", parentId: null },
  { id: "c1", name: "Child One", parentId: "h1" },
  { id: "c2", name: "Child Two", parentId: "h1" },
  { id: "c3", name: "Orphan Three", parentId: "x9" },
];
// unirefund's parties screen grouping config, as in the grouping characterization.
const grouping = {
  enabled: true,
  groupBy: ["parentId"],
  expanded: true as const,
  hideNullGroups: true,
  groupLabelField: "name",
  hideGroupParentRows: true,
  groupFallbackRenderer: ({
    groupValue,
    subRowCount,
  }: {
    groupValue: string;
    subRowCount: number;
  }) => <span>{`fallback-${groupValue}-${subRowCount}`}</span>,
};

describe("MasterDataGrid markup without opt-in options (unchanged)", () => {
  it("plain", () => {
    const { container } = renderGrid(data, { columns });
    expect(markup(container)).toMatchInlineSnapshot(`
     "<div class="flex flex-col gap-2">
     <div class="flex items-center gap-2 w-full">
     <input data-slot="input" class="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive md:max-w-sm h-8" placeholder="toolbar.search" value="">
     <div role="group" data-slot="button-group" class="w-fit items-stretch [&amp;>*]:focus-visible:z-10 [&amp;>*]:focus-visible:relative [&amp;>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&amp;>input]:flex-1 has-[select[aria-hidden=true]:last-child]:[&amp;>[data-slot=select-trigger]:last-of-type]:rounded-r-md has-[>[data-slot=button-group]]:gap-2 [&amp;>*:not(:first-child)]:rounded-l-none [&amp;>*:not(:first-child)]:border-l-0 [&amp;>*:not(:last-child)]:rounded-r-none hidden ml-auto md:flex">
     <button data-slot="popover-trigger" data-variant="outline" data-size="sm" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5" type="button" aria-haspopup="dialog" aria-expanded="false" data-state="closed">
     <svg class="h-4 w-4" data-lucide="Filter" data-testid="lucide-filter">
     <path d="M0 0">
     </path>
     </svg>
     <span>toolbar.filters</span>
     </button>
     <button data-slot="dropdown-menu-trigger" data-variant="outline" data-size="sm" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5" type="button" id="radix-_r_ID_" aria-haspopup="menu" aria-expanded="false" data-state="closed">
     <svg data-lucide="Columns3" data-testid="lucide-columns3">
     <path d="M0 0">
     </path>
     </svg>
     <span class="hidden lg:inline">toolbar.columns</span>
     <span class="lg:hidden">toolbar.columns</span>
     <svg data-lucide="ChevronDown" data-testid="lucide-chevron-down">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <button data-slot="button" data-variant="outline" data-size="sm" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5">
     <svg class="h-4 w-4" data-lucide="Download" data-testid="lucide-download">
     <path d="M0 0">
     </path>
     </svg>
     <span>toolbar.export</span>
     </button>
     </div>
     <div role="group" data-slot="button-group" class="w-fit items-stretch [&amp;>*]:focus-visible:z-10 [&amp;>*]:focus-visible:relative [&amp;>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&amp;>input]:flex-1 has-[select[aria-hidden=true]:last-child]:[&amp;>[data-slot=select-trigger]:last-of-type]:rounded-r-md has-[>[data-slot=button-group]]:gap-2 [&amp;>*:not(:first-child)]:rounded-l-none [&amp;>*:not(:first-child)]:border-l-0 [&amp;>*:not(:last-child)]:rounded-r-none hidden md:has-first:flex">
     </div>
     <button data-slot="drawer-trigger" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8 md:hidden" type="button" aria-haspopup="dialog" aria-expanded="false" data-state="closed">
     <svg class="h-4 w-4" data-lucide="Menu" data-testid="lucide-menu">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     </div>
     <div class="relative w-full border rounded-md overflow-hidden flex" style="height: auto;">
     <div data-slot="table-container" class="relative overflow-auto size-full">
     <table data-slot="table" class="w-full caption-bottom text-sm border-spacing-0">
     <thead data-slot="table-header" class="[&amp;_tr]:border-b sticky top-0 z-10 bg-background">
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
     <th data-slot="table-head" class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 has-[button]:px-0 not-last:border-r" colspan="1" style="position: relative; z-index: 0;">
     <div class="flex items-center size-full relative">
     <button data-slot="dropdown-menu-trigger" data-variant="ghost" data-size="default" class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 px-4 py-2 has-[>svg]:px-3 data-[state=open]:bg-accent w-full rounded-none h-full" type="button" id="radix-_r_ID_" aria-haspopup="menu" aria-expanded="false" data-state="closed">
     <span class="font-semibold mr-auto truncate">name</span>
     <svg class="ml-2 h-4 w-4" data-lucide="ChevronDown" data-testid="lucide-chevron-down">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <div class="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-primary transition-opacity opacity-0 hover:opacity-50">
     </div>
     </div>
     </th>
     </tr>
     </thead>
     <tbody data-slot="table-body" class="[&amp;_tr:last-child]:border-0">
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors group" data-state="false">
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0 has-[.expander]:px-0 has-[button]:px-0" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <span>Charlie</span>
     </td>
     </tr>
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors group" data-state="false">
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0 has-[.expander]:px-0 has-[button]:px-0" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <span>Alice</span>
     </td>
     </tr>
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors group" data-state="false">
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0 has-[.expander]:px-0 has-[button]:px-0" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <span>Bob</span>
     </td>
     </tr>
     </tbody>
     </table>
     </div>
     </div>
     <div class="flex items-center flex-wrap gap-4">
     <div class="flex items-center flex-wrap gap-2 w-full sm:w-auto ml-auto">
     <div class="flex items-center w-full justify-between gap-2 sm:w-auto md:mr-4">
     <p class="text-sm font-medium">pagination.rowsPerPage</p>
     <button type="button" role="combobox" aria-expanded="false" aria-autocomplete="none" dir="ltr" data-state="closed" data-slot="select-trigger" data-size="sm" class="border-input data-placeholder:text-muted-foreground [&amp;_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&amp;_svg]:pointer-events-none [&amp;_svg]:shrink-0 [&amp;_svg:not([class*='size-'])]:size-4 w-18">
     <span data-slot="select-value" style="pointer-events: none;">10</span>
     <svg class="size-4 opacity-50" aria-hidden="true" data-lucide="ChevronDownIcon" data-testid="lucide-chevron-down-icon">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     </div>
     <div class="flex items-center justify-center text-sm font-medium mr-auto gap-2">pagination.page 1 pagination.of 1<span data-slot="badge" class="inline-flex items-center justify-center border font-medium w-fit whitespace-nowrap shrink-0 [&amp;>svg]:size-3 gap-1 [&amp;>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden text-foreground [a&amp;]:hover:bg-accent [a&amp;]:hover:text-accent-foreground px-2 py-0.5 text-xs rounded-md text-nowrap" data-testid="row-count-summary">pagination.totalItems: 3</span>
     </div>
     <div role="group" data-slot="button-group" class="flex w-fit items-stretch [&amp;>*]:focus-visible:z-10 [&amp;>*]:focus-visible:relative [&amp;>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&amp;>input]:flex-1 has-[select[aria-hidden=true]:last-child]:[&amp;>[data-slot=select-trigger]:last-of-type]:rounded-r-md has-[>[data-slot=button-group]]:gap-2 [&amp;>*:not(:first-child)]:rounded-l-none [&amp;>*:not(:first-child)]:border-l-0 [&amp;>*:not(:last-child)]:rounded-r-none">
     <button data-slot="button" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8" disabled="" title="pagination.firstPage">
     <span class="sr-only">pagination.firstPage</span>
     <svg class="h-4 w-4" data-lucide="ChevronsLeftIcon" data-testid="lucide-chevrons-left-icon">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <button data-slot="button" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8" disabled="" title="pagination.previousPage">
     <span class="sr-only">pagination.previousPage</span>
     <svg class="h-4 w-4" data-lucide="ChevronLeftIcon" data-testid="lucide-chevron-left-icon">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <button data-slot="button" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8" disabled="" title="pagination.nextPage">
     <span class="sr-only">pagination.nextPage</span>
     <svg class="h-4 w-4" data-lucide="ChevronRightIcon" data-testid="lucide-chevron-right-icon">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <button data-slot="button" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8" disabled="" title="pagination.lastPage">
     <span class="sr-only">pagination.lastPage</span>
     <svg class="h-4 w-4" data-lucide="ChevronsRightIcon" data-testid="lucide-chevrons-right-icon">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     </div>
     </div>
     </div>
     </div>"
    `);
  });

  it("selection", () => {
    const { container } = renderGrid(data, {
      columns,
      selection: { enabled: true },
    });
    expect(markup(container)).toMatchInlineSnapshot(`
     "<div class="flex flex-col gap-2">
     <div class="flex items-center gap-2 w-full">
     <input data-slot="input" class="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive md:max-w-sm h-8" placeholder="toolbar.search" value="">
     <div role="group" data-slot="button-group" class="w-fit items-stretch [&amp;>*]:focus-visible:z-10 [&amp;>*]:focus-visible:relative [&amp;>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&amp;>input]:flex-1 has-[select[aria-hidden=true]:last-child]:[&amp;>[data-slot=select-trigger]:last-of-type]:rounded-r-md has-[>[data-slot=button-group]]:gap-2 [&amp;>*:not(:first-child)]:rounded-l-none [&amp;>*:not(:first-child)]:border-l-0 [&amp;>*:not(:last-child)]:rounded-r-none hidden ml-auto md:flex">
     <button data-slot="popover-trigger" data-variant="outline" data-size="sm" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5" type="button" aria-haspopup="dialog" aria-expanded="false" data-state="closed">
     <svg class="h-4 w-4" data-lucide="Filter" data-testid="lucide-filter">
     <path d="M0 0">
     </path>
     </svg>
     <span>toolbar.filters</span>
     </button>
     <button data-slot="dropdown-menu-trigger" data-variant="outline" data-size="sm" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5" type="button" id="radix-_r_ID_" aria-haspopup="menu" aria-expanded="false" data-state="closed">
     <svg data-lucide="Columns3" data-testid="lucide-columns3">
     <path d="M0 0">
     </path>
     </svg>
     <span class="hidden lg:inline">toolbar.columns</span>
     <span class="lg:hidden">toolbar.columns</span>
     <svg data-lucide="ChevronDown" data-testid="lucide-chevron-down">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <button data-slot="button" data-variant="outline" data-size="sm" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5">
     <svg class="h-4 w-4" data-lucide="Download" data-testid="lucide-download">
     <path d="M0 0">
     </path>
     </svg>
     <span>toolbar.export</span>
     </button>
     </div>
     <div role="group" data-slot="button-group" class="w-fit items-stretch [&amp;>*]:focus-visible:z-10 [&amp;>*]:focus-visible:relative [&amp;>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&amp;>input]:flex-1 has-[select[aria-hidden=true]:last-child]:[&amp;>[data-slot=select-trigger]:last-of-type]:rounded-r-md has-[>[data-slot=button-group]]:gap-2 [&amp;>*:not(:first-child)]:rounded-l-none [&amp;>*:not(:first-child)]:border-l-0 [&amp;>*:not(:last-child)]:rounded-r-none hidden md:has-first:flex">
     </div>
     <button data-slot="drawer-trigger" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8 md:hidden" type="button" aria-haspopup="dialog" aria-expanded="false" data-state="closed">
     <svg class="h-4 w-4" data-lucide="Menu" data-testid="lucide-menu">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     </div>
     <div class="relative w-full border rounded-md overflow-hidden flex" style="height: auto;">
     <div data-slot="table-container" class="relative overflow-auto size-full">
     <table data-slot="table" class="w-full caption-bottom text-sm border-spacing-0">
     <thead data-slot="table-header" class="[&amp;_tr]:border-b sticky top-0 z-10 bg-background">
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
     <th data-slot="table-head" class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 has-[button]:px-0 not-last:border-r min-w-10 max-w-10" colspan="1" style="position: relative; z-index: 0; max-width: 40px;">
     <div class="flex items-center justify-center">
     <button type="button" role="checkbox" aria-checked="false" data-state="unchecked" value="on" data-slot="checkbox" class="peer group border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground dark:data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50" aria-label="column.selectAll">
     </button>
     </div>
     </th>
     <th data-slot="table-head" class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 has-[button]:px-0 not-last:border-r" colspan="1" style="position: relative; z-index: 0;">
     <div class="flex items-center size-full relative">
     <button data-slot="dropdown-menu-trigger" data-variant="ghost" data-size="default" class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 px-4 py-2 has-[>svg]:px-3 data-[state=open]:bg-accent w-full rounded-none h-full" type="button" id="radix-_r_ID_" aria-haspopup="menu" aria-expanded="false" data-state="closed">
     <span class="font-semibold mr-auto truncate">name</span>
     <svg class="ml-2 h-4 w-4" data-lucide="ChevronDown" data-testid="lucide-chevron-down">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <div class="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-primary transition-opacity opacity-0 hover:opacity-50">
     </div>
     </div>
     </th>
     </tr>
     </thead>
     <tbody data-slot="table-body" class="[&amp;_tr:last-child]:border-0">
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors group" data-state="false">
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0 has-[.expander]:px-0 has-[button]:px-0" style="width: 40px; min-width: 40px; max-width: 40px; position: relative; z-index: 0;">
     <div class="flex items-center justify-center">
     <button type="button" role="checkbox" aria-checked="false" data-state="unchecked" value="on" data-slot="checkbox" class="peer group border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground dark:data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50" aria-label="column.selectRow">
     </button>
     </div>
     </td>
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0 has-[.expander]:px-0 has-[button]:px-0" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <span>Charlie</span>
     </td>
     </tr>
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors group" data-state="false">
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0 has-[.expander]:px-0 has-[button]:px-0" style="width: 40px; min-width: 40px; max-width: 40px; position: relative; z-index: 0;">
     <div class="flex items-center justify-center">
     <button type="button" role="checkbox" aria-checked="false" data-state="unchecked" value="on" data-slot="checkbox" class="peer group border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground dark:data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50" aria-label="column.selectRow">
     </button>
     </div>
     </td>
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0 has-[.expander]:px-0 has-[button]:px-0" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <span>Alice</span>
     </td>
     </tr>
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors group" data-state="false">
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0 has-[.expander]:px-0 has-[button]:px-0" style="width: 40px; min-width: 40px; max-width: 40px; position: relative; z-index: 0;">
     <div class="flex items-center justify-center">
     <button type="button" role="checkbox" aria-checked="false" data-state="unchecked" value="on" data-slot="checkbox" class="peer group border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground dark:data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50" aria-label="column.selectRow">
     </button>
     </div>
     </td>
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0 has-[.expander]:px-0 has-[button]:px-0" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <span>Bob</span>
     </td>
     </tr>
     </tbody>
     </table>
     </div>
     </div>
     <div class="flex items-center flex-wrap gap-4">
     <div class="flex items-center flex-wrap gap-2 w-full sm:w-auto ml-auto">
     <div class="flex items-center w-full justify-between gap-2 sm:w-auto md:mr-4">
     <p class="text-sm font-medium">pagination.rowsPerPage</p>
     <button type="button" role="combobox" aria-expanded="false" aria-autocomplete="none" dir="ltr" data-state="closed" data-slot="select-trigger" data-size="sm" class="border-input data-placeholder:text-muted-foreground [&amp;_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&amp;_svg]:pointer-events-none [&amp;_svg]:shrink-0 [&amp;_svg:not([class*='size-'])]:size-4 w-18">
     <span data-slot="select-value" style="pointer-events: none;">10</span>
     <svg class="size-4 opacity-50" aria-hidden="true" data-lucide="ChevronDownIcon" data-testid="lucide-chevron-down-icon">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     </div>
     <div class="flex items-center justify-center text-sm font-medium mr-auto gap-2">pagination.page 1 pagination.of 1<span data-slot="badge" class="inline-flex items-center justify-center border font-medium w-fit whitespace-nowrap shrink-0 [&amp;>svg]:size-3 gap-1 [&amp;>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden text-foreground [a&amp;]:hover:bg-accent [a&amp;]:hover:text-accent-foreground px-2 py-0.5 text-xs rounded-md text-nowrap" data-testid="row-count-summary">pagination.totalItems: 3</span>
     </div>
     <div role="group" data-slot="button-group" class="flex w-fit items-stretch [&amp;>*]:focus-visible:z-10 [&amp;>*]:focus-visible:relative [&amp;>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&amp;>input]:flex-1 has-[select[aria-hidden=true]:last-child]:[&amp;>[data-slot=select-trigger]:last-of-type]:rounded-r-md has-[>[data-slot=button-group]]:gap-2 [&amp;>*:not(:first-child)]:rounded-l-none [&amp;>*:not(:first-child)]:border-l-0 [&amp;>*:not(:last-child)]:rounded-r-none">
     <button data-slot="button" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8" disabled="" title="pagination.firstPage">
     <span class="sr-only">pagination.firstPage</span>
     <svg class="h-4 w-4" data-lucide="ChevronsLeftIcon" data-testid="lucide-chevrons-left-icon">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <button data-slot="button" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8" disabled="" title="pagination.previousPage">
     <span class="sr-only">pagination.previousPage</span>
     <svg class="h-4 w-4" data-lucide="ChevronLeftIcon" data-testid="lucide-chevron-left-icon">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <button data-slot="button" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8" disabled="" title="pagination.nextPage">
     <span class="sr-only">pagination.nextPage</span>
     <svg class="h-4 w-4" data-lucide="ChevronRightIcon" data-testid="lucide-chevron-right-icon">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <button data-slot="button" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8" disabled="" title="pagination.lastPage">
     <span class="sr-only">pagination.lastPage</span>
     <svg class="h-4 w-4" data-lucide="ChevronsRightIcon" data-testid="lucide-chevrons-right-icon">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     </div>
     </div>
     </div>
     </div>"
    `);
  });

  it("grouping", () => {
    const { container } = renderGrid<Party>(parties, {
      schema: partySchema,
      grouping,
      enablePagination: false,
    } as never);
    expect(markup(container)).toMatchInlineSnapshot(`
     "<div class="flex flex-col gap-2">
     <div class="flex items-center gap-2 w-full">
     <input data-slot="input" class="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive md:max-w-sm h-8" placeholder="toolbar.search" value="">
     <span data-slot="badge" class="inline-flex items-center justify-center border font-medium w-fit whitespace-nowrap shrink-0 [&amp;>svg]:size-3 gap-1 [&amp;>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden text-foreground [a&amp;]:hover:bg-accent [a&amp;]:hover:text-accent-foreground px-2 py-0.5 text-xs rounded-md text-nowrap" data-testid="row-count-summary">pagination.totalItems: 7 pagination.of 4</span>
     <div role="group" data-slot="button-group" class="w-fit items-stretch [&amp;>*]:focus-visible:z-10 [&amp;>*]:focus-visible:relative [&amp;>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&amp;>input]:flex-1 has-[select[aria-hidden=true]:last-child]:[&amp;>[data-slot=select-trigger]:last-of-type]:rounded-r-md has-[>[data-slot=button-group]]:gap-2 [&amp;>*:not(:first-child)]:rounded-l-none [&amp;>*:not(:first-child)]:border-l-0 [&amp;>*:not(:last-child)]:rounded-r-none hidden ml-auto md:flex">
     <button data-slot="popover-trigger" data-variant="outline" data-size="sm" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5" type="button" aria-haspopup="dialog" aria-expanded="false" data-state="closed">
     <svg class="h-4 w-4" data-lucide="Filter" data-testid="lucide-filter">
     <path d="M0 0">
     </path>
     </svg>
     <span>toolbar.filters</span>
     </button>
     <button data-slot="dropdown-menu-trigger" data-variant="outline" data-size="sm" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5" type="button" id="radix-_r_ID_" aria-haspopup="menu" aria-expanded="false" data-state="closed">
     <svg data-lucide="Columns3" data-testid="lucide-columns3">
     <path d="M0 0">
     </path>
     </svg>
     <span class="hidden lg:inline">toolbar.columns</span>
     <span class="lg:hidden">toolbar.columns</span>
     <svg data-lucide="ChevronDown" data-testid="lucide-chevron-down">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <button data-slot="button" data-variant="outline" data-size="sm" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5">
     <svg class="h-4 w-4" data-lucide="Download" data-testid="lucide-download">
     <path d="M0 0">
     </path>
     </svg>
     <span>toolbar.export</span>
     </button>
     </div>
     <div role="group" data-slot="button-group" class="w-fit items-stretch [&amp;>*]:focus-visible:z-10 [&amp;>*]:focus-visible:relative [&amp;>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&amp;>input]:flex-1 has-[select[aria-hidden=true]:last-child]:[&amp;>[data-slot=select-trigger]:last-of-type]:rounded-r-md has-[>[data-slot=button-group]]:gap-2 [&amp;>*:not(:first-child)]:rounded-l-none [&amp;>*:not(:first-child)]:border-l-0 [&amp;>*:not(:last-child)]:rounded-r-none hidden md:has-first:flex">
     </div>
     <button data-slot="drawer-trigger" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8 md:hidden" type="button" aria-haspopup="dialog" aria-expanded="false" data-state="closed">
     <svg class="h-4 w-4" data-lucide="Menu" data-testid="lucide-menu">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     </div>
     <div class="relative w-full border rounded-md overflow-hidden flex" style="height: auto;">
     <div data-slot="table-container" class="relative overflow-auto size-full">
     <table data-slot="table" class="w-full caption-bottom text-sm border-spacing-0">
     <thead data-slot="table-header" class="[&amp;_tr]:border-b sticky top-0 z-10 bg-background">
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
     <th data-slot="table-head" class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 has-[button]:px-0 not-last:border-r" colspan="1" style="position: relative; z-index: 0;">
     <div class="flex items-center size-full relative">
     <button data-slot="dropdown-menu-trigger" data-variant="ghost" data-size="default" class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 px-4 py-2 has-[>svg]:px-3 data-[state=open]:bg-accent w-full rounded-none h-full" type="button" id="radix-_r_ID_" aria-haspopup="menu" aria-expanded="false" data-state="closed">
     <span class="font-semibold mr-auto truncate">id</span>
     <svg class="ml-2 h-4 w-4" data-lucide="ChevronDown" data-testid="lucide-chevron-down">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <div class="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-primary transition-opacity opacity-0 hover:opacity-50">
     </div>
     </div>
     </th>
     <th data-slot="table-head" class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 has-[button]:px-0 not-last:border-r" colspan="1" style="position: relative; z-index: 0;">
     <div class="flex items-center size-full relative">
     <button data-slot="dropdown-menu-trigger" data-variant="ghost" data-size="default" class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 px-4 py-2 has-[>svg]:px-3 data-[state=open]:bg-accent w-full rounded-none h-full" type="button" id="radix-_r_ID_" aria-haspopup="menu" aria-expanded="false" data-state="closed">
     <span class="font-semibold mr-auto truncate">name</span>
     <svg class="ml-2 h-4 w-4" data-lucide="ChevronDown" data-testid="lucide-chevron-down">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <div class="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-primary transition-opacity opacity-0 hover:opacity-50">
     </div>
     </div>
     </th>
     </tr>
     </thead>
     <tbody data-slot="table-body" class="[&amp;_tr:last-child]:border-0">
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors group">
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <div class="flex items-center gap-1">
     <button data-slot="button" data-variant="ghost" data-size="icon-xs" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 size-6" aria-label="Collapse">
     <svg class="h-4 w-4 text-muted-foreground" data-lucide="ChevronDown" data-testid="lucide-chevron-down">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <span>h1</span>
     </div>
     </td>
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <span>HQ One</span>
     </td>
     </tr>
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors group" data-state="false">
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0 has-[.expander]:px-0 has-[button]:px-0 pl-9" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <span>c1</span>
     </td>
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0 has-[.expander]:px-0 has-[button]:px-0" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <span>Child One</span>
     </td>
     </tr>
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors group" data-state="false">
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0 has-[.expander]:px-0 has-[button]:px-0 pl-9" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <span>c2</span>
     </td>
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0 has-[.expander]:px-0 has-[button]:px-0" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <span>Child Two</span>
     </td>
     </tr>
     <tr data-slot="table-row" class="data-[state=selected]:bg-muted border-b transition-colors bg-muted/30 hover:bg-muted/50 cursor-pointer font-medium">
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 py-0 h-9" colspan="2" style="padding-left: 0.75rem;">
     <span>fallback-x9-1</span>
     </td>
     </tr>
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors group" data-state="false">
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0 has-[.expander]:px-0 has-[button]:px-0 pl-9" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <span>c3</span>
     </td>
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0 has-[.expander]:px-0 has-[button]:px-0" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <span>Orphan Three</span>
     </td>
     </tr>
     </tbody>
     </table>
     </div>
     </div>
     </div>"
    `);
  });

  it("virtual (with selection)", () => {
    const { container } = renderGrid(data, {
      columns,
      enableVirtualization: true,
      selection: { enabled: true },
    });
    expect(markup(container)).toMatchInlineSnapshot(`
     "<div class="flex flex-col gap-2">
     <div class="flex items-center gap-2 w-full">
     <input data-slot="input" class="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive md:max-w-sm h-8" placeholder="toolbar.search" value="">
     <div role="group" data-slot="button-group" class="w-fit items-stretch [&amp;>*]:focus-visible:z-10 [&amp;>*]:focus-visible:relative [&amp;>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&amp;>input]:flex-1 has-[select[aria-hidden=true]:last-child]:[&amp;>[data-slot=select-trigger]:last-of-type]:rounded-r-md has-[>[data-slot=button-group]]:gap-2 [&amp;>*:not(:first-child)]:rounded-l-none [&amp;>*:not(:first-child)]:border-l-0 [&amp;>*:not(:last-child)]:rounded-r-none hidden ml-auto md:flex">
     <button data-slot="popover-trigger" data-variant="outline" data-size="sm" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5" type="button" aria-haspopup="dialog" aria-expanded="false" data-state="closed">
     <svg class="h-4 w-4" data-lucide="Filter" data-testid="lucide-filter">
     <path d="M0 0">
     </path>
     </svg>
     <span>toolbar.filters</span>
     </button>
     <button data-slot="dropdown-menu-trigger" data-variant="outline" data-size="sm" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5" type="button" id="radix-_r_ID_" aria-haspopup="menu" aria-expanded="false" data-state="closed">
     <svg data-lucide="Columns3" data-testid="lucide-columns3">
     <path d="M0 0">
     </path>
     </svg>
     <span class="hidden lg:inline">toolbar.columns</span>
     <span class="lg:hidden">toolbar.columns</span>
     <svg data-lucide="ChevronDown" data-testid="lucide-chevron-down">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <button data-slot="button" data-variant="outline" data-size="sm" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5">
     <svg class="h-4 w-4" data-lucide="Download" data-testid="lucide-download">
     <path d="M0 0">
     </path>
     </svg>
     <span>toolbar.export</span>
     </button>
     </div>
     <div role="group" data-slot="button-group" class="w-fit items-stretch [&amp;>*]:focus-visible:z-10 [&amp;>*]:focus-visible:relative [&amp;>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&amp;>input]:flex-1 has-[select[aria-hidden=true]:last-child]:[&amp;>[data-slot=select-trigger]:last-of-type]:rounded-r-md has-[>[data-slot=button-group]]:gap-2 [&amp;>*:not(:first-child)]:rounded-l-none [&amp;>*:not(:first-child)]:border-l-0 [&amp;>*:not(:last-child)]:rounded-r-none hidden md:has-first:flex">
     </div>
     <button data-slot="drawer-trigger" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8 md:hidden" type="button" aria-haspopup="dialog" aria-expanded="false" data-state="closed">
     <svg class="h-4 w-4" data-lucide="Menu" data-testid="lucide-menu">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     </div>
     <div class="relative w-full border rounded-md overflow-hidden flex" style="height: 600px;">
     <div data-slot="table-container" class="relative w-full overflow-x-auto">
     <table data-slot="table" class="w-full caption-bottom text-sm border-separate border-spacing-0">
     <thead data-slot="table-header" class="[&amp;_tr]:border-b sticky top-0 z-10 bg-background">
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
     <th data-slot="table-head" class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 has-[button]:px-0 not-last:border-r min-w-10" colspan="1" style="position: relative; z-index: 0; max-width: 40px;">
     <div class="flex items-center justify-center">
     <button type="button" role="checkbox" aria-checked="false" data-state="unchecked" value="on" data-slot="checkbox" class="peer group border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground dark:data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50" aria-label="column.selectAll">
     </button>
     </div>
     </th>
     <th data-slot="table-head" class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 has-[button]:px-0 not-last:border-r" colspan="1" style="position: relative; z-index: 0;">
     <div class="flex items-center size-full relative">
     <button data-slot="dropdown-menu-trigger" data-variant="ghost" data-size="default" class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 px-4 py-2 has-[>svg]:px-3 data-[state=open]:bg-accent w-full rounded-none h-full" type="button" id="radix-_r_ID_" aria-haspopup="menu" aria-expanded="false" data-state="closed">
     <span class="font-semibold mr-auto truncate">name</span>
     <svg class="ml-2 h-4 w-4" data-lucide="ChevronDown" data-testid="lucide-chevron-down">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <div class="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-primary transition-opacity opacity-0 hover:opacity-50">
     </div>
     </div>
     </th>
     </tr>
     </thead>
     <tbody data-slot="table-body" class="[&amp;_tr:last-child]:border-0">
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors group" data-state="false">
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 border-b border-r" style="width: 40px; min-width: 40px; max-width: 40px; position: relative; z-index: 0;">
     <button type="button" role="checkbox" aria-checked="false" data-state="unchecked" value="on" data-slot="checkbox" class="peer group border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground dark:data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50" aria-label="column.selectRow">
     </button>
     </td>
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 border-b border-r" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <span>Charlie</span>
     </td>
     </tr>
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors group" data-state="false">
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 border-b border-r" style="width: 40px; min-width: 40px; max-width: 40px; position: relative; z-index: 0;">
     <button type="button" role="checkbox" aria-checked="false" data-state="unchecked" value="on" data-slot="checkbox" class="peer group border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground dark:data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50" aria-label="column.selectRow">
     </button>
     </td>
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 border-b border-r" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <span>Alice</span>
     </td>
     </tr>
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors group" data-state="false">
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 border-b border-r" style="width: 40px; min-width: 40px; max-width: 40px; position: relative; z-index: 0;">
     <button type="button" role="checkbox" aria-checked="false" data-state="unchecked" value="on" data-slot="checkbox" class="peer group border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground dark:data-[state=indeterminate]:bg-primary data-[state=indeterminate]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50" aria-label="column.selectRow">
     </button>
     </td>
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 border-b border-r" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <span>Bob</span>
     </td>
     </tr>
     </tbody>
     </table>
     </div>
     </div>
     <div class="flex items-center flex-wrap gap-4">
     <div class="flex items-center flex-wrap gap-2 w-full sm:w-auto ml-auto">
     <div class="flex items-center w-full justify-between gap-2 sm:w-auto md:mr-4">
     <p class="text-sm font-medium">pagination.rowsPerPage</p>
     <button type="button" role="combobox" aria-expanded="false" aria-autocomplete="none" dir="ltr" data-state="closed" data-slot="select-trigger" data-size="sm" class="border-input data-placeholder:text-muted-foreground [&amp;_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&amp;_svg]:pointer-events-none [&amp;_svg]:shrink-0 [&amp;_svg:not([class*='size-'])]:size-4 w-18">
     <span data-slot="select-value" style="pointer-events: none;">10</span>
     <svg class="size-4 opacity-50" aria-hidden="true" data-lucide="ChevronDownIcon" data-testid="lucide-chevron-down-icon">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     </div>
     <div class="flex items-center justify-center text-sm font-medium mr-auto gap-2">pagination.page 1 pagination.of 1<span data-slot="badge" class="inline-flex items-center justify-center border font-medium w-fit whitespace-nowrap shrink-0 [&amp;>svg]:size-3 gap-1 [&amp;>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden text-foreground [a&amp;]:hover:bg-accent [a&amp;]:hover:text-accent-foreground px-2 py-0.5 text-xs rounded-md text-nowrap" data-testid="row-count-summary">pagination.totalItems: 3</span>
     </div>
     <div role="group" data-slot="button-group" class="flex w-fit items-stretch [&amp;>*]:focus-visible:z-10 [&amp;>*]:focus-visible:relative [&amp;>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&amp;>input]:flex-1 has-[select[aria-hidden=true]:last-child]:[&amp;>[data-slot=select-trigger]:last-of-type]:rounded-r-md has-[>[data-slot=button-group]]:gap-2 [&amp;>*:not(:first-child)]:rounded-l-none [&amp;>*:not(:first-child)]:border-l-0 [&amp;>*:not(:last-child)]:rounded-r-none">
     <button data-slot="button" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8" disabled="" title="pagination.firstPage">
     <span class="sr-only">pagination.firstPage</span>
     <svg class="h-4 w-4" data-lucide="ChevronsLeftIcon" data-testid="lucide-chevrons-left-icon">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <button data-slot="button" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8" disabled="" title="pagination.previousPage">
     <span class="sr-only">pagination.previousPage</span>
     <svg class="h-4 w-4" data-lucide="ChevronLeftIcon" data-testid="lucide-chevron-left-icon">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <button data-slot="button" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8" disabled="" title="pagination.nextPage">
     <span class="sr-only">pagination.nextPage</span>
     <svg class="h-4 w-4" data-lucide="ChevronRightIcon" data-testid="lucide-chevron-right-icon">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <button data-slot="button" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8" disabled="" title="pagination.lastPage">
     <span class="sr-only">pagination.lastPage</span>
     <svg class="h-4 w-4" data-lucide="ChevronsRightIcon" data-testid="lucide-chevrons-right-icon">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     </div>
     </div>
     </div>
     </div>"
    `);
  });

  it("expansion (expanded by default)", () => {
    const { container } = renderGrid(data, {
      columns,
      expansion: {
        enabled: true,
        renderContent: (r) => <div>detail-{r.name}</div>,
        expanderColumns: ["name"],
        defaultExpanded: true,
      },
    });
    expect(markup(container)).toMatchInlineSnapshot(`
     "<div class="flex flex-col gap-2">
     <div class="flex items-center gap-2 w-full">
     <input data-slot="input" class="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive md:max-w-sm h-8" placeholder="toolbar.search" value="">
     <div role="group" data-slot="button-group" class="w-fit items-stretch [&amp;>*]:focus-visible:z-10 [&amp;>*]:focus-visible:relative [&amp;>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&amp;>input]:flex-1 has-[select[aria-hidden=true]:last-child]:[&amp;>[data-slot=select-trigger]:last-of-type]:rounded-r-md has-[>[data-slot=button-group]]:gap-2 [&amp;>*:not(:first-child)]:rounded-l-none [&amp;>*:not(:first-child)]:border-l-0 [&amp;>*:not(:last-child)]:rounded-r-none hidden ml-auto md:flex">
     <button data-slot="popover-trigger" data-variant="outline" data-size="sm" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5" type="button" aria-haspopup="dialog" aria-expanded="false" data-state="closed">
     <svg class="h-4 w-4" data-lucide="Filter" data-testid="lucide-filter">
     <path d="M0 0">
     </path>
     </svg>
     <span>toolbar.filters</span>
     </button>
     <button data-slot="dropdown-menu-trigger" data-variant="outline" data-size="sm" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5" type="button" id="radix-_r_ID_" aria-haspopup="menu" aria-expanded="false" data-state="closed">
     <svg data-lucide="Columns3" data-testid="lucide-columns3">
     <path d="M0 0">
     </path>
     </svg>
     <span class="hidden lg:inline">toolbar.columns</span>
     <span class="lg:hidden">toolbar.columns</span>
     <svg data-lucide="ChevronDown" data-testid="lucide-chevron-down">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <button data-slot="button" data-variant="outline" data-size="sm" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5">
     <svg class="h-4 w-4" data-lucide="Download" data-testid="lucide-download">
     <path d="M0 0">
     </path>
     </svg>
     <span>toolbar.export</span>
     </button>
     </div>
     <div role="group" data-slot="button-group" class="w-fit items-stretch [&amp;>*]:focus-visible:z-10 [&amp;>*]:focus-visible:relative [&amp;>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&amp;>input]:flex-1 has-[select[aria-hidden=true]:last-child]:[&amp;>[data-slot=select-trigger]:last-of-type]:rounded-r-md has-[>[data-slot=button-group]]:gap-2 [&amp;>*:not(:first-child)]:rounded-l-none [&amp;>*:not(:first-child)]:border-l-0 [&amp;>*:not(:last-child)]:rounded-r-none hidden md:has-first:flex">
     </div>
     <button data-slot="drawer-trigger" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8 md:hidden" type="button" aria-haspopup="dialog" aria-expanded="false" data-state="closed">
     <svg class="h-4 w-4" data-lucide="Menu" data-testid="lucide-menu">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     </div>
     <div class="relative w-full border rounded-md overflow-hidden flex" style="height: auto;">
     <div data-slot="table-container" class="relative overflow-auto size-full">
     <table data-slot="table" class="w-full caption-bottom text-sm border-spacing-0">
     <thead data-slot="table-header" class="[&amp;_tr]:border-b sticky top-0 z-10 bg-background">
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
     <th data-slot="table-head" class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 has-[button]:px-0 not-last:border-r" colspan="1" style="position: relative; z-index: 0;">
     <div class="flex items-center size-full relative">
     <button data-slot="dropdown-menu-trigger" data-variant="ghost" data-size="default" class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 px-4 py-2 has-[>svg]:px-3 data-[state=open]:bg-accent w-full rounded-none h-full" type="button" id="radix-_r_ID_" aria-haspopup="menu" aria-expanded="false" data-state="closed">
     <span class="font-semibold mr-auto truncate">name</span>
     <svg class="ml-2 h-4 w-4" data-lucide="ChevronDown" data-testid="lucide-chevron-down">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <div class="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-primary transition-opacity opacity-0 hover:opacity-50">
     </div>
     </div>
     </th>
     </tr>
     </thead>
     <tbody data-slot="table-body" class="[&amp;_tr:last-child]:border-0">
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors group" data-state="false">
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0 has-[.expander]:px-0 has-[button]:px-0" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <div class="cursor-pointer hover:bg-muted/50 h-full flex items-center px-2 expander">
     <span>Charlie</span>
     </div>
     </td>
     </tr>
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 has-[.pp-0]:p-0" colspan="1">
     <div>detail-Charlie</div>
     </td>
     </tr>
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors group" data-state="false">
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0 has-[.expander]:px-0 has-[button]:px-0" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <div class="cursor-pointer hover:bg-muted/50 h-full flex items-center px-2 expander">
     <span>Alice</span>
     </div>
     </td>
     </tr>
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 has-[.pp-0]:p-0" colspan="1">
     <div>detail-Alice</div>
     </td>
     </tr>
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors group" data-state="false">
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0 has-[.expander]:px-0 has-[button]:px-0" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <div class="cursor-pointer hover:bg-muted/50 h-full flex items-center px-2 expander">
     <span>Bob</span>
     </div>
     </td>
     </tr>
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 has-[.pp-0]:p-0" colspan="1">
     <div>detail-Bob</div>
     </td>
     </tr>
     </tbody>
     </table>
     </div>
     </div>
     <div class="flex items-center flex-wrap gap-4">
     <div class="flex items-center flex-wrap gap-2 w-full sm:w-auto ml-auto">
     <div class="flex items-center w-full justify-between gap-2 sm:w-auto md:mr-4">
     <p class="text-sm font-medium">pagination.rowsPerPage</p>
     <button type="button" role="combobox" aria-expanded="false" aria-autocomplete="none" dir="ltr" data-state="closed" data-slot="select-trigger" data-size="sm" class="border-input data-placeholder:text-muted-foreground [&amp;_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&amp;_svg]:pointer-events-none [&amp;_svg]:shrink-0 [&amp;_svg:not([class*='size-'])]:size-4 w-18">
     <span data-slot="select-value" style="pointer-events: none;">10</span>
     <svg class="size-4 opacity-50" aria-hidden="true" data-lucide="ChevronDownIcon" data-testid="lucide-chevron-down-icon">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     </div>
     <div class="flex items-center justify-center text-sm font-medium mr-auto gap-2">pagination.page 1 pagination.of 1<span data-slot="badge" class="inline-flex items-center justify-center border font-medium w-fit whitespace-nowrap shrink-0 [&amp;>svg]:size-3 gap-1 [&amp;>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden text-foreground [a&amp;]:hover:bg-accent [a&amp;]:hover:text-accent-foreground px-2 py-0.5 text-xs rounded-md text-nowrap" data-testid="row-count-summary">pagination.totalItems: 3</span>
     </div>
     <div role="group" data-slot="button-group" class="flex w-fit items-stretch [&amp;>*]:focus-visible:z-10 [&amp;>*]:focus-visible:relative [&amp;>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&amp;>input]:flex-1 has-[select[aria-hidden=true]:last-child]:[&amp;>[data-slot=select-trigger]:last-of-type]:rounded-r-md has-[>[data-slot=button-group]]:gap-2 [&amp;>*:not(:first-child)]:rounded-l-none [&amp;>*:not(:first-child)]:border-l-0 [&amp;>*:not(:last-child)]:rounded-r-none">
     <button data-slot="button" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8" disabled="" title="pagination.firstPage">
     <span class="sr-only">pagination.firstPage</span>
     <svg class="h-4 w-4" data-lucide="ChevronsLeftIcon" data-testid="lucide-chevrons-left-icon">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <button data-slot="button" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8" disabled="" title="pagination.previousPage">
     <span class="sr-only">pagination.previousPage</span>
     <svg class="h-4 w-4" data-lucide="ChevronLeftIcon" data-testid="lucide-chevron-left-icon">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <button data-slot="button" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8" disabled="" title="pagination.nextPage">
     <span class="sr-only">pagination.nextPage</span>
     <svg class="h-4 w-4" data-lucide="ChevronRightIcon" data-testid="lucide-chevron-right-icon">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <button data-slot="button" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8" disabled="" title="pagination.lastPage">
     <span class="sr-only">pagination.lastPage</span>
     <svg class="h-4 w-4" data-lucide="ChevronsRightIcon" data-testid="lucide-chevrons-right-icon">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     </div>
     </div>
     </div>
     </div>"
    `);
  });

  it("row editing", () => {
    const { container } = renderGrid(data, {
      columns,
      editing: { enabled: true, mode: "row", onRowSave: jest.fn() },
    });
    expect(markup(container)).toMatchInlineSnapshot(`
     "<div class="flex flex-col gap-2">
     <div class="flex items-center gap-2 w-full">
     <input data-slot="input" class="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive md:max-w-sm h-8" placeholder="toolbar.search" value="">
     <div role="group" data-slot="button-group" class="w-fit items-stretch [&amp;>*]:focus-visible:z-10 [&amp;>*]:focus-visible:relative [&amp;>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&amp;>input]:flex-1 has-[select[aria-hidden=true]:last-child]:[&amp;>[data-slot=select-trigger]:last-of-type]:rounded-r-md has-[>[data-slot=button-group]]:gap-2 [&amp;>*:not(:first-child)]:rounded-l-none [&amp;>*:not(:first-child)]:border-l-0 [&amp;>*:not(:last-child)]:rounded-r-none hidden ml-auto md:flex">
     <button data-slot="popover-trigger" data-variant="outline" data-size="sm" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5" type="button" aria-haspopup="dialog" aria-expanded="false" data-state="closed">
     <svg class="h-4 w-4" data-lucide="Filter" data-testid="lucide-filter">
     <path d="M0 0">
     </path>
     </svg>
     <span>toolbar.filters</span>
     </button>
     <button data-slot="dropdown-menu-trigger" data-variant="outline" data-size="sm" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5" type="button" id="radix-_r_ID_" aria-haspopup="menu" aria-expanded="false" data-state="closed">
     <svg data-lucide="Columns3" data-testid="lucide-columns3">
     <path d="M0 0">
     </path>
     </svg>
     <span class="hidden lg:inline">toolbar.columns</span>
     <span class="lg:hidden">toolbar.columns</span>
     <svg data-lucide="ChevronDown" data-testid="lucide-chevron-down">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <button data-slot="button" data-variant="outline" data-size="sm" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5">
     <svg class="h-4 w-4" data-lucide="Download" data-testid="lucide-download">
     <path d="M0 0">
     </path>
     </svg>
     <span>toolbar.export</span>
     </button>
     </div>
     <div role="group" data-slot="button-group" class="w-fit items-stretch [&amp;>*]:focus-visible:z-10 [&amp;>*]:focus-visible:relative [&amp;>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&amp;>input]:flex-1 has-[select[aria-hidden=true]:last-child]:[&amp;>[data-slot=select-trigger]:last-of-type]:rounded-r-md has-[>[data-slot=button-group]]:gap-2 [&amp;>*:not(:first-child)]:rounded-l-none [&amp;>*:not(:first-child)]:border-l-0 [&amp;>*:not(:last-child)]:rounded-r-none hidden md:has-first:flex">
     </div>
     <button data-slot="drawer-trigger" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8 md:hidden" type="button" aria-haspopup="dialog" aria-expanded="false" data-state="closed">
     <svg class="h-4 w-4" data-lucide="Menu" data-testid="lucide-menu">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     </div>
     <div class="relative w-full border rounded-md overflow-hidden flex" style="height: auto;">
     <div data-slot="table-container" class="relative overflow-auto size-full">
     <table data-slot="table" class="w-full caption-bottom text-sm border-spacing-0">
     <thead data-slot="table-header" class="[&amp;_tr]:border-b sticky top-0 z-10 bg-background">
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors">
     <th data-slot="table-head" class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 has-[button]:px-0 not-last:border-r" colspan="1" style="position: relative; z-index: 0;">
     <div class="flex items-center size-full relative">
     <button data-slot="dropdown-menu-trigger" data-variant="ghost" data-size="default" class="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 px-4 py-2 has-[>svg]:px-3 data-[state=open]:bg-accent w-full rounded-none h-full" type="button" id="radix-_r_ID_" aria-haspopup="menu" aria-expanded="false" data-state="closed">
     <span class="font-semibold mr-auto truncate">name</span>
     <svg class="ml-2 h-4 w-4" data-lucide="ChevronDown" data-testid="lucide-chevron-down">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <div class="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-primary transition-opacity opacity-0 hover:opacity-50">
     </div>
     </div>
     </th>
     <th data-slot="table-head" class="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 has-[button]:px-0 not-last:border-r" colspan="1" style="position: relative; z-index: 0;">column.edit</th>
     </tr>
     </thead>
     <tbody data-slot="table-body" class="[&amp;_tr:last-child]:border-0">
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors group" data-state="false">
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0 has-[.expander]:px-0 has-[button]:px-0 border hover:border-muted-foreground/40" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <span>Charlie</span>
     </td>
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0 has-[.expander]:px-0 has-[button]:px-0 border hover:border-muted-foreground/40" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <div class="flex gap-1 px-2">
     <button data-slot="button" data-variant="ghost" data-size="sm" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 rounded-md gap-1.5 has-[>svg]:px-2.5 h-7 px-2" aria-label="column.edit">
     <svg class="size-3.5" data-lucide="Pencil" data-testid="lucide-pencil">
     <path d="M0 0">
     </path>
     </svg>column.edit</button>
     </div>
     </td>
     </tr>
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors group" data-state="false">
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0 has-[.expander]:px-0 has-[button]:px-0 border hover:border-muted-foreground/40" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <span>Alice</span>
     </td>
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0 has-[.expander]:px-0 has-[button]:px-0 border hover:border-muted-foreground/40" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <div class="flex gap-1 px-2">
     <button data-slot="button" data-variant="ghost" data-size="sm" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 rounded-md gap-1.5 has-[>svg]:px-2.5 h-7 px-2" aria-label="column.edit">
     <svg class="size-3.5" data-lucide="Pencil" data-testid="lucide-pencil">
     <path d="M0 0">
     </path>
     </svg>column.edit</button>
     </div>
     </td>
     </tr>
     <tr data-slot="table-row" class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors group" data-state="false">
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0 has-[.expander]:px-0 has-[button]:px-0 border hover:border-muted-foreground/40" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <span>Bob</span>
     </td>
     <td data-slot="table-cell" class="p-2 align-middle whitespace-nowrap [&amp;:has([role=checkbox])]:pr-0 *:[[role=checkbox]]:translate-y-0.5 last:border-0! first:border-0! group-last:border-b-0! py-0 h-9 has-[div>input]:px-0 has-[div>button]:px-0 has-[.expander]:px-0 has-[button]:px-0 border hover:border-muted-foreground/40" style="width: 150px; min-width: 20px; max-width: 9007199254740991px; position: relative; z-index: 0;">
     <div class="flex gap-1 px-2">
     <button data-slot="button" data-variant="ghost" data-size="sm" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 rounded-md gap-1.5 has-[>svg]:px-2.5 h-7 px-2" aria-label="column.edit">
     <svg class="size-3.5" data-lucide="Pencil" data-testid="lucide-pencil">
     <path d="M0 0">
     </path>
     </svg>column.edit</button>
     </div>
     </td>
     </tr>
     </tbody>
     </table>
     </div>
     </div>
     <div class="flex items-center flex-wrap gap-4">
     <div class="flex items-center flex-wrap gap-2 w-full sm:w-auto ml-auto">
     <div class="flex items-center w-full justify-between gap-2 sm:w-auto md:mr-4">
     <p class="text-sm font-medium">pagination.rowsPerPage</p>
     <button type="button" role="combobox" aria-expanded="false" aria-autocomplete="none" dir="ltr" data-state="closed" data-slot="select-trigger" data-size="sm" class="border-input data-placeholder:text-muted-foreground [&amp;_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&amp;_svg]:pointer-events-none [&amp;_svg]:shrink-0 [&amp;_svg:not([class*='size-'])]:size-4 w-18">
     <span data-slot="select-value" style="pointer-events: none;">10</span>
     <svg class="size-4 opacity-50" aria-hidden="true" data-lucide="ChevronDownIcon" data-testid="lucide-chevron-down-icon">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     </div>
     <div class="flex items-center justify-center text-sm font-medium mr-auto gap-2">pagination.page 1 pagination.of 1<span data-slot="badge" class="inline-flex items-center justify-center border font-medium w-fit whitespace-nowrap shrink-0 [&amp;>svg]:size-3 gap-1 [&amp;>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden text-foreground [a&amp;]:hover:bg-accent [a&amp;]:hover:text-accent-foreground px-2 py-0.5 text-xs rounded-md text-nowrap" data-testid="row-count-summary">pagination.totalItems: 3</span>
     </div>
     <div role="group" data-slot="button-group" class="flex w-fit items-stretch [&amp;>*]:focus-visible:z-10 [&amp;>*]:focus-visible:relative [&amp;>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&amp;>input]:flex-1 has-[select[aria-hidden=true]:last-child]:[&amp;>[data-slot=select-trigger]:last-of-type]:rounded-r-md has-[>[data-slot=button-group]]:gap-2 [&amp;>*:not(:first-child)]:rounded-l-none [&amp;>*:not(:first-child)]:border-l-0 [&amp;>*:not(:last-child)]:rounded-r-none">
     <button data-slot="button" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8" disabled="" title="pagination.firstPage">
     <span class="sr-only">pagination.firstPage</span>
     <svg class="h-4 w-4" data-lucide="ChevronsLeftIcon" data-testid="lucide-chevrons-left-icon">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <button data-slot="button" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8" disabled="" title="pagination.previousPage">
     <span class="sr-only">pagination.previousPage</span>
     <svg class="h-4 w-4" data-lucide="ChevronLeftIcon" data-testid="lucide-chevron-left-icon">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <button data-slot="button" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8" disabled="" title="pagination.nextPage">
     <span class="sr-only">pagination.nextPage</span>
     <svg class="h-4 w-4" data-lucide="ChevronRightIcon" data-testid="lucide-chevron-right-icon">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     <button data-slot="button" data-variant="outline" data-size="icon-sm" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border text-foreground bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8" disabled="" title="pagination.lastPage">
     <span class="sr-only">pagination.lastPage</span>
     <svg class="h-4 w-4" data-lucide="ChevronsRightIcon" data-testid="lucide-chevrons-right-icon">
     <path d="M0 0">
     </path>
     </svg>
     </button>
     </div>
     </div>
     </div>
     </div>"
    `);
  });
});
