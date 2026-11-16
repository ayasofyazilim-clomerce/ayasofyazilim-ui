import React from "react";
import { renderToString } from "react-dom/server";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell, type AppShellProps } from "../custom/app-shell";

const mockNavigate = jest.fn();
let mockPathname = "/playground";
let mockIsMobile = false;

jest.mock("../custom/app-shell/use-app-shell-navigate", () => ({
  useAppShellNavigate: () => mockNavigate,
}));

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

// Like the real next/link, a click is handled in the page: the default
// (a full navigation, which jsdom cannot do) is prevented.
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, onClick, ...props }: React.ComponentProps<"a">) => (
    <a
      {...props}
      onClick={(event) => {
        onClick?.(event);
        event.preventDefault();
      }}
    >
      {children}
    </a>
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
  mockPathname = "/playground";
  mockIsMobile = false;
});

function renderShell(props: Partial<AppShellProps> = {}) {
  return render(
    <AppShell
      nav={[
        {
          id: "workspace",
          label: "Workspace",
          items: [
            { id: "playground", href: "/playground", label: "Playground" },
          ],
        },
      ]}
      brand={<span>Brand</span>}
      userMenu={<button type="button">User</button>}
      {...props}
    >
      <p>Page body</p>
    </AppShell>,
  );
}

const BREADCRUMBS = [{ label: "Studio", href: "/" }, { label: "Playground" }];

describe("AppShell headerContent", () => {
  it("leaves the header markup unchanged when headerContent is absent", () => {
    const { container } = renderShell({
      breadcrumbs: BREADCRUMBS,
      pageTitle: "Playground",
      headerActions: <span>Actions</span>,
    });
    expect(container.querySelector("header")).toMatchInlineSnapshot(`
     <header
       class="bg-background sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4"
       data-slot="app-shell-header"
     >
       <button
         class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 size-7 -ml-1"
         data-sidebar="trigger"
         data-size="icon"
         data-slot="sidebar-trigger"
         data-variant="ghost"
       >
         <svg
           data-lucide="PanelLeftIcon"
           data-testid="lucide-panel-left-icon"
         >
           <path
             d="M0 0"
           />
         </svg>
         <span
           class="sr-only"
         >
           Toggle Sidebar
         </span>
       </button>
       <div
         class="bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px mr-2 data-[orientation=vertical]:h-4"
         data-orientation="vertical"
         data-slot="separator"
         role="none"
       />
       <nav
         aria-label="Breadcrumb"
         class="min-w-0"
         data-slot="breadcrumb"
       >
         <ol
           class="text-muted-foreground flex items-center gap-1.5 text-sm wrap-break-word sm:gap-2.5 flex-nowrap"
           data-slot="breadcrumb-list"
         >
           <li
             class="items-center gap-1.5 min-w-0 hidden sm:inline-flex"
             data-slot="breadcrumb-item"
           >
             <a
               class="hover:text-foreground transition-colors"
               data-slot="breadcrumb-link"
               href="/"
             >
               Studio
             </a>
           </li>
           <li
             aria-hidden="true"
             class="[&>svg]:size-3.5 hidden sm:block"
             data-slot="breadcrumb-separator"
             role="presentation"
           >
             <svg
               data-lucide="ChevronRight"
               data-testid="lucide-chevron-right"
             >
               <path
                 d="M0 0"
               />
             </svg>
           </li>
           <li
             class="inline-flex items-center gap-1.5 min-w-0"
             data-slot="breadcrumb-item"
           >
             <span
               aria-current="page"
               aria-disabled="true"
               class="text-foreground font-normal block truncate"
               data-slot="breadcrumb-page"
               role="link"
             >
               Playground
             </span>
           </li>
         </ol>
       </nav>
       <h1
         class="sr-only"
       >
         Playground
       </h1>
       <div
         class="ml-auto flex shrink-0 items-center gap-2"
       >
         <span>
           Actions
         </span>
         <button
           aria-haspopup="dialog"
           aria-keyshortcuts="Meta+K Control+K"
           class="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-muted-foreground"
           data-size="sm"
           data-slot="button"
           data-variant="outline"
           type="button"
         >
           <svg
             aria-hidden="true"
             class="size-4"
             data-lucide="SearchIcon"
             data-testid="lucide-search-icon"
           >
             <path
               d="M0 0"
             />
           </svg>
           <span
             class="sr-only sm:not-sr-only"
           >
             Search…
           </span>
           <kbd
             aria-hidden="true"
             class="bg-muted text-muted-foreground pointer-events-none h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm px-1 font-sans text-xs font-medium select-none [&_svg:not([class*='size-'])]:size-3 in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background dark:in-data-[slot=tooltip-content]:bg-background/10 hidden sm:inline-flex"
             data-slot="kbd"
           >
             ⌘K
           </kbd>
         </button>
       </div>
     </header>
    `);
  });

  it("renders headerContent after the breadcrumb and before headerActions", () => {
    renderShell({
      breadcrumbs: BREADCRUMBS,
      headerActions: <span>Actions</span>,
      headerContent: <span data-testid="content">Content</span>,
    });
    const content = screen.getByTestId("content");
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
    const actions = screen.getByText("Actions");
    expect(
      crumbs.compareDocumentPosition(content) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      content.compareDocumentPosition(actions) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(content.parentElement).toHaveClass(
      "min-w-0",
      "flex-1",
      "flex",
      "items-center",
      "gap-2",
    );
  });
});
