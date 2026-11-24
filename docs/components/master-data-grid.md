# MasterDataGrid

`MasterDataGrid` from `@ayasofyazilim-clomerce/ui/custom/master-data-grid` is the shared data grid: schema-driven columns, server or client paging, filters, selection, grouping, editing, export.

## When to use

- Any list screen that shows rows from an API with paging and filters. Core's pattern is server-paged: a server page reads `searchParams`, calls the API, and passes `data` plus `rowCount`.
- Small client-side lists work too (leave `manualPagination` off).
- Client-fetched grids (pickers in dialogs) use `urlState: "none"`.

## Minimal server-paged example

```tsx
// page.tsx (server component)
import { getGridUrlParams } from "@ayasofyazilim-clomerce/ui/custom/master-data-grid";

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
import { MasterDataGrid } from "@ayasofyazilim-clomerce/ui/custom/master-data-grid";

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
| `subRows` | Opt-in tree rows: child rows drawn under their parent, indented, with a toggle. See "Tree rows (`subRows`)" below. |
| `memoizeRows` | Opt-in: a body row re-renders only when something it draws changes. See "Memoized rows (`memoizeRows`)" below. |
| `selection.rowLabel(row)` | Opt-in: each row checkbox's accessible name, such as `` (row) => `Select ${row.name}` ``, so a screen reader can tell the rows apart. Without it, every row's checkbox reads the `column.selectRow` resource. Keep it stable (memoize it on its inputs): like `getRowId`, a new function rebuilds the columns, which remounts every cell and drops keyboard focus. |

Export headers: Excel and JSON use the `column.<id>` resource, else a string `header`, else the schema property's `title`, else the column id, so a schema column's header matches the screen. CSV keeps its legacy headers (a string `header`, else the column id).

`getGridUrlParams(searchParams, { prefix?, filters?, pageSize? })` returns `{ skipCount, maxResultCount, filters, query }` for the server page. It accepts `URLSearchParams` or a Next.js `searchParams` record.

- `query` is what to send to the API. It holds the given filters' URL params, un-prefixed and raw, as a default grid's URL would have them: a date range as its `keyFrom` / `keyTo` strings, an `array` or `string-array` filter as `string[]`, anything else as a string. It holds nothing else (no `skipCount`, no other grid's keys), so spread it: `api.list({ ...query, skipCount, maxResultCount })`.
- `filters` holds the parsed values, keyed by each filter's `key`: a date range as `{ from, to }` (under `key`, not `keyFrom` / `keyTo`), an array as `string[]`, a `number` filter as a number, a `boolean` filter as a boolean, anything else as a string. Use it to read or show values; spreading it into an API call sends the date range as one object.

## Column order and widths

- **`columnOrder` orders the data columns only.** The selection column (`select`) always comes first. The row-action columns (`actions`, then `edit-actions` with row editing) always come last. Data columns that `columnOrder` doesn't list follow the listed ones, in their usual order. You don't need to list `select` or `actions`. If you do, they keep their usual places wherever you put them. A `columnVisibility` list with `mode: "show"` and no `columnOrder` orders the columns the same way.
- **Pinning still applies.** By default `actions` is pinned right (`pinning: { right: ["actions"] }`), so it renders after `edit-actions`.
- **`width`, `minWidth` and `maxWidth` in `columns`** set the column's TanStack `size`, `minSize` and `maxSize`. This works both for a column that also comes from the schema and for a custom-only column. A column without them keeps the default size.

## Two grids on one page

Prefix every grid on a shared page: `urlState: { prefix: "a" }`, `{ prefix: "b" }`. Never mix in a default (unprefixed) grid: its `skipCount` and filter keys are un-prefixed, and its right-side panel's Clear (`router.push(pathname)`) wipes every grid's keys. (Its filter bar's reset is narrower: it drops only that grid's filter keys and `skipCount`.)

## Prefix mode is server-driven

- The server page reads that grid's params with `getGridUrlParams(searchParams, { prefix, filters, pageSize })`, passing the grid's `pageSize`, and fetches from them (spread `query`).
- `onServerFiltersChange` fires only in `"none"` mode. `onPaginationChange` may also fire in prefix mode (on paging, on the toolbar Reset, and on the table's own page resets in a client-paged grid), before any navigation lands. A prefix-mode server page must not fetch from it: it reads the URL through `getGridUrlParams`.
- Prefix mode starts on, and follows, the URL's page, including Back and Forward.
- A filter change returns that grid to page 1.

## Changed defaults

Two default changes apply to every grid, with or without the new options:

- **Tri-state select-all.** The header checkbox shows an indeterminate state (a dash) when some, but not all, selectable rows on the page are selected.
- **Checkbox styling.** `Checkbox` gains a `group` class and `data-[state=indeterminate]` styles to draw that state. The checked look is unchanged.

`src/test/master-data-grid-unchanged-markup.test.tsx` pins the resulting markup.

## Default mode is unchanged

Default mode (no `urlState`) is kept exactly as before, including two known behaviours:

- A deep-linked `skipCount` is removed on mount, so the grid starts on page 1.
- A filter commit keeps the current page.

For default grids, call `getGridUrlParams` without `pageSize`: they leave `maxResultCount` out of the URL only when it is 10. New screens should prefer `urlState: { prefix }`.

## `emptyComponent` hides the filters

In every mode, after a filter that returns zero rows, `emptyComponent` replaces the whole grid, including the filter bar and panel, so the user has no in-grid way to clear the filter. In default and prefix mode the filter is in the URL, so the user can still recover with Back or by editing the URL. In `"none"` mode they cannot: do not combine `"none"` with `emptyComponent`, or render your own reset next to it.

## Tree rows (`subRows`)

With `subRows`, a row may carry child rows of the same shape. They are drawn under it, indented, with a toggle in one column. A grid without `subRows` renders the same rows as before (apart from the checkbox change listed under "Changed defaults"): `src/test/master-data-grid-unchanged-markup.test.tsx` pins its markup.

```tsx
<MasterDataGrid
  data={fields}
  config={{
    schema,
    localization,
    subRows: {
      getSubRows: (field) => field.children,
      expanderColumn: "key",
      labels: { expand: t("Expand"), collapse: t("Collapse") },
    },
  }}
