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
] as const;

export default async function Page({ searchParams }) {
  const { skipCount, maxResultCount, filters } = getGridUrlParams(
    await searchParams,
    { prefix: "orders", filters: [...serverFilters], pageSize: 10 }
  );
  const res = await api.list({ skipCount, maxResultCount, ...filters });
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
| `urlState?: { prefix: string } \| "none"` | Where paging and server filters live. Absent: un-prefixed URL keys (today's behaviour). `{ prefix }`: keys become `<prefix>.<key>`. `"none"`: component state only, the grid never navigates. |
| `onServerFiltersChange(values)` | With `"none"`: called with every applied server filter, keyed by `key`. |
| `export.formats` | `Array<"csv" \| "excel" \| "json">`. Excel loads `write-excel-file` lazily. `customExport` still wins when set. |
| column `footer` | `ColumnConfig.footer: ({ column }) => ReactNode`, rendered in a table footer row. |

`getGridUrlParams(searchParams, { prefix?, filters?, pageSize? })` returns `{ skipCount, maxResultCount, filters }` for the server page. It accepts `URLSearchParams` or a Next.js `searchParams` record.

## Two grids on one page

Prefix every grid on a shared page: `urlState: { prefix: "a" }`, `{ prefix: "b" }`. A default (unprefixed) grid's filter reset or Clear wipes every grid's keys, so never mix one in.

## Prefix mode is server-driven

- The server page reads that grid's params with `getGridUrlParams(searchParams, { prefix, filters, pageSize })`, passing the grid's `pageSize`.
- `onPaginationChange` and `onServerFiltersChange` are for `"none"` mode (client-fetched grids such as pickers in dialogs). Prefix-mode grids do not rely on them.
- Prefix mode starts on, and follows, the URL's page, including Back and Forward.
- A filter change returns that grid to page 1.

## Default mode is unchanged

Default mode (no `urlState`) is kept exactly as before, including two known behaviours:

- A deep-linked `skipCount` is removed on mount, so the grid starts on page 1.
- A filter commit keeps the current page.

For default grids, call `getGridUrlParams` without `pageSize`: they leave `maxResultCount` out of the URL only when it is 10. New screens should prefer `urlState: { prefix }`.

## `"none"` mode and `emptyComponent`

After a filter that returns zero rows, `emptyComponent` replaces the whole grid, including the filter bar. In `"none"` mode the user then has no in-grid way to clear the filter. Do not combine them, or render your own reset next to `emptyComponent`.

## Common mistakes

- No `getRowId` when rows need stable identity (selection, expansion, editing across pages). Index-based ids shift when data changes.
- Two unprefixed paginated grids on one page: they share `skipCount` and `maxResultCount`, and a reset in one wipes the other.
- Prefix grid whose server page omits `pageSize` from `getGridUrlParams`: the server falls back to 10 and disagrees with the grid.
- Combining `urlState: "none"` with `emptyComponent` (see above).
- React Compiler (library maintainers): components under `components/` that read TanStack table props must start with `"use no memo"`. `src/test/master-data-grid-no-memo.test.ts` enforces it.
