# ThemeToggle

`ThemeToggle` and `ThemeValue` from `@repo/ayasofyazilim-ui/custom/theme-toggle` are a segmented System / Light / Dark control built on `components/toggle-group`, either controlled by the app or wired to next-themes.

## When to use

- A theme switcher in a header, user menu or settings page.
- Controlled (pass `value`): the app owns the theme, for example the studio's `useStudioTheme()` with its cookie, ABP sync and localStorage seeding. `ThemeToggle` only calls `onValueChange`.
- Uncontrolled (no `value`): the app uses next-themes. `ThemeToggle` reads `theme` and calls `setTheme`. It must sit under a next-themes `ThemeProvider`.

## Minimal example

```tsx
import { ThemeToggle, type ThemeValue } from "@repo/ayasofyazilim-ui/custom/theme-toggle";

// Controlled
const [theme, setTheme] = useState<ThemeValue>("system");
<ThemeToggle value={theme} onValueChange={setTheme} />;

// Uncontrolled, on next-themes
<ThemeToggle iconOnly />;
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `value` | `"system" \| "light" \| "dark"` | `undefined` | Defined means controlled. |
| `onValueChange` | `(value: ThemeValue) => void` | none | Called in controlled mode only. |
| `labels` | `{ group?, system?, light?, dark? }` | `"Theme"`, `"System"`, `"Light"`, `"Dark"` | Group label is the `aria-label` of the radio group. |
| `iconOnly` | `boolean` | `false` | Hides the text; each item gets an `aria-label` with its label. |
| `className` | `string` | none | Applied to the group. |

Clicking the active item does nothing; the selection never clears.

## Common mistakes

- Passing `value` and expecting next-themes to update. In controlled mode `setTheme` is never called; the app must apply the theme itself.
- Using it without a next-themes `ThemeProvider` and without `value`. Uncontrolled mode needs the provider.
- Expecting a selection on the server. Uncontrolled, nothing is selected until the component has mounted (next-themes does not know the theme on the server), so there is no hydration mismatch. A controlled `value` is shown from the first render.
- Translating only the item labels. With `iconOnly`, the translated labels become the `aria-label`s; set `labels.group` too.
