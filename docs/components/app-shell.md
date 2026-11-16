# AppShell

`AppShell` from `@repo/ayasofyazilim-ui/custom/app-shell` is the frame around an app's signed-in pages: a sidebar of grouped links that collapses to an icon rail (an off-canvas sheet on mobile), a header with a breadcrumb and a search button, a ⌘K / Ctrl+K command menu over the same links plus extra commands, and a slot for the user menu. It is a client component built on `components/sidebar`, `components/breadcrumb` and `components/command`. Every text arrives through props; the library translates nothing.

## When to use

- The frame of a Next.js App Router app, rendered once in the layout that wraps the signed-in pages.
- A nav made of a few groups of flat links. Nested trees, per-item actions and a search box inside the sidebar are out of scope.

## Minimal example

The layout reads the saved sidebar state on the server, so the first paint shows the sidebar as the user left it:

```tsx
// app/(app)/layout.tsx
import { cookies } from "next/headers";
import { Frame } from "./frame";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const saved = (await cookies()).get("sidebar_state_app-shell")?.value;
  return <Frame defaultOpen={saved !== "false"}>{children}</Frame>;
}
```

```tsx
// app/(app)/frame.tsx
"use client";

import {
  AppShell,
  type AppShellNavGroup,
} from "@repo/ayasofyazilim-ui/custom/app-shell";
import { Badge } from "@repo/ayasofyazilim-ui/components/badge";
import { FileTextIcon, PlayIcon } from "lucide-react";

export function Frame({
  defaultOpen,
  children,
}: {
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const t = useT(); // the app's own translation function
  const nav: AppShellNavGroup[] = [
    {
      id: "workspace",
      label: t("Workspace"),
      items: [
        {
          id: "playground",
          href: "/playground",
          label: t("Playground"),
          icon: <PlayIcon />,
        },
        {
          id: "records",
          href: "/records",
          label: t("Records"),
          icon: <FileTextIcon />,
          badge: <Badge size="sm">{t("Preview")}</Badge>,
          dataAttributes: { "data-tour": "nav-records" },
        },
      ],
    },
  ];

  return (
    <AppShell
      nav={nav}
      brand={<Logo />}
      userMenu={<UserMenu />}
      breadcrumbs={[{ label: t("Workspace") }, { label: t("Playground") }]}
      pageTitle={t("Playground")}
      commands={[
        {
          id: "sign-out",
          label: t("Sign out"),
          group: t("Account"),
          onSelect: signOut,
        },
      ]}
      defaultOpen={defaultOpen}
      labels={{
        search: t("Search…"),
        commandTitle: t("Command menu"),
        // …and the other seven keys, so no English default shows
      }}
    >
      {children}
    </AppShell>
  );
}
```

## Props

| Prop            | Type                                          | Default           | Notes                                                                                                                                                                            |
| --------------- | --------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `nav`           | `AppShellNavGroup[]`                          | required          | `{ id, label, items }`. One sidebar group and one ⌘K group each, in order. A group with no items is left out.                                                                    |
| `brand`         | `ReactNode`                                   | required          | Sidebar header. It stays visible in the icon rail, so it must fit 2rem when collapsed.                                                                                           |
| `userMenu`      | `ReactNode`                                   | required          | Sidebar footer. Sidebar parts inside it take `name="app-shell"`.                                                                                                                 |
| `breadcrumbs`   | `AppShellBreadcrumb[]`                        | none              | `{ label, href? }`. The last crumb is the current page (`aria-current="page"`, never a link); the others are links when they have an `href`. Below `sm` only the last one shows. |
| `pageTitle`     | `string`                                      | none              | A visually hidden `<h1>` in the header.                                                                                                                                          |
| `headerActions` | `ReactNode`                                   | none              | Right side of the header, before the search button.                                                                                                                              |
| `commands`      | `AppShellCommand[]`                           | `[]`              | `{ id, label, group, icon?, keywords?, onSelect }`. Listed in ⌘K after the nav groups, grouped by `group` in first-seen order. `keywords` are extra search terms.                |
| `defaultOpen`   | `boolean`                                     | `true`            | The sidebar's state on the first render, server included.                                                                                                                        |
| `onOpenChange`  | `(open: boolean) => void`                     | none              | Called after each sidebar change, and also when the mobile sheet opens or closes (with the unchanged value). The library has already written the cookie.                         |
| `isActive`      | `(href: string, pathname: string) => boolean` | `matchActiveHref` | Decides the highlighted item. Without it, the item whose `href` is the longest whole-segment prefix of the path is highlighted.                                                  |
| `onNavigate`    | `(href: string) => void`                      | `router.push`     | Called with the `href` of a nav item chosen in ⌘K, in place of `router.push(href)`. Use it to ask before leaving a page with unsaved work. Commands and links do not call it.    |
| `labels`        | `AppShellLabels`                              | English           | See below. Each key falls back to its own default.                                                                                                                               |
| `className`     | `string`                                      | none              | Merged onto the outer wrapper.                                                                                                                                                   |
| `classNames`    | `{ sidebar?, header?, main? }`                | none              | Merged onto the sidebar container, the `<header>` and the `<main>`.                                                                                                              |
| `children`      | `ReactNode`                                   | required          | The page, inside `<main>`.                                                                                                                                                       |

