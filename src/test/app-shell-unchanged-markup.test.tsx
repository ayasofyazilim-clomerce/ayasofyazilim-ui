import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell, type AppShellNavGroup } from "../custom/app-shell";

/**
 * Pins the exact markup of an `AppShell` that uses none of the opt-in nav
 * features (folders, the sidebar filter, item actions, shortcuts). The
 * snapshots were captured on `main` at 0.3.0, before any of them existed, so a
 * diff here means a flat nav renders differently: the change has to go, not
 * the snapshot.
 *
 * Two normalisations keep the strings exact but stable:
 * - React's `useId` values (`_r_3_`) count up across every render in the file,
 *   so they depend on test order; they become `_r_ID_`.
 * - A newline goes between adjacent tags, so a diff points at one element.
 */

let mockIsMobile = false;

jest.mock("../custom/app-shell/use-app-shell-navigate", () => ({
  useAppShellNavigate: () => jest.fn(),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => "/playground/run-1",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }: React.ComponentProps<"a">) => (
    <a {...props}>{children}</a>
  ),
}));

jest.mock("../hooks/use-mobile", () => ({
  useIsMobile: () => mockIsMobile,
}));

beforeAll(() => {
  window.matchMedia =
    window.matchMedia ||
    ((query: string) =>
      ({
        matches: false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
        onchange: null,
      }) as unknown as MediaQueryList);
});

beforeEach(() => {
  mockIsMobile = false;
});

const markup = (element: Element) =>
  element.outerHTML.replace(/_r_[0-9a-z]+_/g, "_r_ID_").replace(/></g, ">\n<");

const NAV: AppShellNavGroup[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      {
        id: "playground",
        href: "/playground",
        label: "Playground",
        icon: <svg data-testid="icon-playground" />,
        dataAttributes: { "data-tour": "nav-playground" },
      },
      {
        id: "records",
        href: "/records",
        label: "Records",
        badge: <span>Preview</span>,
      },
    ],
  },
  {
    id: "configure",
    label: "Configure",
    items: [{ id: "projects", href: "/projects", label: "Projects" }],
  },
];

function renderShell() {
  return render(
    <AppShell
      nav={NAV}
      brand={<span>Brand</span>}
      userMenu={<button type="button">User</button>}
      breadcrumbs={[{ label: "Workspace" }, { label: "Playground" }]}
      pageTitle="Playground"
      commands={[
        { id: "dark", label: "Dark", group: "Theme", onSelect: () => {} },
      ]}
    >
      <p>Page body</p>
    </AppShell>
  );
}

