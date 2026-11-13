# CodeBlock

`CodeBlock` from `@repo/ayasofyazilim-ui/custom/code-block` shows read-only code or a secret in a `<pre><code>`, with a copy button and an optional mask. No syntax highlighting.

## When to use

- Showing a snippet, curl command or JSON sample that users copy.
- Showing a one-time secret (API key, token) that stays hidden until the user reveals it.

## Minimal example

```tsx
import { CodeBlock } from "@repo/ayasofyazilim-ui/custom/code-block";

<CodeBlock code={curlCommand} language="bash" maxHeight={240} />

<CodeBlock code={apiKey} masked labels={{ reveal: "Show", hide: "Hide" }} />
```

## Props

| Prop | Default | Purpose |
| --- | --- | --- |
| `code` | required | The text shown and copied |
| `language` | none | Rendered as `data-language` on the `<pre>` |
| `masked` | `false` | Shows `••••••••••••` and a reveal/hide toggle |
| `labels` | `{ copy: "Copy", copied: "Copied", reveal: "Reveal", hide: "Hide" }` | Button names |
| `onCopy` | none | Called with `true`/`false` after a copy attempt |
| `maxHeight` | none | Number (px) or CSS length; the block scrolls beyond it |
| `className`, `classNames` | none | `classNames`: `container`, `toolbar`, `pre` |

## Common mistakes

- Assuming a masked value is merely visually hidden. Before reveal it is absent from the DOM entirely (text and attributes); only the fixed mask string is rendered.
- Expecting copy to need a reveal. Copy reads the `code` prop, so it works while masked.
- Expecting highlighting. It is plain text by design.
