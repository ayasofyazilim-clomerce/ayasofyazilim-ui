# MasterDataGrid

`MasterDataGrid` from `@repo/ayasofyazilim-ui/custom/master-data-grid` is the shared data grid: schema-driven columns, server or client paging, filters, selection, grouping, editing, export.

## When to use

- Any list screen that shows rows from an API with paging and filters. Core's pattern is server-paged: a server page reads `searchParams`, calls the API, and passes `data` plus `rowCount`.
- Small client-side lists work too (leave `manualPagination` off).
- Client-fetched grids (pickers in dialogs) use `urlState: "none"`.

## Minimal server-paged example

```tsx
// page.tsx (server component)
import { getGridUrlParams } from "@repo/ayasofyazilim-ui/custom/master-data-grid";

const serverFilters = [
  { type: "string", key: "filter", label: "Name", placeholder: "Search" },
  {
    type: "date-range",
    key: "creationTime",
    keyFrom: "minCreationTime",
    keyTo: "maxCreationTime",
    label: "Created",
    placeholder: "Any date",
  },
] as const;

export default async function Page({ searchParams }) {
  const { skipCount, maxResultCount, query } = getGridUrlParams(
    await searchParams,
    { prefix: "orders", filters: [...serverFilters], pageSize: 10 }
  );
  // query: { filter?, minCreationTime?, maxCreationTime? }, un-prefixed.
  const res = await api.list({ ...query, skipCount, maxResultCount });
  return <OrdersGrid data={res.items} rowCount={res.totalCount} />;
}

// orders-grid.tsx ("use client")
import { MasterDataGrid } from "@repo/ayasofyazilim-ui/custom/master-data-grid";

export function OrdersGrid({ data, rowCount }) {
  return (
    <MasterDataGrid
      data={data}
      config={{
        schema,
        localization,
        manualPagination: true,
        rowCount,
        pageSize: 10,
        serverFilters: [...serverFilters],
        urlState: { prefix: "orders" },
        getRowId: (row) => row.id,
      }}
    />
  );
}
```

## Options

Existing options, one line each (see `types.ts` for details):

| Option | Purpose |
| --- | --- |
| `schema`, `columns`, `schemaColumns`, `columnVisibility`, `columnOrder` | What columns exist and which show |
| `customRenderers`, `cellClassName`, `rowClassName` | Cell and row rendering |
| `locale`, `t`, `localization`, `dateOptions` | Text and date formatting |
| `serverFilters`, `serverFilterLocation` | Filters committed to the URL (or callback) |
| `enableSorting/Filtering/Pinning/Resizing/ColumnVisibility/Virtualization/Export/Search` | Feature switches |
| `selection`, `grouping`, `pinning`, `editing`, `expansion`, `virtualization` | Feature configs |
| `rowActions`, `rowActionsDisplay`, `tableActions` | Per-row and toolbar actions |
| `enablePagination`, `pageSize`, `pageSizeOptions`, `manualPagination`, `rowCount`, `unfilteredRowCount` | Paging |
| `manualSorting`, `manualFiltering`, `enableMultiSort`, `enableMultiFilter` | Server-side sorting/filtering |
| `onSortingChange`, `onFilteringChange`, `onPaginationChange`, `onRefresh` | Callbacks |
| `loading`, `loadingComponent`, `emptyComponent` | States |
| `getRowId` | Stable row identity |

New:

