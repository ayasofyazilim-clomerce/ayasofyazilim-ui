# Primitive labels

The primitives in `@repo/ayasofyazilim-ui/components/*` accept optional props for the English text they used to hardcode. Every default is today's exact English, so a consumer that passes none of them gets the same DOM.

## When to use

- The app is localized and a primitive would otherwise show or announce English ("Close", "Previous", "Toggle Sidebar").
- Pass translated strings from the consumer's own i18n layer. The library itself does no translation.

## Minimal example

```tsx
import { DialogContent } from "@repo/ayasofyazilim-ui/components/dialog";
import {
  PaginationNext,
  PaginationPrevious,
} from "@repo/ayasofyazilim-ui/components/pagination";

<DialogContent closeLabel={t("Close")}>...</DialogContent>;
<PaginationPrevious href="?page=1" label={t("Previous")} />;
<PaginationNext href="?page=3" label={t("Next")} />;
```

## Props

| Component | Prop | Default | Rendered as |
|---|---|---|---|
| `DialogContent` | `closeLabel` | `"Close"` | sr-only text of the close button |
| `SheetContent` | `closeLabel` | `"Close"` | sr-only text of the close button |
| `SidebarTrigger` | `label` | `"Toggle Sidebar"` | sr-only text |
| `Sidebar` (mobile sheet) | `mobileTitle` | `"Sidebar"` | sr-only sheet title |
| `Sidebar` (mobile sheet) | `mobileDescription` | `"Displays the mobile sidebar."` | sr-only sheet description |
| `PaginationPrevious` | `label` | `"Previous"` | visible text |
| `PaginationNext` | `label` | `"Next"` | visible text |
| `PaginationEllipsis` | `label` | `"More pages"` | sr-only text |
| `BreadcrumbEllipsis` | `label` | `"More"` | sr-only text |
| `CarouselPrevious` | `label` | `"Previous slide"` | sr-only text |
| `CarouselNext` | `label` | `"Next slide"` | sr-only text |
| `Carousel` | `roleDescription` | `"carousel"` | `aria-roledescription` |
| `CarouselItem` | `roleDescription` | `"slide"` | `aria-roledescription` |
| `TourProvider` | `closeLabel` | `"Close"` | `aria-label` of the close button (it had none before) |

`Pagination` and `Breadcrumb` keep their default `aria-label`s (`"pagination"`, `"breadcrumb"`); a passed `aria-label` replaces them.

`PaginationPrevious` and `PaginationNext` also keep their `aria-label`s ("Go to previous page", "Go to next page"), which can be overridden the same way.

## Common mistakes

- Translating the visible `label` of `PaginationPrevious` but leaving its `aria-label` in English. Pass both.
- Passing a label to the wrong component: the Sidebar's mobile title is `mobileTitle` on `Sidebar`, not `label` on `SidebarTrigger`.
- Expecting the tour's `closeLabel` per step. It is a `TourProvider` prop and applies to every step.
