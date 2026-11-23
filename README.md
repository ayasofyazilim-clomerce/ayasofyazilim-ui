# @ayasofyazilim-clomerce/ui

React 19 + Next.js 16 component library: shadcn/ui primitives, schema-driven forms (`SchemaForm`), a data grid (`MasterDataGrid`) and other composite components, styled with Tailwind CSS v4.

The package ships ESM JavaScript and TypeScript declarations, one file per module, so an app only loads what it imports.

## Install

The package is published to GitHub Packages (`npm.pkg.github.com`), not to npmjs.com. Installing it needs a GitHub token, even when the package is public.

### 1. Point the scope at GitHub Packages

Add an `.npmrc` to the app's repository (commit it; it holds no secret):

```ini
@ayasofyazilim-clomerce:registry=https://npm.pkg.github.com
```

Every other package still comes from npmjs.com.

### 2. Authenticate

**On your machine**: create a personal access token (classic) with the `read:packages` scope (GitHub Packages does not accept fine-grained tokens) and put it in your user-level `~/.npmrc`, never in a repository:

```ini
//npm.pkg.github.com/:_authToken=YOUR_TOKEN
```

**In another repository's GitHub Actions**: use that workflow's `GITHUB_TOKEN`.

1. A package admin grants the repository read access first: on the package's page, **Package settings** → **Manage Actions access** → add the repository with the **Read** role. Until then the install fails with a 403 or 404.
2. Give the job `packages: read` and pass the token to the install:

```yaml
permissions:
  contents: read
  packages: read
steps:
  - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
  - uses: pnpm/action-setup@73e46992e05b19abd31f2f3c20e0e7370d762115 # v6.1.1
  - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
    with:
      node-version: 24
      registry-url: https://npm.pkg.github.com
      scope: "@ayasofyazilim-clomerce"
  - run: pnpm install --frozen-lockfile
    env:
      NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 3. Add the package and its peers

```sh
pnpm add @ayasofyazilim-clomerce/ui next react react-dom next-themes zod
pnpm add -D tailwindcss @tailwindcss/postcss
```

### Peer dependencies

| Package | Range | Notes |
| --- | --- | --- |
| `next` | `^16.2.10` | |
| `react`, `react-dom` | `^19.1.1` | |
| `next-themes` | `^0.4.6` | |
| `zod` | `^4.1.13` | Shared with the app, so a `z.ZodType` you pass (grid cell validators) and the library's `@ayasofyazilim-clomerce/ui/lib/zod` are the same zod. |
| `tailwindcss`, `@tailwindcss/postcss` | `^4.1.11` | The app compiles the library's stylesheet. |
| `@types/react`, `@types/react-dom` | `^19.1.0` | Optional; TypeScript apps have them already. |
| `canvas`, `jsdom` | | Optional; only for server-side or test environments that need them. |

## Set up the app

### `app/globals.css`

The app owns the Tailwind import. Import the library's theme right after it:

```css
@import "tailwindcss";
@import "@ayasofyazilim-clomerce/ui/globals.css";

/* Your own @source lines, if any, go here. */
```

`@ayasofyazilim-clomerce/ui/globals.css` holds the design tokens, the `dark` variant, base overrides and `tw-animate-css`. It also tells Tailwind to scan the library's own files for class names (an `@source` relative to the stylesheet), so you do not add a `node_modules` path. This works with pnpm's symlinked layout and with a hoisted (npm-style) layout.

### `postcss.config.mjs`

```js
export { default } from "@ayasofyazilim-clomerce/ui/postcss.config";
```

or your own config with `plugins: { "@tailwindcss/postcss": {} }`.

### `next.config`

Nothing is required when the package comes from the registry: it is already compiled. Turbopack (`next build`) and webpack (`next build --webpack`) both work.

## Usage

Every module under `src/{aria,components,custom,hooks,lib}` is a subpath export, without a file extension. A folder with an `index` file is imported by its folder name.

```tsx
import { Button } from "@ayasofyazilim-clomerce/ui/components/button";
import { cn } from "@ayasofyazilim-clomerce/ui/lib/utils";
import { z } from "@ayasofyazilim-clomerce/ui/lib/zod";
import { useIsMobile } from "@ayasofyazilim-clomerce/ui/hooks/use-mobile";
import { SchemaForm } from "@ayasofyazilim-clomerce/ui/custom/schema-form";
import {
  MasterDataGrid,
  getGridUrlParams,
} from "@ayasofyazilim-clomerce/ui/custom/master-data-grid";
```

Client components carry `"use client"`; `getGridUrlParams` can be called from a server component.

### PDF worker

`DocumentViewer` renders PDFs with pdf.js, which needs a worker file. By default it loads the matching worker from a CDN. To serve it yourself (for example under a strict CSP), pass `pdfWorkerSrc`:

```tsx
import DocumentViewer from "@ayasofyazilim-clomerce/ui/custom/document-viewer";

<DocumentViewer
  document={{ uri: url, fileType: "pdf" }}
  pdfWorkerSrc="/pdf.worker.min.mjs"
/>;
```

### Translated labels

Primitives that used to hardcode English text ("Close", "Previous", "Toggle Sidebar", ...) take optional label props. Every default is the previous English text.

```tsx
<DialogContent closeLabel={t("Close")}>...</DialogContent>
<PaginationPrevious href="?page=1" label={t("Previous")} />
```

### Component docs

- [MasterDataGrid](docs/components/master-data-grid.md)
- [DocumentViewer](docs/components/document-viewer.md)
- [Primitive labels](docs/components/primitive-labels.md)

## Using the source in a monorepo

The repository's top-level `exports` point at `src`, so a pnpm workspace can consume it without a build step:

```jsonc
// apps/web/package.json
{ "dependencies": { "@ayasofyazilim-clomerce/ui": "workspace:*" } }
```

```js
// apps/web/next.config.mjs
export default { transpilePackages: ["@ayasofyazilim-clomerce/ui"] };
```

The CSS setup is the same as above. When the package is packed or published, pnpm replaces `exports` with `publishConfig.exports`, which point at `dist`.

## Development

```sh
pnpm install
pnpm lint
pnpm type-check   # tsc, plus a check that the exports maps are up to date
pnpm test
pnpm build        # tsup (JS) + tsc (declarations) + a check of dist
```

- The `CI` workflow runs these five steps on every pull request to `main` and on `main` itself: the same checks `Publish` runs before a release.
- `pnpm exports` regenerates both exports maps from the `src` tree. Run it after adding, moving or removing a module; `pnpm type-check` fails until you do.
- `scripts/exports.mjs --dist` (run by `build` and `prepack`) checks that every dist entry exists and that the built code imports only dependencies and peer dependencies.

### Releasing

1. Bump `version` in `package.json` and add a `CHANGELOG.md` entry.
2. Push a tag `ui-v<version>` (for example `ui-v0.2.0`).
3. The `Publish` workflow installs, lints, type-checks, tests, builds, packs and publishes to GitHub Packages with the workflow's `GITHUB_TOKEN`. No secret is needed. Running the workflow by hand does everything except the publish.

Always publish with pnpm (the workflow does): the npm CLI ignores `publishConfig.exports` and would publish the `src` entry points. `publishConfig.registry` sends the package to GitHub Packages. The package's visibility (private, internal or public) and which repositories may read it are set on the package's settings page on GitHub, not in `package.json`.

## License

[MIT](LICENSE)
