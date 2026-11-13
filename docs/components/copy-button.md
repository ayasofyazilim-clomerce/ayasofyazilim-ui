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

`CopyButton`: all `ButtonProps` except `onClick` and `children`, plus

| Prop | Default | Purpose |
| --- | --- | --- |
| `value` | required | Text written to the clipboard |
| `labels` | `{ copy: "Copy", copied: "Copied" }` | The `aria-label` (and tooltip) for the current state |
| `onCopy` | none | Called with `true` on success, `false` when the copy failed |

`CopyableText`: `value`, `children` (shown instead of `value`), `labels`, `onCopy`, `className`, `classNames: { container, text, button }`.

`useCopyToClipboard(options?)`: `resetAfterMs` defaults to `2000`. Returns `{ copied, copy }`.

## Common mistakes

- Expecting a throw on failure. `copy` resolves `false` and `copied` stays false when `navigator.clipboard` is missing (plain-http origins) or refused; use `onCopy(false)` to tell the user.
- Hardcoding English labels in a localized app. Pass `labels`.
- Importing the hook from a `.tsx` path. It lives in `hooks/use-copy-to-clipboard` (a `.ts` file).
