# Icons

The icon set from `@repo/ayasofyazilim-ui/custom/icons` is one inline-SVG component per brand or platform. This page covers the AI-provider and Docker marks: `IconOpenAI`, `IconAnthropic`, `IconGemini`, `IconVertexAI`, `IconAzure`, `IconBedrock`, `IconCohere`, `IconMistral`, `IconGroq`, `IconDeepSeek`, `IconXAI`, `IconHuggingFace`, `IconNvidia`, `IconOllama`, `IconVllm` and `IconDocker`.

## When to use

- Identify a model vendor or runtime next to a provider name, a connection row or a picker option.
- Show the Docker mark for container-based deployment or an image source.
- Not for decoration or to imply the vendor endorses your product.

## Minimal example

```tsx
import { IconAnthropic, IconDocker } from "@repo/ayasofyazilim-ui/custom/icons";

<IconAnthropic className="size-5 text-foreground" />
<IconDocker className="size-5" aria-hidden />
```

## Props

Each mark takes `IconType`: every `SVGProps<SVGSVGElement>` plus an optional `colorful`.

| Prop | Default | Purpose |
| --- | --- | --- |
| `className`, `width`, `height`, ... | none | Forwarded to the `<svg>` |
| `colorful` | ignored | Accepted for signature parity with the older icons. These marks are mono only; it is never set on the `<svg>` |

Every mark is a 24x24 `viewBox` painted with `fill="currentColor"`, so the surrounding text colour decides its colour. It has `role="img"` and a `<title>` carrying the brand name (proper nouns, not translated). Pass `aria-hidden` when the brand name is already written beside it.

Sources and licences:

- AI providers: single-colour marks from [lobe-icons](https://github.com/lobehub/lobe-icons), MIT, (c) 2023 LobeHub. The notice is kept at the top of `src/custom/icons/ai-providers.tsx`.
- Docker: [Simple Icons](https://github.com/simple-icons/simple-icons) 16.37.0, CC0-1.0.
- All marks remain trademarks of their owners and imply no affiliation or endorsement.

## Common mistakes

- Expecting `colorful="true"` to give a brand-colour version. These marks are mono only.
- Setting a fixed `fill` on the mark. Use a text colour class instead.
- Omitting `aria-hidden` when the brand name is already printed beside the icon, so it is read twice.
- Using a mark to suggest a partnership with the vendor.
