# LanguageSwitcher

`LanguageSwitcher` from `@repo/ayasofyazilim-ui/custom/language-switcher` is a select that shows a flag and label for each language and reports the chosen code.

## When to use

- Switching the UI language from a header or settings page.
- Flags are whatever nodes you pass (emoji, inline SVG, bundled images). The component never loads a remote asset.
- It renders nothing when fewer than two languages are given.

## Minimal example

```tsx
import { LanguageSwitcher } from "@repo/ayasofyazilim-ui/custom/language-switcher";

<LanguageSwitcher
  languages={[
    { code: "en", label: "English", flag: <span>🇬🇧</span> },
    { code: "tr", label: "Türkçe", flag: <span>🇹🇷</span> },
  ]}
  value={locale}
  onValueChange={setLocale}
/>;
```

## Props

| Prop            | Type                               | Default      | Notes                                        |
| --------------- | ---------------------------------- | ------------ | -------------------------------------------- |
| `languages`     | `LanguageOption[]`                 | required     | `{ code, label, flag? }`                     |
| `value`         | `string`                           | required     | Current code; an unknown code is shown as is |
| `onValueChange` | `(code: string) => void`           | required     | Called with the chosen code                  |
| `labels`        | `{ trigger?: string }`             | `"Language"` | Accessible name of the trigger               |
| `disabled`      | `boolean`                          | `false`      |                                              |
| `className`     | `string`                           |              | Applied to the trigger                       |

## Common mistakes

- Passing `<img src="https://...">` flags. That breaks the studio CSP; bundle the asset or use emoji/SVG.
- Expecting a single-language list to render a disabled select. It renders nothing.
- Forgetting to translate `labels.trigger` for non-English UIs.
