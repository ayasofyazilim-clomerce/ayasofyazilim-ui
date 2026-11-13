# KeyValueEditor

`KeyValueEditor` from `@repo/ayasofyazilim-ui/custom/key-value-editor` edits a list of key/value rows (headers, environment variables, settings), with optional secret values.

## When to use

- Free-form name/value pairs the user adds and removes, such as HTTP headers or environment variables.
- Values that must not be shown on screen: turn on `allowSecret` and each row gets a switch that masks its value.
- Not for fixed forms with known fields; use a normal form for those.

## Minimal example

```tsx
"use client";
import { useState } from "react";
import {
  KeyValueEditor,
  createKeyValueRow,
  type KeyValueRow,
} from "@repo/ayasofyazilim-ui/custom/key-value-editor";

export function Headers() {
  const [rows, setRows] = useState<KeyValueRow[]>([
    createKeyValueRow({ key: "Authorization", secret: true }),
  ]);
  return <KeyValueEditor value={rows} onValueChange={setRows} allowSecret />;
}
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `KeyValueRow[]` | required | `{ id, key, value, secret? }`. Controlled. |
| `onValueChange` | `(rows: KeyValueRow[]) => void` | required | Called with a new array; every row keeps its `id`. |
| `allowSecret` | `boolean` | `false` | Adds a secret switch per row. |
| `maxRows` | `number` | none | Disables Add once reached. |
| `disabled` | `boolean` | `false` | Disables every control. |
| `labels` | `{ key, value, secret, add, remove(index), duplicateKey }` | `"Key"`, `"Value"`, `"Secret"`, `"Add"`, `` `Remove row ${i + 1}` ``, `"Duplicate key"` | The first three are the inputs' `aria-label`s. |
| `className` | `string` | none | Root element. |
| `classNames` | `{ row, key, value }` | none | Slot overrides. |

`createKeyValueRow(init?)` returns a row with a fresh `id` (`crypto.randomUUID()` when available, otherwise a counter).

Secret rows use `type="password"` with `autoComplete="new-password"`, `data-1p-ignore` and `data-lpignore`, so password managers leave them alone.

A non-empty key that appears more than once (trimmed) is marked `aria-invalid` and shows the `duplicateKey` message, linked with `aria-describedby`. Saving is not blocked; the consumer decides what to do.

## Common mistakes

- Using the array index as a React key or row identity. Keep each row's `id`; build new rows with `createKeyValueRow`.
- Mutating `value` in place. Always pass a new array to state.
- Expecting duplicate keys to be rejected. The editor only flags them; validate on submit.
- Treating the secret switch as encryption. It only masks the input; protect the stored value yourself.
