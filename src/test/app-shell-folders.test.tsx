import React from "react";
import { renderToString } from "react-dom/server";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AppShell,
  type AppShellLabels,
  type AppShellNavGroup,
  type AppShellProps,
} from "../custom/app-shell";

const mockNavigate = jest.fn();
let mockPathname = "/operations/refunds/open/7";
let mockIsMobile = false;

jest.mock("../custom/app-shell/use-app-shell-navigate", () => ({
  useAppShellNavigate: () => mockNavigate,
}));

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

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
  mockPathname = "/operations/refunds/open/7";
  mockIsMobile = false;
  mockNavigate.mockReset();
});

/** Three levels: group → folder → sub-folder → link, as products use. */
const NAV: AppShellNavGroup[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      { id: "dashboard", href: "/dashboard", label: "Dashboard" },
      {
        id: "operations",
        label: "Operations",
        icon: <svg data-testid="icon-operations" />,
        dataAttributes: { "data-testid": "nav-operations" },
        items: [
          {
            id: "refunds",
            label: "Refunds",
            items: [
              {
                id: "open-refunds",
                href: "/operations/refunds/open",
                label: "Open refunds",
              },
              {
                id: "closed-refunds",
                href: "/operations/refunds/closed",
                label: "Closed refunds",
                keywords: ["archive"],
              },
            ],
          },
          {
            id: "invoices",
            href: "/operations/invoices",
            label: "Invoices",
          },
        ],
      },
      {
        id: "reports",
        href: "/reports",
        label: "Reports",
        badge: <span>New</span>,
        items: [{ id: "monthly", href: "/reports/monthly", label: "Monthly" }],
      },
      { id: "empty-folder", label: "Empty folder", items: [] },
      {
        id: "ghost-folder",
        label: "Ghost folder",
        items: [{ id: "ghost-child", label: "Ghost child", items: [] }],
      },
    ],
  },
  {
    id: "places",
    label: "Places",
    items: [
      {
        id: "cities",
        label: "Cities",
        items: [
          { id: "istanbul", href: "/places/istanbul", label: "İstanbul" },
          { id: "ankara", href: "/places/ankara", label: "Ankara" },
        ],
      },
    ],
  },
  {
    id: "hidden",
    label: "Only empty folders",
    items: [{ id: "nothing", label: "Nothing", items: [] }],
  },
];

function shell(props: Partial<AppShellProps> = {}) {
  return (
    <AppShell
      nav={NAV}
      brand={<span>Brand</span>}
      userMenu={<button type="button">User</button>}
      {...props}
    >
      <p>Page body</p>
    </AppShell>
  );
}

function renderShell(props: Partial<AppShellProps> = {}) {
  return render(shell(props));
}

const sidebarNav = () =>
  screen.getByRole("navigation", { name: "Main navigation" });
const folder = (name: string) =>
  within(sidebarNav()).getByRole("button", { name });
const link = (name: string) => within(sidebarNav()).getByRole("link", { name });
const queryLink = (name: string) =>
  within(sidebarNav()).queryByRole("link", { name });
const filterBox = () => screen.getByRole("searchbox", { name: "Filter menu…" });
const sidebarState = () =>
  document.querySelector('[data-slot="sidebar"]')?.getAttribute("data-state");

