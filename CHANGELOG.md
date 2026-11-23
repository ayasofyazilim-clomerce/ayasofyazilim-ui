# Changelog

## 0.2.0 (2026-11-23)

The first published version of `@ayasofyazilim-clomerce/ui`. It also ships everything listed under 0.1.0 below, including the breaking changes since `@ayasofyazilim/ui` 0.0.11.

### Added

Each new component takes optional label props whose defaults are English, like the primitives. Docs for each are under `docs/components/`.

- `custom/confirm-provider`: `ConfirmProvider` and `useConfirm()`, a promise-based confirmation dialog on `components/alert-dialog`.
- `custom/copy-button`: `CopyButton` and `CopyableText`, backed by the new `hooks/use-copy-to-clipboard` (`useCopyToClipboard`).
- `custom/code-block`: `CodeBlock`, read-only code or a secret with a copy button and an optional mask.
- `custom/theme-toggle`: `ThemeToggle`, a System / Light / Dark segmented control, controlled or wired to next-themes.
- `custom/language-switcher`: `LanguageSwitcher`, a select with a flag and label per language. The app passes the flags as React nodes; the library ships no flag images.
- `custom/countdown-notice`: `CountdownNotice`, an alert with a live countdown and an optional Retry button, plus `formatCountdown`.
- `custom/tag-input`: `TagInput`, free-text chips with paste splitting, validation and limits.
- `custom/key-value-editor`: `KeyValueEditor` and `createKeyValueRow`, repeatable key/value rows with optional secret values.
- `custom/star-rating`: `StarRating`, a read-only score with fractions, or a 1 to `max` input.
- `custom/combobox`: opt-in `freeText` prop, so a typed value that is not in the list can be selected.
- `custom/icons`: AI-provider marks (`IconOpenAI`, `IconAnthropic`, `IconGemini` and others) and `IconDocker`, inline SVG with no remote assets. Also importable as `custom/icons/ai-providers` and `custom/icons/docker`.

## 0.1.0

Never published: 0.1.0 was prepared but not released, and its contents first ship in 0.2.0.

The first version built from `main`, and the first under the name `@ayasofyazilim-clomerce/ui` on GitHub Packages. Version 0.0.11 was published to npmjs.com as `@ayasofyazilim/ui` from a separate branch; this release replaces it, so the changes below are measured against 0.0.11.

### Breaking changes

- **Name and registry.** The package is now `@ayasofyazilim-clomerce/ui`, published to GitHub Packages (`https://npm.pkg.github.com`). Replace `@ayasofyazilim/ui` with `@ayasofyazilim-clomerce/ui` in `package.json`, imports, CSS and PostCSS config. Installing needs the scope line `@ayasofyazilim-clomerce:registry=https://npm.pkg.github.com` in the app's `.npmrc` and a GitHub token with `read:packages` (see the README). `@ayasofyazilim/ui` on npmjs.com stays at 0.0.x.
- **Peer dependencies.** `next` (`^16.2.10`), `react` and `react-dom` (`^19.1.1`), `next-themes` (`^0.4.6`), `zod` (`^4.1.13`), `tailwindcss` and `@tailwindcss/postcss` (`^4.1.11`) are peers instead of bundled dependencies. Install them in the app. `canvas` and `jsdom` are optional peers.
- **CSS.** `@ayasofyazilim-clomerce/ui/globals.css` does not import Tailwind (0.0.11's stylesheet did). The app's stylesheet starts with `@import "tailwindcss";` and then imports `@ayasofyazilim-clomerce/ui/globals.css`. The library scans its own files, so remove any `@source "../node_modules/@ayasofyazilim/ui/..."` line.
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
- Subpaths that 0.0.11 did not export: the `custom/*` folders `barcode-camera-scanner`, `barcode-image-decoder`, `camera-stream`, `credit-card-scanner`, `draw-pad`, `icons` and `mrz-camera-scanner`, plus `custom/barcode-formats` and `hooks/use-scroll`.

### Fixed

- `zod` patched to 4.6.7 for development; the peer range allows any 4.x from 4.1.13.