describe("AppShell: markup without the opt-in nav features", () => {
  it("renders the desktop frame as in 0.3.0", () => {
    const { container } = renderShell();
    expect(markup(container.firstElementChild!)).toMatchInlineSnapshot(`
"<div data-slot="sidebar-wrapper" style="--sidebar-width: 16rem; --sidebar-width-icon: 3rem;" class="group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full">
<div class="group peer text-sidebar-foreground hidden md:block" data-state="expanded" data-collapsible="" data-variant="sidebar" data-side="left" data-slot="sidebar">
<div data-slot="sidebar-gap" class="relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear group-data-[collapsible=offcanvas]:w-0 group-data-[side=right]:rotate-180 group-data-[collapsible=icon]:w-(--sidebar-width-icon)">
</div>
<div data-slot="sidebar-container" class="fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l">
<div data-sidebar="sidebar" data-slot="sidebar-inner" class="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm">
<div data-slot="sidebar-header" data-sidebar="header" class="flex flex-col gap-2 p-2 min-h-16 justify-center border-b">
<span>Brand</span>
</div>
<div data-slot="sidebar-content" data-sidebar="content" class="flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden">
<nav aria-label="Main navigation" class="flex flex-col gap-2">
<div data-slot="sidebar-group" data-sidebar="group" class="relative flex w-full min-w-0 flex-col p-2">
<div data-slot="sidebar-group-label" data-sidebar="group-label" class="text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&amp;>svg]:size-4 [&amp;>svg]:shrink-0 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0" id="_r_ID_-group-0">Workspace</div>
<ul data-slot="sidebar-menu" data-sidebar="menu" class="flex w-full min-w-0 flex-col gap-1" aria-labelledby="_r_ID_-group-0">
<li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative">
<a data-tour="nav-playground" href="/playground" aria-current="page" data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size="default" data-active="true" class="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-hidden ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&amp;>span:last-child]:truncate [&amp;>svg]:size-4 [&amp;>svg]:shrink-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-8 text-sm" data-state="closed">
<span aria-hidden="true" class="flex size-4 shrink-0 items-center justify-center [&amp;>svg]:size-4">
<svg data-testid="icon-playground">
</svg>
</span>
<span>Playground</span>
</a>
</li>
<li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative">
<a href="/records" data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-hidden ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&amp;>span:last-child]:truncate [&amp;>svg]:size-4 [&amp;>svg]:shrink-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-8 text-sm" data-state="closed">
<span>Records</span>
</a>
<div data-slot="sidebar-menu-badge" data-sidebar="menu-badge" class="text-sidebar-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground peer-data-[size=sm]/menu-button:top-1 peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 group-data-[collapsible=icon]:hidden">
<span>Preview</span>
</div>
</li>
</ul>
</div>
<div data-slot="sidebar-group" data-sidebar="group" class="relative flex w-full min-w-0 flex-col p-2">
<div data-slot="sidebar-group-label" data-sidebar="group-label" class="text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&amp;>svg]:size-4 [&amp;>svg]:shrink-0 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0" id="_r_ID_-group-1">Configure</div>
<ul data-slot="sidebar-menu" data-sidebar="menu" class="flex w-full min-w-0 flex-col gap-1" aria-labelledby="_r_ID_-group-1">
<li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative">
<a href="/projects" data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-hidden ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&amp;>span:last-child]:truncate [&amp;>svg]:size-4 [&amp;>svg]:shrink-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-8 text-sm" data-state="closed">
<span>Projects</span>
</a>
</li>
</ul>
</div>
</nav>
</div>
<div data-slot="sidebar-footer" data-sidebar="footer" class="flex flex-col gap-2 p-2">
<button type="button">User</button>
</div>
<button data-sidebar="rail" data-slot="sidebar-rail" aria-label="Toggle Sidebar" tabindex="-1" title="Toggle Sidebar" class="hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 sm:flex in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize! [[data-side=left][data-state=collapsed]_&amp;]:cursor-e-resize [[data-side=right][data-state=collapsed]_&amp;]:cursor-w-resize hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full [[data-side=left][data-collapsible=offcanvas]_&amp;]:-right-2 [[data-side=right][data-collapsible=offcanvas]_&amp;]:-left-2">
</button>
</div>
</div>
</div>
<div data-slot="app-shell-frame" class="flex min-w-0 flex-1 flex-col">
<header data-slot="app-shell-header" class="bg-background sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4">
<button data-slot="sidebar-trigger" data-variant="ghost" data-size="icon" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 size-7 -ml-1" data-sidebar="trigger">
<svg data-lucide="PanelLeftIcon" data-testid="lucide-panel-left-icon">
<path d="M0 0">
</path>
</svg>
<span class="sr-only">Toggle Sidebar</span>
</button>
<div data-orientation="vertical" role="none" data-slot="separator" class="bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px mr-2 data-[orientation=vertical]:h-4">
</div>
<nav aria-label="Breadcrumb" data-slot="breadcrumb" class="min-w-0">
<ol data-slot="breadcrumb-list" class="text-muted-foreground flex items-center gap-1.5 text-sm wrap-break-word sm:gap-2.5 flex-nowrap">
<li data-slot="breadcrumb-item" class="items-center gap-1.5 min-w-0 hidden sm:inline-flex">
<span>Workspace</span>
</li>
<li data-slot="breadcrumb-separator" role="presentation" aria-hidden="true" class="[&amp;>svg]:size-3.5 hidden sm:block">
<svg data-lucide="ChevronRight" data-testid="lucide-chevron-right">
<path d="M0 0">
</path>
</svg>
</li>
<li data-slot="breadcrumb-item" class="inline-flex items-center gap-1.5 min-w-0">
<span data-slot="breadcrumb-page" role="link" aria-disabled="true" aria-current="page" class="text-foreground font-normal block truncate">Playground</span>
</li>
</ol>
</nav>
<h1 class="sr-only">Playground</h1>
<div class="ml-auto flex shrink-0 items-center gap-2">
<button data-slot="button" data-variant="outline" data-size="sm" class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg:not([class*='size-'])]:size-4 shrink-0 [&amp;_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-muted-foreground" type="button" aria-haspopup="dialog" aria-keyshortcuts="Meta+K Control+K">
<svg aria-hidden="true" class="size-4" data-lucide="SearchIcon" data-testid="lucide-search-icon">
<path d="M0 0">
</path>
</svg>
<span class="sr-only sm:not-sr-only">Search…</span>
<kbd data-slot="kbd" class="bg-muted text-muted-foreground pointer-events-none h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm px-1 font-sans text-xs font-medium select-none [&amp;_svg:not([class*='size-'])]:size-3 in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background dark:in-data-[slot=tooltip-content]:bg-background/10 hidden sm:inline-flex" aria-hidden="true">⌘K</kbd>
</button>
</div>
</header>
<main data-slot="sidebar-inset" class="bg-background relative flex w-full flex-1 flex-col md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2">
<p>Page body</p>
</main>
</div>
</div>"
`);
  });

  it("renders the ⌘K dialog as in 0.3.0", async () => {
    renderShell();
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "k",
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        })
      );
    });
    const dialog = await screen.findByRole("dialog", { name: "Command menu" });
    expect(markup(dialog)).toMatchInlineSnapshot(`
"<div role="dialog" id="radix-_r_ID_" data-state="open" data-slot="dialog-content" class="bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border shadow-lg duration-200 sm:max-w-lg overflow-hidden p-0" tabindex="-1" aria-labelledby="radix-_r_ID_" aria-describedby="radix-_r_ID_" style="pointer-events: auto;">
<div data-slot="dialog-header" class="flex flex-col gap-2 text-center sm:text-left sr-only">
<h2 id="radix-_r_ID_" data-slot="dialog-title" class="text-lg leading-none font-semibold">Command menu</h2>
<p id="radix-_r_ID_" data-slot="dialog-description" class="text-muted-foreground text-sm">Search pages and commands…</p>
</div>
<div tabindex="-1" data-slot="command" class="bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md **:[[cmdk-group-heading]]:text-muted-foreground **:data-[slot=command-input-wrapper]:h-12 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group]]:px-2 [&amp;_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&amp;_[cmdk-input-wrapper]_svg]:h-5 [&amp;_[cmdk-input-wrapper]_svg]:w-5 **:[[cmdk-input]]:h-12 **:[[cmdk-item]]:px-2 **:[[cmdk-item]]:py-3 [&amp;_[cmdk-item]_svg]:h-5 [&amp;_[cmdk-item]_svg]:w-5" cmdk-root="">
<label cmdk-label="" for="radix-_r_ID_" id="radix-_r_ID_" style="position: absolute; width: 1px; height: 1px; padding: 0px; margin: -1px; overflow: hidden; clip: rect(0px, 0px, 0px, 0px); white-space: nowrap; border-width: 0px;">Search pages and commands…</label>
<div data-slot="command-input-wrapper" class="flex h-9 items-center gap-2 border-b px-3">
<svg class="size-4 shrink-0 opacity-50" data-lucide="SearchIcon" data-testid="lucide-search-icon">
<path d="M0 0">
</path>
</svg>
<input data-slot="command-input" class="placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50" placeholder="Search pages and commands…" cmdk-input="" autocomplete="off" autocorrect="off" spellcheck="false" aria-autocomplete="list" role="combobox" aria-expanded="true" aria-controls="radix-_r_ID_" aria-labelledby="radix-_r_ID_" id="radix-_r_ID_" type="text" value="">
</div>
<div data-slot="command-list" class="max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto" cmdk-list="" role="listbox" tabindex="-1" aria-label="Command menu" id="radix-_r_ID_">
<div cmdk-list-sizer="">
<div data-slot="command-group" class="text-foreground **:[[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium" cmdk-group="" role="presentation" data-value="Workspace">
<div cmdk-group-heading="" aria-hidden="true" id="radix-_r_ID_">Workspace</div>
<div cmdk-group-items="" role="group" aria-labelledby="radix-_r_ID_">
<div data-slot="command-item" class="data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&amp;_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:shrink-0 [&amp;_svg:not([class*='size-'])]:size-4" id="radix-_r_ID_" cmdk-item="" role="option" aria-disabled="false" aria-selected="true" data-disabled="false" data-selected="true" data-value="Workspace Playground">
<span aria-hidden="true" class="flex size-4 shrink-0 items-center justify-center [&amp;>svg]:size-4">
<svg data-testid="icon-playground">
</svg>
</span>
<span class="truncate">Playground</span>
</div>
<div data-slot="command-item" class="data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&amp;_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:shrink-0 [&amp;_svg:not([class*='size-'])]:size-4" id="radix-_r_ID_" cmdk-item="" role="option" aria-disabled="false" aria-selected="false" data-disabled="false" data-selected="false" data-value="Workspace Records">
<span class="truncate">Records</span>
<span class="ml-auto">
<span>Preview</span>
</span>
</div>
</div>
</div>
<div data-slot="command-group" class="text-foreground **:[[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium" cmdk-group="" role="presentation" data-value="Configure">
<div cmdk-group-heading="" aria-hidden="true" id="radix-_r_ID_">Configure</div>
<div cmdk-group-items="" role="group" aria-labelledby="radix-_r_ID_">
<div data-slot="command-item" class="data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&amp;_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:shrink-0 [&amp;_svg:not([class*='size-'])]:size-4" id="radix-_r_ID_" cmdk-item="" role="option" aria-disabled="false" aria-selected="false" data-disabled="false" data-selected="false" data-value="Configure Projects">
<span class="truncate">Projects</span>
</div>
</div>
</div>
<div data-slot="command-group" class="text-foreground **:[[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium" cmdk-group="" role="presentation" data-value="Theme">
<div cmdk-group-heading="" aria-hidden="true" id="radix-_r_ID_">Theme</div>
<div cmdk-group-items="" role="group" aria-labelledby="radix-_r_ID_">
<div data-slot="command-item" class="data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&amp;_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:shrink-0 [&amp;_svg:not([class*='size-'])]:size-4" id="radix-_r_ID_" cmdk-item="" role="option" aria-disabled="false" aria-selected="false" data-disabled="false" data-selected="false" data-value="Theme Dark">
<span class="truncate">Dark</span>
</div>
</div>
</div>
</div>
</div>
</div>
<button type="button" data-slot="dialog-close" class="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&amp;_svg]:pointer-events-none [&amp;_svg]:shrink-0 [&amp;_svg:not([class*='size-'])]:size-4">
<svg data-lucide="XIcon" data-testid="lucide-x-icon">
<path d="M0 0">
</path>
</svg>
<span class="sr-only">Close</span>
</button>
</div>"
`);
  });

  it("renders the mobile sheet as in 0.3.0", async () => {
    mockIsMobile = true;
    renderShell();
    await userEvent.click(
      document.querySelector('[data-slot="sidebar-trigger"]') as HTMLElement
    );
    const sheet = screen.getByRole("dialog", { name: "Navigation" });
    expect(markup(sheet)).toMatchInlineSnapshot(`
"<div role="dialog" id="radix-_r_ID_" data-state="open" data-slot="sidebar" class="data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full border-r sm:max-w-sm group/sidebar bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&amp;>button]:hidden" data-sidebar="sidebar" data-mobile="true" style="--sidebar-width: 18rem; pointer-events: auto;" tabindex="-1" aria-labelledby="radix-_r_ID_" aria-describedby="radix-_r_ID_">
<div data-slot="sheet-header" class="flex flex-col gap-1.5 sr-only">
<h2 id="radix-_r_ID_" data-slot="sheet-title" class="text-foreground font-semibold">Navigation</h2>
<p id="radix-_r_ID_" data-slot="sheet-description" class="text-muted-foreground text-sm">Main navigation</p>
</div>
<div class="flex h-full w-full flex-col">
<div data-slot="sidebar-header" data-sidebar="header" class="flex flex-col gap-2 p-2 min-h-16 justify-center border-b">
<span>Brand</span>
</div>
<div data-slot="sidebar-content" data-sidebar="content" class="flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden">
<nav aria-label="Main navigation" class="flex flex-col gap-2">
<div data-slot="sidebar-group" data-sidebar="group" class="relative flex w-full min-w-0 flex-col p-2">
<div data-slot="sidebar-group-label" data-sidebar="group-label" class="text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&amp;>svg]:size-4 [&amp;>svg]:shrink-0 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0" id="_r_ID_-group-0">Workspace</div>
<ul data-slot="sidebar-menu" data-sidebar="menu" class="flex w-full min-w-0 flex-col gap-1" aria-labelledby="_r_ID_-group-0">
<li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative">
<a data-tour="nav-playground" href="/playground" aria-current="page" data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size="default" data-active="true" class="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-hidden ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&amp;>span:last-child]:truncate [&amp;>svg]:size-4 [&amp;>svg]:shrink-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-8 text-sm" data-state="closed">
<span aria-hidden="true" class="flex size-4 shrink-0 items-center justify-center [&amp;>svg]:size-4">
<svg data-testid="icon-playground">
</svg>
</span>
<span>Playground</span>
</a>
</li>
<li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative">
<a href="/records" data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-hidden ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&amp;>span:last-child]:truncate [&amp;>svg]:size-4 [&amp;>svg]:shrink-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-8 text-sm" data-state="closed">
<span>Records</span>
</a>
<div data-slot="sidebar-menu-badge" data-sidebar="menu-badge" class="text-sidebar-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground peer-data-[size=sm]/menu-button:top-1 peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 group-data-[collapsible=icon]:hidden">
<span>Preview</span>
</div>
</li>
</ul>
</div>
<div data-slot="sidebar-group" data-sidebar="group" class="relative flex w-full min-w-0 flex-col p-2">
<div data-slot="sidebar-group-label" data-sidebar="group-label" class="text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&amp;>svg]:size-4 [&amp;>svg]:shrink-0 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0" id="_r_ID_-group-1">Configure</div>
<ul data-slot="sidebar-menu" data-sidebar="menu" class="flex w-full min-w-0 flex-col gap-1" aria-labelledby="_r_ID_-group-1">
<li data-slot="sidebar-menu-item" data-sidebar="menu-item" class="group/menu-item relative">
<a href="/projects" data-slot="sidebar-menu-button" data-sidebar="menu-button" data-size="default" data-active="false" class="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left outline-hidden ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&amp;>span:last-child]:truncate [&amp;>svg]:size-4 [&amp;>svg]:shrink-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-8 text-sm" data-state="closed">
<span>Projects</span>
</a>
</li>
</ul>
</div>
</nav>
</div>
<div data-slot="sidebar-footer" data-sidebar="footer" class="flex flex-col gap-2 p-2">
<button type="button">User</button>
</div>
<button data-sidebar="rail" data-slot="sidebar-rail" aria-label="Toggle Sidebar" tabindex="-1" title="Toggle Sidebar" class="hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 sm:flex in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize! [[data-side=left][data-state=collapsed]_&amp;]:cursor-e-resize [[data-side=right][data-state=collapsed]_&amp;]:cursor-w-resize hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full [[data-side=left][data-collapsible=offcanvas]_&amp;]:-right-2 [[data-side=right][data-collapsible=offcanvas]_&amp;]:-left-2">
</button>
</div>
<button type="button" class="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
<svg class="size-4" data-lucide="XIcon" data-testid="lucide-x-icon">
<path d="M0 0">
</path>
</svg>
<span class="sr-only">Close</span>
</button>
</div>"
`);
  });
});