describe("AppShell folders: tree", () => {
  it("opens the folders above the active page, three levels deep", () => {
    renderShell();
    expect(folder("Operations")).toHaveAttribute("aria-expanded", "true");
    expect(folder("Refunds")).toHaveAttribute("aria-expanded", "true");
    const open = link("Open refunds");
    expect(open).toHaveAttribute("href", "/operations/refunds/open");
    expect(open).toHaveAttribute("aria-current", "page");
    expect(open).toHaveAttribute("data-active", "true");
    expect(link("Closed refunds")).not.toHaveAttribute("aria-current");
    expect(link("Invoices")).toBeInTheDocument();
    // Reports is not above the page, so it stays closed.
    expect(folder("Reports")).toHaveAttribute("aria-expanded", "false");
    expect(queryLink("Monthly")).not.toBeInTheDocument();
    expect(folder("Cities")).toHaveAttribute("aria-expanded", "false");
  });

  it("renders the open folders in the server HTML", () => {
    const html = renderToString(shell());
    expect(html).toContain('href="/operations/refunds/open"');
    expect(html).toContain('aria-current="page"');
    expect(html).not.toContain('href="/reports/monthly"');
  });

  it("nests each folder's items in a list under its toggle", () => {
    renderShell();
    const operations = folder("Operations");
    const content = document.getElementById(
      operations.getAttribute("aria-controls") as string
    );
    expect(content).not.toBeNull();
    expect(
      within(content as HTMLElement).getByRole("link", { name: "Invoices" })
    ).toBeInTheDocument();
    expect(operations.closest("li")).toContainElement(content);
    // The icon stays decorative and dataAttributes reach the toggle.
    expect(operations).toHaveAttribute("data-testid", "nav-operations");
    expect(
      screen.getByTestId("icon-operations").closest('[aria-hidden="true"]')
    ).not.toBeNull();
  });

  it("opens and closes a folder on click", async () => {
    renderShell();
    await userEvent.click(folder("Cities"));
    expect(folder("Cities")).toHaveAttribute("aria-expanded", "true");
    expect(link("İstanbul")).toHaveAttribute("href", "/places/istanbul");
    await userEvent.click(folder("Cities"));
    expect(folder("Cities")).toHaveAttribute("aria-expanded", "false");
    expect(queryLink("İstanbul")).not.toBeInTheDocument();
  });

  it("toggles with Enter and Space, and Tab reaches the folder's links", async () => {
    renderShell();
    // Focus opens the row's tooltip, a state update.
    act(() => folder("Cities").focus());
    await userEvent.keyboard("{Enter}");
    expect(folder("Cities")).toHaveAttribute("aria-expanded", "true");
    await userEvent.tab();
    expect(link("İstanbul")).toHaveFocus();
    act(() => folder("Cities").focus());
    await userEvent.keyboard(" ");
    expect(folder("Cities")).toHaveAttribute("aria-expanded", "false");
  });

  it("makes a folder with an href a link plus its own toggle", async () => {
    renderShell();
    const reports = link("Reports");
    expect(reports).toHaveAttribute("href", "/reports");
    await userEvent.click(reports);
    expect(folder("Reports")).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(folder("Reports"));
    expect(folder("Reports")).toHaveAttribute("aria-expanded", "true");
    expect(link("Monthly")).toHaveAttribute("href", "/reports/monthly");
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("keeps a nested folder's toggle from padding the top-level row", () => {
    renderShell({
      openFolders: ["outer"],
      nav: [
        {
          id: "g",
          label: "G",
          items: [
            {
              id: "outer",
              label: "Outer",
              items: [
                {
                  id: "inner",
                  href: "/inner",
                  label: "Inner",
                  items: [{ id: "leaf", href: "/inner/leaf", label: "Leaf" }],
                },
              ],
            },
          ],
        },
      ],
    });
    // The top-level row pads its button for any `menu-action` in its item.
    const outer = folder("Outer").closest("li") as HTMLElement;
    expect(folder("Inner")).toHaveAttribute("data-sidebar", "menu-sub-action");
    expect(outer.querySelector('[data-sidebar="menu-action"]')).toBeNull();
  });

  it("highlights a folder's own page and opens the folders above a page under it", () => {
    mockPathname = "/reports";
    renderShell();
    expect(link("Reports")).toHaveAttribute("aria-current", "page");
    expect(folder("Reports")).toHaveAttribute("aria-expanded", "false");
  });

  it("leaves out folders with nothing to show, and groups left empty", () => {
    renderShell();
    expect(screen.queryByText("Empty folder")).not.toBeInTheDocument();
    expect(screen.queryByText("Ghost folder")).not.toBeInTheDocument();
    expect(screen.queryByText("Only empty folders")).not.toBeInTheDocument();
  });

  it("opens the folders above the item isActive accepts", () => {
    mockPathname = "/elsewhere";
    renderShell({
      isActive: (href) => href === "/places/ankara",
    });
    expect(folder("Cities")).toHaveAttribute("aria-expanded", "true");
    expect(link("Ankara")).toHaveAttribute("aria-current", "page");
    expect(folder("Operations")).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the folders above each new page without closing the user's", async () => {
    const { rerender } = renderShell();
    await userEvent.click(folder("Reports"));
    await userEvent.click(folder("Refunds"));
    expect(folder("Refunds")).toHaveAttribute("aria-expanded", "false");

    mockPathname = "/places/ankara";
    rerender(shell());
    expect(folder("Cities")).toHaveAttribute("aria-expanded", "true");
    expect(folder("Reports")).toHaveAttribute("aria-expanded", "true");
    expect(folder("Operations")).toHaveAttribute("aria-expanded", "true");
    expect(folder("Refunds")).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the active page's folders when the nav arrives after the first render", () => {
    const { rerender } = render(shell({ nav: [] }));
    rerender(shell());
    expect(folder("Refunds")).toHaveAttribute("aria-expanded", "true");
  });

  it("follows openFolders and reports changes when controlled", async () => {
    const onOpenFoldersChange = jest.fn();
    const { rerender } = renderShell({
      openFolders: ["reports"],
      onOpenFoldersChange,
    });
    expect(folder("Reports")).toHaveAttribute("aria-expanded", "true");
    expect(folder("Operations")).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(folder("Operations"));
    expect(onOpenFoldersChange).toHaveBeenLastCalledWith([
      "reports",
      "operations",
    ]);
    // The prop has not changed, so neither has the sidebar.
    expect(folder("Operations")).toHaveAttribute("aria-expanded", "false");

    rerender(shell({ openFolders: [], onOpenFoldersChange }));
    expect(folder("Reports")).toHaveAttribute("aria-expanded", "false");
  });

  it("reports changes when uncontrolled too", async () => {
    const onOpenFoldersChange = jest.fn();
    renderShell({ onOpenFoldersChange });
    await userEvent.click(folder("Cities"));
    expect(onOpenFoldersChange).toHaveBeenLastCalledWith([
      "operations",
      "refunds",
      "cities",
    ]);
  });

  it("expands the sidebar with the folder open when a folder is chosen in the icon rail", async () => {
    renderShell({ defaultOpen: false });
    expect(sidebarState()).toBe("collapsed");
    await userEvent.click(folder("Operations"));
    expect(sidebarState()).toBe("expanded");
    expect(folder("Operations")).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(
      document.querySelector('[data-slot="sidebar-trigger"]') as HTMLElement
    );
    await userEvent.click(folder("Cities"));
    expect(sidebarState()).toBe("expanded");
    expect(folder("Cities")).toHaveAttribute("aria-expanded", "true");
  });

  it("works in the mobile sheet, which keeps its folders after closing", async () => {
    mockIsMobile = true;
    renderShell();
    const trigger = () =>
      document.querySelector('[data-slot="sidebar-trigger"]') as HTMLElement;
    await userEvent.click(trigger());
    const sheet = screen.getByRole("dialog", { name: "Navigation" });
    await userEvent.click(
      within(sheet).getByRole("button", { name: "Cities" })
    );
    await userEvent.click(within(sheet).getByRole("link", { name: "Ankara" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Navigation" })
      ).not.toBeInTheDocument()
    );
    await userEvent.click(trigger());
    const again = screen.getByRole("dialog", { name: "Navigation" });
    expect(
      within(again).getByRole("button", { name: "Cities" })
    ).toHaveAttribute("aria-expanded", "true");
  });
});

describe("AppShell folders: navFilter", () => {
  it("renders no filter box or expand button by default", () => {
    renderShell();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("search")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /expand all|collapse all/i })
    ).not.toBeInTheDocument();
  });

  it("filters from two characters, keeping the folders above each match", async () => {
    renderShell({ navFilter: true });
    await userEvent.type(filterBox(), "c");
    expect(link("Dashboard")).toBeInTheDocument();

    await userEvent.type(filterBox(), "losed");
    await waitFor(() => expect(queryLink("Dashboard")).not.toBeInTheDocument());
    expect(link("Closed refunds")).toBeInTheDocument();
    expect(folder("Operations")).toHaveAttribute("aria-expanded", "true");
    expect(folder("Refunds")).toHaveAttribute("aria-expanded", "true");
    expect(queryLink("Open refunds")).not.toBeInTheDocument();
    expect(queryLink("Invoices")).not.toBeInTheDocument();
    expect(screen.queryByText("Places")).not.toBeInTheDocument();
  });

  it("matches keywords, ignores case and accents, and keeps a matching folder whole", async () => {
    renderShell({ navFilter: true });
    await userEvent.type(filterBox(), "ARCHIVE");
    await waitFor(() => expect(link("Closed refunds")).toBeInTheDocument());
    expect(queryLink("Open refunds")).not.toBeInTheDocument();

    await userEvent.clear(filterBox());
    await userEvent.type(filterBox(), "istanbul");
    await waitFor(() => expect(link("İstanbul")).toBeInTheDocument());
    expect(queryLink("Ankara")).not.toBeInTheDocument();

    await userEvent.clear(filterBox());
    await userEvent.type(filterBox(), "refunds");
    await waitFor(() => expect(link("Open refunds")).toBeInTheDocument());
    expect(link("Closed refunds")).toBeInTheDocument();
  });

  it("says so when nothing matches", async () => {
    renderShell({ navFilter: true });
    await userEvent.type(filterBox(), "zzzz");
    expect(await screen.findByRole("status")).toHaveTextContent("No results.");
  });

  it("clears with Escape and restores the folders as they were", async () => {
    const onOpenFoldersChange = jest.fn();
    renderShell({ navFilter: true, onOpenFoldersChange });
    await userEvent.type(filterBox(), "ankara");
    await waitFor(() => expect(link("Ankara")).toBeInTheDocument());
    expect(folder("Cities")).toHaveAttribute("aria-expanded", "true");

    await userEvent.keyboard("{Escape}");
    expect(filterBox()).toHaveValue("");
    await waitFor(() => expect(link("Dashboard")).toBeInTheDocument());
    expect(folder("Cities")).toHaveAttribute("aria-expanded", "false");
    expect(folder("Refunds")).toHaveAttribute("aria-expanded", "true");
    // Opening folders to show matches is display only.
    expect(onOpenFoldersChange).not.toHaveBeenCalled();
  });

  it("lets a folder shown by the filter be closed", async () => {
    renderShell({ navFilter: true });
    await userEvent.type(filterBox(), "ankara");
    await waitFor(() => expect(link("Ankara")).toBeInTheDocument());
    await userEvent.click(folder("Cities"));
    expect(folder("Cities")).toHaveAttribute("aria-expanded", "false");
  });

  it("collapses everything, then expands everything", async () => {
    const onOpenFoldersChange = jest.fn();
    renderShell({ navFilter: true, onOpenFoldersChange });
    await userEvent.click(screen.getByRole("button", { name: "Collapse all" }));
    expect(onOpenFoldersChange).toHaveBeenLastCalledWith([]);
    expect(folder("Operations")).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(screen.getByRole("button", { name: "Expand all" }));
    expect(onOpenFoldersChange).toHaveBeenLastCalledWith([
      "operations",
      "refunds",
      "reports",
      "cities",
    ]);
    for (const name of ["Operations", "Refunds", "Reports", "Cities"]) {
      expect(folder(name)).toHaveAttribute("aria-expanded", "true");
    }
  });

  it("disables expand/collapse all while filtering", async () => {
    renderShell({ navFilter: true });
    await userEvent.type(filterBox(), "ankara");
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Collapse all" })
      ).toBeDisabled()
    );
  });

  it("shows no expand/collapse all button for a nav without folders", () => {
    renderShell({
      navFilter: true,
      nav: [
        {
          id: "flat",
          label: "Flat",
          items: [{ id: "a", href: "/a", label: "A" }],
        },
      ],
    });
    expect(filterBox()).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /expand all|collapse all/i })
    ).not.toBeInTheDocument();
  });

  it("uses the labels passed in", async () => {
    const labels: AppShellLabels = {
      filterPlaceholder: "Menüde ara…",
      expandAll: "Tümünü aç",
      collapseAll: "Tümünü kapat",
      commandEmpty: "Eşleşme yok.",
    };
    renderShell({ navFilter: true, labels });
    const box = screen.getByRole("searchbox", { name: "Menüde ara…" });
    expect(box).toHaveAttribute("placeholder", "Menüde ara…");
    await userEvent.click(screen.getByRole("button", { name: "Tümünü kapat" }));
    expect(
      screen.getByRole("button", { name: "Tümünü aç" })
    ).toBeInTheDocument();
    await userEvent.type(box, "zzzz");
    expect(await screen.findByRole("status")).toHaveTextContent("Eşleşme yok.");
    for (const english of ["Filter menu…", "Expand all", "Collapse all"]) {
      expect(screen.queryByLabelText(english)).not.toBeInTheDocument();
    }
  });
});

