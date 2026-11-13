# CountdownNotice

`CountdownNotice` from `@repo/ayasofyazilim-ui/custom/countdown-notice` is an `Alert` with a live countdown to a moment in time, an optional message once time is up, and an optional Retry button. `formatCountdown` from the same path formats seconds as `m:ss` (or `h:mm:ss` from one hour up).

## When to use

- A rate limit, lockout or cool-down where the user must wait, then may try again ("Try again in 0:42").
- Anything with a known end time that the UI should count down to and then react to.
- Not for progress bars or elapsed-time displays.

## Minimal example

```tsx
import { CountdownNotice } from "@repo/ayasofyazilim-ui/custom/countdown-notice";

<CountdownNotice
  until={retryAt}
  title="Too many attempts"
  description={({ formatted }) => `Try again in ${formatted}.`}
  elapsed="You can try again now."
  onRetry={() => submit()}
/>;
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `until` | `Date \| number` | required | End time (a `Date`, or epoch milliseconds). |
| `title` | `ReactNode` | none | Rendered as the alert title. |
| `description` | `(remaining) => ReactNode` | required | Receives `{ totalSeconds, formatted }`. |
| `elapsed` | `ReactNode` | none | Shown instead of the description once time is up. |
| `onElapsed` | `() => void` | none | Fires exactly once when time is up (also on first render if `until` is already past). |
| `onRetry` | `() => void` | none | When given, a Retry button appears once time is up. |
| `labels` | `{ retry?: string }` | `{ retry: "Retry" }` | Button text. |
| `variant` | `"default" \| "destructive" \| "warning" \| "information"` | `"warning"` | Alert variant. |
| `className` | `string` | none | Merged onto the alert. |

Timing: it ticks once a second and recomputes the remaining time from `Date.now()` each tick, so a throttled background tab catches up on the next tick. The value never goes below zero, and the interval is cleared at zero and on unmount.

Accessibility: the ticking text is not a live region (the default `role="alert"` is removed so screen readers are not interrupted every second). The elapsed message is rendered inside a `role="status"` region. A status region that is inserted already filled is often not announced, so do not rely on it alone to tell the user time is up.

Server rendering: the server render and the first client render output only the title and an empty description slot, with no elapsed message or Retry button, so hydration always matches. The live remaining time (or the elapsed state) appears right after mount.

## Common mistakes

- Passing a duration instead of an end time. `until` is a moment (`Date.now() + 30_000`), not "30 seconds".
- Building a new `until` on every render (`new Date(Date.now() + 5000)` inline). The countdown restarts each render. Keep the end time in state.
- Doing work in `description`. It runs every second; keep it a pure formatter.
- Expecting `onRetry` to render a button before time is up. It appears only at zero.
