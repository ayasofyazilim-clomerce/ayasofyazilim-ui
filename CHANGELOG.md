# Changelog

## Unreleased

### Fixed

- `AnnotatedDocumentViewer`: a page with hundreds of boxes is much cheaper to repaint on each hover. Boxes are faded with `stroke-opacity` instead of `opacity`: an element's `opacity` on a shape with both a fill and a stroke is drawn as an offscreen group, one per box. On a page of 668 boxes a hover went from about 97 ms to the 33 ms frame floor. The look is the same to within a percent.
- `AnnotatedDocumentViewer`: choosing a field with hundreds of boxes (a table named in `activeIds`) no longer freezes the page. A glow on every lit box and a fade on every box made one hover take seconds to draw. The glow is now drawn only while 24 or fewer boxes are active, and the fade only on a page of 150 boxes or fewer; past that, boxes keep the heavier outline and fill. A smaller page looks exactly as before.

## 0.4.0 (2026-11-24)

### Added

- `AppShell` folders: `AppShellNavItem.items` nests items in collapsible folders at any depth. The folders above the active page open on their own, in the server HTML too, and again on each navigation; `openFolders` and `onOpenFoldersChange` control them instead. ⌘K lists nested links with their folder path, and `AppShellNavItem.keywords` adds search terms. In the icon rail, choosing a folder expands the sidebar with it open. (#1112)
- `AppShell` `navFilter`: a filter box over the sidebar (from two characters, matching labels and `keywords` without regard to case or accents, keeping the folders above each match) and an expand/collapse all button. New labels `filterPlaceholder`, `expandAll` and `collapseAll`. (#1112)
- `AppShell` item actions: `AppShellNavItem.actions` (`AppShellNavAction`, a link or an `onSelect` callback). One action is a button on the row, several are a dropdown behind a "more" button (new label `moreActions`); ⌘K lists them under their item. They work in the mobile sheet; in the icon rail they are reached through ⌘K. (#1114)
- `AppShell` `shortcuts` (`AppShellShortcuts`: `value`, `onChange`, `reserved`, keyed `item:<id>` / `action:<id>`): assign, show and remove a shortcut from a bar under the ⌘K list, with ⌘K / Ctrl+K, ⌘B / Ctrl+B and the browser's own combos refused; a combo fires its link or action from anywhere except while recording. New labels `assignShortcut`, `removeShortcut`, `pressShortcut` and `shortcutReserved`. Nothing changes without the prop. (#1115)
- `useStoredShortcuts(storageKey?)`: shortcuts in localStorage, hydration-safe, synced across tabs, and in memory when storage throws. New subpaths `custom/app-shell/shortcuts` (pure helpers) and `custom/app-shell/use-stored-shortcuts`. (#1115)
- `custom/app-shell/nav-tree`: pure helpers over the nav, including `foldersAbove` and `filterNav`, which `custom/app-shell` also exports. (#1112)
- `custom/app-shell`: `navPrefetch` (`"viewport"` by default, or `"intent"`). With `"intent"`, a sidebar link (item, folder or action) no longer prefetches its page just by being in view: the page is prefetched when the person hovers, focuses or touches the link. A dynamic app then stops rendering every page in the sidebar on each load. (#1113)

### Changed

- `AppShellNavItem.href` is optional, so a folder can have no page of its own. Code that builds items is unaffected; code that reads `item.href` as a `string` must handle `undefined`. A flat nav renders exactly as before. (#1112)

## 0.3.0 (2026-11-24)

### Added

- `custom/app-shell`: `AppShell`, with a sidebar whose open or closed state is rendered on the server and persisted, a breadcrumb header, a Cmd-K command palette (`onNavigate`), a user-menu slot and a `headerContent` slot. New subpaths `custom/app-shell/match-active-href`, `custom/app-shell/types` and `custom/app-shell/use-app-shell-navigate`. (#1104)
- `custom/annotated-document-viewer`: a zoomable page viewer with an evidence-box overlay, a pager and opt-in page thumbnails, with subpaths `document-pager`, `geometry`, `thumbnail-strip` and `types`. (#1105)
- `custom/docx-preview` and `custom/document-viewer/renderers/docx`: a client-side Word preview, which `DocumentViewer` can use as an opt-in renderer. (#1105)
- MasterDataGrid:
  - opt-in tree rows, where select-all also covers collapsed rows (subpaths `components/table/tree-cell` and `utils/tree-rows`). (#1102)
  - opt-in row hover and click callbacks. Select-all is tri-state, and the select and action cells ignore row clicks. (#1102)
  - opt-in `memoizeRows`, so a row re-renders only when something it draws changes (`utils/row-memo`). (#1102)
  - `selection.rowLabel(row)`, an accessible name for each row's checkbox. (#1103)
- `Tree`: focus-only rows, an optional `TreeDragHandle` and helpers that limit drops to siblings. (#1106)
- `CopyableText`: a `renderButton` hook. `useConfirm`: an opt-in `initialFocus` per call. (#1101)

### Changed

- MasterDataGrid: the select column always comes first, and the actions columns last, whatever `columnOrder` or `columnVisibility` says. Before, a `columnOrder` without `"select"` moved the checkboxes to the far right. Listing `select` or `actions` in `columnOrder` still works, but no longer moves them. (#1109, fixes #1090)
- New dependencies: `docx-preview` 0.4.1 and `react-zoom-pan-pinch` 4.2.0. (#1105)
- The command dialog is labelled for assistive tech, and `Tree` keeps its own `aria-label` unless the caller passes one. (#1104, #1106)

### Fixed

- MasterDataGrid: `width`, `minWidth` and `maxWidth` on a column that also comes from the schema now set its size. (#1109, fixes #1089)
- `Stepper`: the active and inactive steps use theme tokens, so they can be read in dark mode. (#1108, fixes #1087)
- `TabLayout`: on `/a/b`, the `/a/b` tab is active instead of its parent `/a`. (#1108, fixes #1088)
- `CopyableText` honours a parent's `preventDefault`. (#1101)

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
