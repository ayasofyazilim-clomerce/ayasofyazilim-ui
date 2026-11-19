# CopyButton

`CopyButton` and `CopyableText` from `@repo/ayasofyazilim-ui/custom/copy-button` copy a string to the clipboard, backed by `useCopyToClipboard` from `@repo/ayasofyazilim-ui/hooks/use-copy-to-clipboard`.

## When to use

- An icon-only "copy" affordance next to an id, URL, token or snippet (`CopyButton`).
- A monospace chip showing a value with its copy button attached (`CopyableText`).
- Custom UI that needs the copy-then-reset state: use the hook directly.

## Minimal example

```tsx
import {
  CopyButton,
  CopyableText,
} from "@repo/ayasofyazilim-ui/custom/copy-button";

<CopyButton value={runId} onCopy={(ok) => !ok && toast("Copy failed")} />

<CopyableText value={fullId}>{fullId.slice(0, 8)}</CopyableText>
```

Hook:

```ts
const { copied, copy } = useCopyToClipboard({ resetAfterMs: 2000 });
const ok = await copy("text"); // never throws
```

## Props

`CopyButton`: all `ButtonProps` except `onClick`, `children` and the native `onCopy` (replaced by the `onCopy` below), plus

| Prop | Default | Purpose |
| --- | --- | --- |
| `value` | required | Text written to the clipboard |
| `labels` | `{ copy: "Copy", copied: "Copied" }` | The `aria-label` (and tooltip) for the current state |
| `onCopy` | none | Called with `true` on success, `false` when the copy failed |

`CopyableText`: `value`, `children` (shown instead of `value`), `labels`, `onCopy`, `className`, `classNames: { container, text, button }`, `renderButton`.

### `renderButton` (CopyableText)

`renderButton={(button) => node}` receives the library's own `CopyButton`, already built with the value, labels, `onCopy` and `classNames.button`, and renders what you return in its place. When omitted, the default button renders unchanged.

- **Wrap it** to add behaviour while keeping the button, for example a tooltip:

  ```tsx
  <CopyableText
    value={fullId}
    renderButton={(button) => (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>Click to copy</TooltipContent>
      </Tooltip>
    )}
  />
  ```

- **Replace it** by ignoring the argument and returning your own element; the default button is then not rendered, and you own the copy behaviour (use `useCopyToClipboard`).

When `CopyButton` sits under an `asChild` parent (`TooltipTrigger`, a popover trigger), the parent clones it with its own `onClick`. `CopyButton` runs that handler first and skips the copy if the handler called `event.preventDefault()`, matching Radix's handler composition. A parent that does not call `preventDefault()` does not block the copy.

`useCopyToClipboard(options?)`: `resetAfterMs` defaults to `2000`. Returns `{ copied, copy }`.

## Common mistakes

- Expecting a throw on failure. `copy` resolves `false` and `copied` stays false when `navigator.clipboard` is missing (plain-http origins) or refused; use `onCopy(false)` to tell the user.
- Hardcoding English labels in a localized app. Pass `labels`.
- Importing the hook from a `.tsx` path. It lives in `hooks/use-copy-to-clipboard` (a `.ts` file).
