# TagInput

`TagInput` from `@repo/ayasofyazilim-ui/custom/tag-input` is a controlled free-text input that turns each entry into a removable chip.

## When to use

- Free-form lists of short strings: keywords, aliases, e-mail recipients, allowed domains.
- Not for picking from a fixed set (use `Combobox` or `MultiSelect`), and not for long vertical lists of strings (the schema-form `string-array` widget stays as it is).

## Minimal example

```tsx
"use client";

import { TagInput } from "@repo/ayasofyazilim-ui/custom/tag-input";
import { useState } from "react";

export function Keywords() {
  const [tags, setTags] = useState<string[]>([]);
  return (
    <TagInput
      aria-label="Keywords"
      value={tags}
      onValueChange={setTags}
      maxItems={10}
      validate={(t) => (t.length > 30 ? "Too long" : null)}
    />
  );
}
```

Enter or `,` adds the trimmed text, blur adds pending text, pasting splits on commas and newlines (one `onValueChange` call), Backspace on an empty input removes the last chip. Enter during IME composition is ignored.

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `string[]` | required | Current tags. |
| `onValueChange` | `(value: string[]) => void` | required | Called with the full new list. |
| `placeholder` | `string` | none | Placeholder of the text input. |
| `maxItems` | `number` | unlimited | Further entries are rejected. |
| `allowDuplicates` | `boolean` | `false` | Exact-match duplicates are rejected otherwise. |
| `validate` | `(tag: string) => string \| null` | none | Return a message to reject the tag. |
| `disabled` | `boolean` | `false` | Blocks adding and removing. |
| `id` | `string` | none | Set on the text input. |
| `aria-label` | `string` | none | Set on the text input. |
| `labels` | `{ remove?, duplicate?, maxReached? }` | `Remove ${tag}`, `Already added`, `Maximum reached` | Visible and screen-reader text. |
| `className` | `string` | none | Outer wrapper. |
| `classNames` | `{ container?, chip?, input? }` | none | Slot overrides. |

After a paste, the consumed text is cleared; any rejected pieces are put back into the input joined by ", " and the first rejection's message is shown. A rejected typed entry stays in the input and its message shows under it with `role="alert"` until the text changes.

## Common mistakes

- Forgetting `aria-label` (or a `<label htmlFor>` plus `id`): the input has no accessible name.
- Mutating `value` in place: always pass a new array through `onValueChange`.
- Expecting the message to persist after typing: it clears on the next edit.
- Passing English-only `labels` in a localized app: supply translated `remove`, `duplicate` and `maxReached`.