`AppShellNavItem` is `{ id, href, label, icon?, badge?, dataAttributes? }`. `icon` is an element (`<PlayIcon />`), rendered at 16px and hidden from assistive technology. `badge` sits at the right of the label in the sidebar (hidden in the icon rail) and in ⌘K. `dataAttributes` (`{ "data-tour": "…" }`) are spread onto the sidebar link. The active link gets `data-active="true"` and `aria-current="page"`. On mobile, choosing a link closes the sheet.

| `labels` key         | Default                        | Used for                                                                |
| -------------------- | ------------------------------ | ----------------------------------------------------------------------- |
| `toggleSidebar`      | `"Toggle Sidebar"`             | Header trigger (sr-only) and the sidebar rail (`aria-label`).           |
| `search`             | `"Search…"`                    | Search button.                                                          |
| `commandTitle`       | `"Command menu"`               | ⌘K dialog title (its accessible name) and its result list's label.      |
| `commandPlaceholder` | `"Search pages and commands…"` | ⌘K input placeholder and accessible name, and the dialog's description. |
| `commandEmpty`       | `"No results."`                | ⌘K empty state.                                                         |
| `breadcrumb`         | `"Breadcrumb"`                 | Breadcrumb `<nav>` `aria-label`.                                        |
| `navigation`         | `"Main navigation"`            | Sidebar `<nav>` `aria-label` and the mobile sheet description.          |
| `close`              | `"Close"`                      | ⌘K close button.                                                        |
| `mobileTitle`        | `"Navigation"`                 | Mobile sheet title.                                                     |

The primitives' own English defaults never reach the page: the ⌘K dialog's description, its input's name and its list's label, and the mobile sheet's description all reuse the keys above.

Keyboard: ⌘K and Ctrl+K open the menu from anywhere, text fields included; the search button does too. ⌘B / Ctrl+B toggles the sidebar, except while typing in a text field.

Also exported from the same path:

- `matchActiveHref(hrefs, pathname)`: the default active-item rule. It returns the `href` (exactly as given) that is the longest whole-segment prefix of `pathname`, or `null`. `/playground` matches `/playground/x` but not `/playground-x`; query strings, hashes and trailing slashes are ignored; `/` matches only `/`.
- `useAppShellNavigate()`: `(href) => router.push(href)`, the navigation the ⌘K menu uses when no `onNavigate` is given. An `onNavigate` that decides to go ahead calls it (or its own `router.push`).
- The types `AppShellProps`, `AppShellNavGroup`, `AppShellNavItem`, `AppShellCommand`, `AppShellBreadcrumb` and `AppShellLabels`.

## Common mistakes

- **Reading the wrong cookie.** The sidebar is named `app-shell`, so its state is in `sidebar_state_app-shell` (`"true"` or `"false"`). A missing cookie means open. Not passing it as `defaultOpen` makes a collapsed sidebar flash open on every load.
- **Calling `matchActiveHref` from a Server Component through `@repo/ayasofyazilim-ui/custom/app-shell`.** That entry is a client module, so its non-component exports are client references on the server. Import it from `@repo/ayasofyazilim-ui/custom/app-shell/match-active-href` instead.
- **Guarding only links against unsaved work.** The sidebar and breadcrumb are `<Link>`s, but a nav item chosen in ⌘K navigates with `router.push`, so no link is clicked. Pass `onNavigate` and ask there too, then navigate only when the user agrees.
- **Expecting aliases to highlight on their own.** A route that should highlight another item (`/runs` for a Traces item) needs `isActive`.
- **Binding ⌘K or Ctrl+K in a page.** The shell claims it on `document` and prevents the default, so a page's own binding fights it. Give the page another key.
- **Passing the icon component instead of an element.** `icon={<PlayIcon />}`, not `icon={PlayIcon}`.
- **Repeating a label within a group.** ⌘K matches and selects entries by group label plus item label, so two entries with the same pair highlight together.
- **Long badges next to long labels.** The sidebar badge sits over the right edge of the link; keep it short (`Badge size="sm"`).
