# @ayasofyazilim/ui

A comprehensive React component library built with Tailwind CSS v4 for Next.js applications.

## Installation

```bash
npm install @ayasofyazilim/ui
# or
pnpm add @ayasofyazilim/ui
```

## Tailwind CSS v4 Configuration

### Step 1: Import the UI package styles

In your `app/globals.css`:

```css
@import "tailwindcss";
@import "tw-animate-css";

/* Import UI package theme variables */
@import "@ayasofyazilim/ui/globals.css";

/* Tell Tailwind to scan the UI package for class names */
@source "../node_modules/@ayasofyazilim/ui/src";
```

### Step 2: Adjust the @source path if needed

Depending on your project structure:

- **App Router (app/globals.css)**: `@source "../node_modules/@ayasofyazilim/ui/src";`
- **Pages Router (styles/globals.css)**: `@source "../../node_modules/@ayasofyazilim/ui/src";`
- **pnpm**: `@source "../node_modules/.pnpm/@ayasofyazilim+ui@*/node_modules/@ayasofyazilim/ui/src";`

### Step 3: Restart your dev server

After making changes to `globals.css`, **restart your Next.js dev server** for Tailwind to pick up the new source paths.

## Usage

### Import Components

```tsx
import { Button } from "@ayasofyazilim/ui/components/button";
import { Input } from "@ayasofyazilim/ui/components/input";
import { SchemaForm } from "@ayasofyazilim/ui/custom/schema-form";
```

### Import Utilities

```tsx
import { cn } from "@ayasofyazilim/ui/lib/utils";
```

### Import Hooks

```tsx
import { useDebounce } from "@ayasofyazilim/ui/hooks/use-debounce";
import { useMobile } from "@ayasofyazilim/ui/hooks/use-mobile";
```

## Available Exports

- **Components**: `@ayasofyazilim/ui/components/*`
- **Custom Components**: `@ayasofyazilim/ui/custom/*`
- **Hooks**: `@ayasofyazilim/ui/hooks/*`
- **Utils**: `@ayasofyazilim/ui/lib/*`
- **Aria Components**: `@ayasofyazilim/ui/aria/*`
- **Styles**: `@ayasofyazilim/ui/globals.css`

## TypeScript Support

This package includes TypeScript definitions. Your IDE should provide full autocomplete and type checking.

## License

MIT
