# Changelog

## 0.1.0

First release built from `main`. Version 0.0.11 was built from a separate branch; this release replaces it, so the changes below are measured against 0.0.11.

### Breaking changes

- **Peer dependencies.** `next` (`^16.2.10`), `react` and `react-dom` (`^19.1.1`), `next-themes` (`^0.4.6`), `zod` (`^4.1.13`), `tailwindcss` and `@tailwindcss/postcss` (`^4.1.11`) are peers instead of bundled dependencies. Install them in the app. `canvas` and `jsdom` are optional peers.
- **CSS.** `@ayasofyazilim/ui/globals.css` no longer imports Tailwind. The app's stylesheet starts with `@import "tailwindcss";` and then imports `@ayasofyazilim/ui/globals.css`. The library scans its own files, so remove any `@source "../node_modules/@ayasofyazilim/ui/..."` line.
- **Entry points.** Exports point at compiled `dist` JavaScript with `.d.ts` declarations (0.0.11 pointed types at `src`). Every module is an explicit subpath; paths that are not modules (for example `src/...` file paths) no longer resolve.
- **MasterDataGrid**
  - `MasterDataGridConfig.schema` is required.
  - `enableGrouping` and `enableRowSelection` are removed from the grid config. Use `grouping: { enabled }` and `selection: { enabled }`.
  - `TableAction` is a union discriminated by `type` (link, button, dialog actions).
  - `ExportConfig.formats` no longer accepts `"pdf"`. The formats are `"csv"`, `"excel"` and `"json"`.
  - Resource (translation) keys were reshaped. See `types.ts` and [the grid docs](docs/components/master-data-grid.md).
  - The column-settings dialog is removed.
- **AsyncSelect** is generic over its item type: `AsyncSelect<T extends SearchItem>`.
- **Webcam**: `webcamRef` is a ref to the underlying `<video>` element (it was a `react-webcam` ref).
- **EmailInput**: the default domain suggestions no longer include two product-specific domains. Pass them through `suggestions` if you need them.

### Added

- `DocumentViewer` `pdfWorkerSrc` prop (and `PdfWorkerSrcProvider`, `applyPdfWorkerSrc`) to serve the pdf.js worker yourself.
- Optional label props on primitives that hardcoded English text (`closeLabel`, `label`, ...), defaulting to the previous English.
- `--destructive-foreground` theme token.
- MasterDataGrid: scoped URL state (`urlState: { prefix }` or `"none"`), `getGridUrlParams` for server pages, column footers, Excel and JSON export.
- Subpaths that 0.0.11 did not export, among them every `custom/*` folder with an index, `custom/barcode-formats` and `hooks/use-scroll`.

### Fixed

- `zod` patched to 4.6.7 for development; the peer range allows any 4.x from 4.1.13.