/>
```

| Option | Purpose |
| --- | --- |
| `getSubRows(row)` | A row's children: `undefined` or `[]` for a leaf. |
| `expanderColumn` | The id of the column that carries the toggle and the indentation. |
| `defaultExpanded` | The rows expanded on first render and after Reset: `true` for every row, or a record keyed by row id. The default is all collapsed. |
| `indent` | rem per depth level. The default is `1.25`. |
| `labels` | `{ expand, collapse }`, the toggle's accessible names. The defaults are "Expand row" and "Collapse row". |

How tree rows behave:

- **Row ids.** Without `getRowId`, ids follow the path: `0`, `0.1`, `0.1.0`. A `getRowId` you pass is used as it is, so it must be unique at every depth (its `index` counts within the parent). `defaultExpanded`, `selection.selectedIds` and `defaultSelectedIds`, and row editing are all keyed by these ids.
- **Toggle.** A row with children gets a button with `aria-expanded`. A leaf gets a spacer of the same width, so the column's values line up at every depth.
- **Selection.** Each row selects on its own: selecting a parent does not select its children. When `rowSelectable` returns false, the row gets no checkbox at all (a flat grid shows a disabled one). `onSelectionChange` and the table actions get every selected row at any depth, including the children of a collapsed parent.
- **Sorting** orders siblings within their parent.
- **Paging.** A page holds `pageSize` top-level rows together with their children.
- **Virtual mode** draws the children too.
- **These stay top-level, as today:**
  - **Export:** CSV, Excel and JSON export the top-level rows.
  - **Row counts:** the pager's total, its page count and its "N of M selected" count all count top-level rows.
  - **Filtering:** column filters and the search test top-level rows. A matching row keeps all its children; a row that does not match hides them.
- **Editing.** `editing.onRowSave` gets the edited row at any depth. `onDataChange` rewrites top-level rows only, because the grid cannot write into your `children`. Save a child's edits through `onRowSave`.
- **Not with grouping or expansion detail rows.** `grouping.enabled` and `expansion.renderContent` both draw rows of their own and share one expanded state, so neither combines with `subRows`. The types refuse both combinations. A config that gets past the types logs one warning in development and renders as if `subRows` were absent.

## Row events (`rowEvents`)

Opt-in callbacks that report the row under the pointer. The handlers attach to a row only when you pass them, in normal and virtual mode, so a grid without `rowEvents` gets no handlers and no `data-row-click-ignore` attributes. The select and actions cells carry `data-row-click-ignore` only when `onRowClick` is given.

```tsx
<MasterDataGrid
  data={rows}
  config={{
    schema,
    rowEvents: {
      onRowHover: (row) => setHovered(row), // row, or null when the pointer leaves
      onRowClick: (row) => setSelected(row),
    },
  }}