describe("AppShell folders: ⌘K", () => {
  async function openMenu() {
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
    return screen.findByRole("dialog", { name: "Command menu" });
  }

  it("lists every nested link with its folder path, folders with an href included", async () => {
    renderShell();
    const dialog = await openMenu();
    const options = (group: string) =>
      within(within(dialog).getByRole("group", { name: group }))
        .getAllByRole("option")
        .map((option) => option.textContent);
    expect(options("Workspace")).toEqual([
      "Dashboard",
      "Operations / Refunds / Open refunds",
      "Operations / Refunds / Closed refunds",
      "Operations / Invoices",
      "ReportsNew",
      "Reports / Monthly",
    ]);
    expect(options("Places")).toEqual(["Cities / İstanbul", "Cities / Ankara"]);
    expect(
      within(dialog).queryByRole("group", { name: "Only empty folders" })
    ).not.toBeInTheDocument();
  });

  it("navigates to a nested link", async () => {
    renderShell();
    const dialog = await openMenu();
    await userEvent.click(
      within(dialog).getByRole("option", { name: "Cities / Ankara" })
    );
    expect(mockNavigate).toHaveBeenCalledWith("/places/ankara");
  });

  it("finds links by folder name and by keywords", async () => {
    renderShell();
    const dialog = await openMenu();
    const input = within(dialog).getByRole("combobox");
    await userEvent.type(input, "archive");
    expect(
      within(dialog)
        .getAllByRole("option")
        .map((option) => option.textContent)
    ).toEqual(["Operations / Refunds / Closed refunds"]);

    await userEvent.clear(input);
    await userEvent.type(input, "cities");
    // cmdk also keeps fuzzy matches ("Operations / Invoices" has the letters
    // in order), so only membership is checked.
    const found = within(dialog)
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(found).toEqual(
      expect.arrayContaining(["Cities / İstanbul", "Cities / Ankara"])
    );
    expect(found).not.toContain("Dashboard");
  });
});