| Option | Purpose |
| --- | --- |
| `urlState?: { prefix: string } \| "none"` | Where paging and server filters live. Absent: un-prefixed URL keys (today's behaviour). `{ prefix }`: keys become `<prefix>.<key>`; an empty or whitespace prefix counts as absent (default mode, with a development warning). `"none"`: component state only, the grid never navigates. |
| `onServerFiltersChange(values)` | With `"none"`: called with every applied server filter, keyed by `key`. |
| `export.formats` | `Array<"csv" \| "excel" \| "json">`. Unset: the toolbar shows today's single Export button, which exports CSV. Set: the Export button opens a menu of those formats. Excel loads `write-excel-file` lazily. `customExport` still wins when set. |
| column `footer` | `ColumnConfig.footer: ({ column }) => ReactNode`, rendered in a table footer row. |

Export headers: Excel and JSON use the `column.<id>` resource, else a string `header`, else the schema property's `title`, else the column id, so a schema column's header matches the screen. CSV keeps its legacy headers (a string `header`, else the column id).

`getGridUrlParams(searchParams, { prefix?, filters?, pageSize? })` returns `{ skipCount, maxResultCount, filters, query }` for the server page. It accepts `URLSearchParams` or a Next.js `searchParams` record.

- `query` is what to send to the API. It holds the given filters' URL params, un-prefixed and raw, as a default grid's URL would have them: a date range as its `keyFrom` / `keyTo` strings, an `array` or `string-array` filter as `string[]`, anything else as a string. It holds nothing else (no `skipCount`, no other grid's keys), so spread it: `api.list({ ...query, skipCount, maxResultCount })`.
- `filters` holds the parsed values, keyed by each filter's `key`: a date range as `{ from, to }` (under `key`, not `keyFrom` / `keyTo`), an array as `string[]`, a `number` filter as a number, a `boolean` filter as a boolean, anything else as a string. Use it to read or show values; spreading it into an API call sends the date range as one object.

## Two grids on one page

Prefix every grid on a shared page: `urlState: { prefix: "a" }`, `{ prefix: "b" }`. Never mix in a default (unprefixed) grid: its `skipCount` and filter keys are un-prefixed, and its right-side panel's Clear (`router.push(pathname)`) wipes every grid's keys. (Its filter bar's reset is narrower: it drops only that grid's filter keys and `skipCount`.)

## Prefix mode is server-driven

- The server page reads that grid's params with `getGridUrlParams(searchParams, { prefix, filters, pageSize })`, passing the grid's `pageSize`, and fetches from them (spread `query`).
- `onServerFiltersChange` fires only in `"none"` mode. `onPaginationChange` may also fire in prefix mode (on paging, on the toolbar Reset, and on the table's own page resets in a client-paged grid), before any navigation lands. A prefix-mode server page must not fetch from it: it reads the URL through `getGridUrlParams`.
- Prefix mode starts on, and follows, the URL's page, including Back and Forward.
- A filter change returns that grid to page 1.

## Default mode is unchanged

Default mode (no `urlState`) is kept exactly as before, including two known behaviours:

- A deep-linked `skipCount` is removed on mount, so the grid starts on page 1.
- A filter commit keeps the current page.

For default grids, call `getGridUrlParams` without `pageSize`: they leave `maxResultCount` out of the URL only when it is 10. New screens should prefer `urlState: { prefix }`.

## `emptyComponent` hides the filters

In every mode, after a filter that returns zero rows, `emptyComponent` replaces the whole grid, including the filter bar and panel, so the user has no in-grid way to clear the filter. In default and prefix mode the filter is in the URL, so the user can still recover with Back or by editing the URL. In `"none"` mode they cannot: do not combine `"none"` with `emptyComponent`, or render your own reset next to it.

## Common mistakes

- No `getRowId` when rows need stable identity (selection, expansion, editing across pages). Index-based ids shift when data changes.
- Two unprefixed paginated grids on one page: they share `skipCount` and `maxResultCount`, so paging or resetting one moves the other, and a right-side panel Clear in either wipes both grids' keys.
- Spreading `filters` from `getGridUrlParams` into an API call: a date range arrives as one `{ from, to }` object. Spread `query`.
- Prefix grid whose server page omits `pageSize` from `getGridUrlParams`: the server falls back to 10 and disagrees with the grid.
- Combining `urlState: "none"` with `emptyComponent` (see above).
- React Compiler (library maintainers): components under `components/` that read TanStack table props must start with `"use no memo"`. `src/test/master-data-grid-no-memo.test.ts` enforces it.
