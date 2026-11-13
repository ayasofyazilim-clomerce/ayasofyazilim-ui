# StarRating

`StarRating` from `@repo/ayasofyazilim-ui/custom/star-rating` shows a read-only star score (fractions allowed) or, when given `onValueChange`, a 1 to `max` star input.

## When to use

- Display mode: a review or quality score next to a document or result (`value={3.5}`).
- Input mode: collecting a rating from the user (`onValueChange` makes it an accessible radio group).

## Minimal example

```tsx
import { StarRating } from "@repo/ayasofyazilim-ui/custom/star-rating";

<StarRating value={3.5} />

const [rating, setRating] = useState(0);
<StarRating value={rating} onValueChange={setRating} size="lg" />
```

## Props

| Prop | Default | Purpose |
| --- | --- | --- |
| `value` | required | Current score. Clamped to `[0, max]`; non-finite becomes `0` |
| `max` | `5` | Number of stars |
| `onValueChange` | none | Presence switches to input mode; called with an integer `1..max` |
| `size` | `"md"` | `"sm"`, `"md"` or `"lg"` |
| `disabled` | `false` | Blocks input (input mode) |
| `labels` | `rating` and `star` both default to "v of m" (value of max) | `rating` is the `aria-label` of the image / group; `star` names each radio |
| `className` | none | Extra classes on the root |

Input mode follows the radio-group pattern: one tab stop (the checked star, or the first), Arrow keys / Home / End move and select, hover previews without calling `onValueChange`. Stars are amber when filled and muted when empty.

## Common mistakes

- Passing `onValueChange` for a read-only score. Omit it to get the `role="img"` display with fractional fill.
- Expecting fractions from input mode. It only emits integers; a fractional `value` is shown as the nearest checked star.
- Hardcoding English labels in a localized app. Pass `labels`.