/>
```

| Option | Purpose |
| --- | --- |
| `onRowHover(row)` | Called with the row on mouse enter and with `null` on mouse leave. |
| `onRowClick(row)` | Called when a row is clicked. |

`onRowClick` is not called when the click starts inside `a`, `button`, `input`, `select`, `textarea`, `label`, `[role=checkbox]`, `[role=menuitem]` or `[data-row-click-ignore]`. Put `data-row-click-ignore` on any custom control that should keep its click to itself. With tree rows (`subRows`), a child row reports the child.

## Memoized rows (`memoizeRows`)

By default every body row, and every cell in it, re-renders whenever the grid does: one ticked checkbox re-renders the whole table. With `memoizeRows: true` a row re-renders only when something it tracks changes. Off (the default), the grid renders exactly as before; on, the markup is the same (`src/test/master-data-grid-memoize-rows.test.tsx` checks both).

```tsx
<MasterDataGrid data={rows} config={{ ...config, memoizeRows: true }} />
```

Set it once, when the grid is written. Turning it on or off at runtime swaps every row for a different component, so every row remounts and its cells lose their local state, such as an edit in progress or an open menu.

**What is tracked:** the row's data, selection, expansion and depth, and, per cell, the column's definition, visibility, pinning, size, filter value, sort and grouping. In full:

A TanStack row object is reused while its selection or expansion changes inside the table, so a row is not compared by its object alone. On every render the body resolves, per row, what the row draws from and compares that:

| Input | Why |
| --- | --- |
| The row object and its `original` | A data change makes new row objects. |
| Its id, index, depth and parent id, and whether it is a grouped child | Grouping rewrites depth and parent on the same row object; a grouped child's first cell is indented. |
| Selected, some sub-rows selected, all sub-rows selected, can select | The checkbox, `data-state="selected"`, and any cell that shows them. `rowSelectable` is called again every render, so it may read outside state. |
| Expanded, can expand | The tree toggle and the expansion detail row. |
| The resolved `rowClassName` and each cell's resolved `cellClassName` | Called again every render, so they may read outside state; the row re-renders only when a resolved string changes. |
| Per visible cell: its column, pinned side, sticky offset and size | The column set, order, visibility, pinning and sizes. A column object is new whenever the column definitions are rebuilt. |
| Per visible cell: its column's filter value, sort direction and grouped state | For a cell that shows them. A row that still passes a filter keeps its row object, and so does every row under a manual sort or a grouping state with no grouped row model. |
| Its entry in the editing rows | Starting, changing or ending an edit to that row. |
| `rowEvents.onRowHover` and `onRowClick`, by identity | The row's handlers. |
| `subRows`' expander column, indent and labels, by value | The tree cell. |
| `expansion.renderContent`, `editing.enabled`, `expansion.enabled` | The detail row and the cell borders. |

**What is not tracked:** anything a cell reads through `getContext().table` (another column's state, other rows, the global filter, `table.getState()`), column facets (`getFacetedUniqueValues` and the like), refs and module variables. A cell that renders from any of these is not re-rendered when it changes: do not use `memoizeRows` with such cells. React state or context a cell subscribes to is fine: a context change re-renders its readers whatever the memo says.

**Callbacks a skipped row does not call again.** These run while a row draws, so for a row the memo skips they are not called at all. Each must return the same thing for the same row, or its containing object must be a new one when what it returns changes: a new `rowActions` array, `editing` object, `expansion` object or `customRenderers` object rebuilds the columns and re-renders every row, whereas a new function inside an unchanged object does not, and the memoized rows keep what they drew:

- `rowActions[].hidden`, `rowActions[].disabled`, `rowActions[].label` and `rowActions[].render`;
- `editing.isRowEditable`;
- `expansion.renderContent`;
- `customRenderers`.

`rowClassName`, `cellClassName` and `selection.rowSelectable` are the exception: they are called for every row on every render, so they may read outside state.

For the memo to help, keep these stable across the renders where they do not change, or every row re-renders (correct, but no faster):

- `columns`, `schema`, `t`, `localization`, `dateOptions`, `customRenderers`, `cellClassName`, `getRowId`, `rowActions`, `rowActionsDisplay`, `editing`, `expansion`, `columnOrder`, `columnVisibility`, `schemaColumns`, `grouping.groupBy`, and with `editing` the `onDataChange` prop: the grid rebuilds its column definitions when any of them changes identity, and every column object with them.
- `rowEvents.onRowHover` and `rowEvents.onRowClick`: memoize the handlers (`useCallback`, or a `useMemo` for the whole `rowEvents` object) outside anything that changes with the selection. A `rowEvents` object rebuilt with the rest of the config on every tick re-renders every row.
- `expansion.renderContent`.

`selection.rowSelectable`, `selection.selectedIds`, `rowClassName` (as a function), `subRows` and the `config` object itself may be new every render: the row compares what they resolve to.

A new `data` array re-renders every row, even when one row changed: TanStack builds new row objects for it.

## Common mistakes

- No `getRowId` when rows need stable identity (selection, expansion, editing across pages). Index-based ids shift when data changes.
- Two unprefixed paginated grids on one page: they share `skipCount` and `maxResultCount`, so paging or resetting one moves the other, and a right-side panel Clear in either wipes both grids' keys.
- Spreading `filters` from `getGridUrlParams` into an API call: a date range arrives as one `{ from, to }` object. Spread `query`.
- Prefix grid whose server page omits `pageSize` from `getGridUrlParams`: the server falls back to 10 and disagrees with the grid.
- Combining `urlState: "none"` with `emptyComponent` (see above).
- A tree grid (`subRows`) whose `getRowId` repeats across depths, such as one built from the `index` argument: a parent and a child can then share an id, and select, expand and edit together.
- React Compiler (library maintainers): components under `components/` that read TanStack table props must start with `"use no memo"`. `src/test/master-data-grid-no-memo.test.ts` enforces it.
