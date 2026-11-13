# Combobox

`Combobox` from `@repo/ayasofyazilim-ui/custom/combobox` is a searchable single-select over a list of objects. This page covers only the `freeText` prop.

## When to use

- The user may need a value that is not in the list, such as a model name the catalogue does not know yet. Pass `freeText` and the text they type becomes a selectable option.
- Leave `freeText` out when only listed items are valid. The combobox behaves exactly as before.

## Minimal example

```tsx
import { Combobox } from "@repo/ayasofyazilim-ui/custom/combobox";

type Model = { id: string; name: string };

<Combobox<Model>
  list={models}
  selectIdentifier="id"
  selectLabel="name"
  value={model}
  onValueChange={(next) => setModel(next ?? null)}
  freeText={{ toItem: (text) => ({ id: text, name: text }) }}
/>
```

## Props

| Prop | Default | Purpose |
| --- | --- | --- |
| `freeText.toItem` | required when `freeText` is set | Builds the item passed to `onValueChange` when the typed text is chosen. It receives the trimmed text |
| `freeText.label` | `(text) => \`Use "${text}"\`` | Text of the extra option |

The extra option is the last entry of the list. It appears only when the trimmed search text is non-empty and equals no item's `selectLabel` (compared case-insensitively) or `selectIdentifier` (compared exactly). Choosing it calls `onValueChange(freeText.toItem(trimmedText))` and closes the list. When `freeText` is set and the current `value` is not in `list`, the trigger shows that value's own `selectLabel`; without `freeText` it shows the empty text as before.

## Common mistakes

- Leaving `selectLabel` empty on the item built by `toItem`. The trigger shows `String(value[selectLabel])` for a value missing from `list`, so an empty label falls back to the empty text.
- Hardcoding the English default in a localized app. Pass `freeText.label`.
- Returning an item from `toItem` whose `selectIdentifier` collides with a listed item.
