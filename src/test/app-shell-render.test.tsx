import React from "react";
import { renderToString } from "react-dom/server";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AppShell,
  type AppShellCommand,
  type AppShellLabels,
  type AppShellNavGroup,
  type AppShellProps,
} from "../custom/app-shell";

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
      { id: "traces", href: "/traces", label: "Traces" },
      {
        id: "records",
        href: "/records",
        label: "Records",
        badge: <span>Preview</span>,
      },
    ],
  },
  { id: "empty", label: "Empty group", items: [] },
  {
    id: "configure",
    label: "Configure",
    items: [{ id: "projects", href: "/projects", label: "Projects" }],
  },
];

const onLight = jest.fn();
const onDark = jest.fn();
const onSignOut = jest.fn();

const COMMANDS: AppShellCommand[] = [
  { id: "light", label: "Light", group: "Theme", onSelect: onLight },
  { id: "sign-out", label: "Sign out", group: "Account", onSelect: onSignOut },
  {
    id: "dark",
    label: "Dark",
    group: "Theme",
    keywords: ["night"],
    onSelect: onDark,
  },
];

const TURKISH: Required<AppShellLabels> = {
  toggleSidebar: "Kenar çubuğunu aç/kapat",
  search: "Ara…",
  commandTitle: "Komut menüsü",
  commandPlaceholder: "Sayfa ve komut ara…",
  commandEmpty: "Eşleşme yok.",
  breadcrumb: "Konum",
  navigation: "Ana gezinme",
  close: "Kapat",
  mobileTitle: "Gezinme",
};

function renderShell(
  props: Partial<AppShellProps> = {},
  children: React.ReactNode = <p>Page body</p>
) {
  return render(
    <AppShell
      nav={NAV}
      brand={<span>Brand</span>}
      userMenu={<button type="button">User</button>}
      commands={COMMANDS}
      {...props}
    >
      {children}
    </AppShell>
  );
}

function pressKey(
  init: KeyboardEventInit,
  target: Element | Document = document.body
) {
  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

const sidebarState = () =>
  document.querySelector('[data-slot="sidebar"]')?.getAttribute("data-state");

const trigger = () =>
  document.querySelector('[data-slot="sidebar-trigger"]') as HTMLElement;

async function openWithSearchButton(name = "Search…") {
  await userEvent.click(screen.getByRole("button", { name }));
  return screen.getByRole("dialog");
}

describe("AppShell: sidebar", () => {
  it("shows the brand, the user menu, the group labels and the items", () => {
    renderShell();
    expect(screen.getByText("Brand")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "User" })).toBeInTheDocument();

    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    const workspace = within(nav).getByRole("list", { name: "Workspace" });
    expect(
      within(workspace)
        .getAllByRole("link")
        .map((link) => [link.textContent, link.getAttribute("href")])
    ).toEqual([
      ["Playground", "/playground"],
      ["Traces", "/traces"],
      ["Records", "/records"],
    ]);
    const configure = within(nav).getByRole("list", { name: "Configure" });
    expect(
      within(configure).getByRole("link", { name: "Projects" })
    ).toHaveAttribute("href", "/projects");
  });

  it("leaves out a group with no items", () => {
    renderShell();
    expect(screen.queryByText("Empty group")).not.toBeInTheDocument();
  });

  it("hides the item icon from assistive technology", () => {
    renderShell();
    expect(
      screen.getByTestId("icon-playground").closest('[aria-hidden="true"]')
    ).not.toBeNull();
  });

  it("marks the item whose href is the longest match of the path", () => {
    mockPathname = "/playground/run-1";
    renderShell();
    const playground = screen.getByRole("link", { name: "Playground" });
    const traces = screen.getByRole("link", { name: "Traces" });
    expect(playground).toHaveAttribute("data-active", "true");
    expect(playground).toHaveAttribute("aria-current", "page");
    expect(traces).toHaveAttribute("data-active", "false");
    expect(traces).not.toHaveAttribute("aria-current");
  });

  it("asks isActive instead when it is given", () => {
    mockPathname = "/runs/7";
    const isActive = jest.fn(
      (href: string, pathname: string) =>
        href === "/traces" && pathname.startsWith("/runs")
    );
    renderShell({ isActive });
    expect(isActive).toHaveBeenCalledWith("/traces", "/runs/7");
    expect(screen.getByRole("link", { name: "Traces" })).toHaveAttribute(
      "data-active",
      "true"
    );
    expect(screen.getByRole("link", { name: "Playground" })).toHaveAttribute(
      "data-active",
      "false"
    );
  });

  it("spreads dataAttributes onto the link", () => {
    renderShell();
    expect(screen.getByRole("link", { name: "Playground" })).toHaveAttribute(
      "data-tour",
      "nav-playground"
    );
  });

  it("renders the badge in the menu badge slot", () => {
    renderShell();
    expect(
      screen.getByText("Preview").closest('[data-sidebar="menu-badge"]')
    ).not.toBeNull();
  });

  it("toggles from the trigger when no onOpenChange is given", async () => {
    renderShell();
    expect(sidebarState()).toBe("expanded");
    await userEvent.click(trigger());
    expect(sidebarState()).toBe("collapsed");
    await userEvent.click(trigger());
    expect(sidebarState()).toBe("expanded");
  });

  it("starts collapsed when defaultOpen is false", () => {
    renderShell({ defaultOpen: false });
    expect(sidebarState()).toBe("collapsed");
  });

  it("renders the saved state on the server", () => {
    const shell = (defaultOpen: boolean) =>
      renderToString(
        <AppShell
          nav={NAV}
          brand={null}
          userMenu={null}
          defaultOpen={defaultOpen}
        >
          x
        </AppShell>
      );
    expect(shell(false)).toContain('data-state="collapsed"');
    expect(shell(true)).toContain('data-state="expanded"');
  });

  it("reports the sidebar's open state to onOpenChange", async () => {
    const onOpenChange = jest.fn();
    renderShell({ onOpenChange });
    await userEvent.click(trigger());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await userEvent.click(trigger());
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
  });

  it("closes the mobile sheet when a link is chosen", async () => {
    mockIsMobile = true;
    renderShell();
    await userEvent.click(trigger());
    const sheet = screen.getByRole("dialog", { name: "Navigation" });
    await userEvent.click(within(sheet).getByRole("link", { name: "Traces" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Navigation" })
      ).not.toBeInTheDocument()
    );
  });
});

describe("AppShell: header", () => {
  const crumbs = [
    { label: "Studio", href: "/" },
    { label: "Workspace" },
    { label: "Playground", href: "/playground" },
  ];

  it("links the crumbs that have an href and makes the last one the page", () => {
    renderShell({ breadcrumbs: crumbs });
    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(
      within(breadcrumb).getByRole("link", { name: "Studio" })
    ).toHaveAttribute("href", "/");
    expect(within(breadcrumb).getByText("Workspace").closest("a")).toBeNull();
    const page = within(breadcrumb).getByText("Playground");
    expect(page).toHaveAttribute("aria-current", "page");
    expect(page.closest("a")).toBeNull();
  });

  it("renders no breadcrumb without crumbs", () => {
    renderShell();
    expect(
      screen.queryByRole("navigation", { name: "Breadcrumb" })
    ).not.toBeInTheDocument();
  });

  it("renders pageTitle as the h1", () => {
    renderShell({ pageTitle: "Playground" });
    expect(
      screen.getByRole("heading", { level: 1, name: "Playground" })
    ).toBeInTheDocument();
  });

  it("renders no h1 without pageTitle", () => {
    renderShell();
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("puts headerActions in the header and the children in main", () => {
    renderShell({ headerActions: <button type="button">Run</button> });
    expect(
      within(screen.getByRole("banner")).getByRole("button", { name: "Run" })
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("main")).getByText("Page body")
    ).toBeInTheDocument();
  });
});

describe("AppShell: ⌘K", () => {
  it("opens on Ctrl+K with the nav groups, then the commands by group in first-seen order", async () => {
    renderShell();
    const event = pressKey({ key: "k", ctrlKey: true });
    expect(event.defaultPrevented).toBe(true);

    const dialog = await screen.findByRole("dialog", { name: "Command menu" });
    expect(
      Array.from(dialog.querySelectorAll("[cmdk-group-heading]")).map(
        (heading) => heading.textContent
      )
    ).toEqual(["Workspace", "Configure", "Theme", "Account"]);

    const options = (group: string) =>
      within(within(dialog).getByRole("group", { name: group }))
        .getAllByRole("option")
        .map((option) => option.textContent);
    expect(options("Workspace")).toEqual([
      "Playground",
      "Traces",
      "RecordsPreview",
    ]);
    expect(options("Configure")).toEqual(["Projects"]);
    expect(options("Theme")).toEqual(["Light", "Dark"]);
    expect(options("Account")).toEqual(["Sign out"]);
  });

  it("opens on ⌘K while a text field has focus", async () => {
    renderShell({}, <input aria-label="field" />);
    const input = screen.getByRole("textbox", { name: "field" });
    input.focus();
    const event = pressKey({ key: "K", metaKey: true }, input);
    expect(event.defaultPrevented).toBe(true);
    expect(
      await screen.findByRole("dialog", { name: "Command menu" })
    ).toBeInTheDocument();
  });

  it("ignores K without a modifier", () => {
    renderShell();
    const event = pressKey({ key: "k" });
    expect(event.defaultPrevented).toBe(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens from the search button", async () => {
    renderShell();
    const dialog = await openWithSearchButton();
    expect(dialog).toHaveAccessibleName("Command menu");
  });

  it("navigates to a chosen nav item and closes", async () => {
    renderShell();
    const dialog = await openWithSearchButton();
    await userEvent.click(
      within(dialog).getByRole("option", { name: "Traces" })
    );
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/traces");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("runs a chosen command and closes", async () => {
    renderShell();
    const dialog = await openWithSearchButton();
    await userEvent.click(
      within(dialog).getByRole("option", { name: "Sign out" })
    );
    expect(onSignOut).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("matches a command by its keywords", async () => {
    renderShell();
    const dialog = await openWithSearchButton();
    await userEvent.type(within(dialog).getByRole("combobox"), "night");
    expect(
      within(dialog).getByRole("option", { name: "Dark" })
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("option", { name: "Light" })
    ).not.toBeInTheDocument();
  });

  it("stops listening once unmounted", () => {
    const { unmount } = renderShell();
    unmount();
    const event = pressKey({ key: "k", ctrlKey: true });
    expect(event.defaultPrevented).toBe(false);
  });
});

describe("AppShell: labels", () => {
  async function expectLabels(labels: Required<AppShellLabels>) {
    const english = [
      "Toggle Sidebar",
      "Search…",
      "Command menu",
      "Search pages and commands…",
      "No results.",
      "Breadcrumb",
      "Main navigation",
      "Close",
      "Navigation",
    ];

    expect(trigger()).toHaveAccessibleName(labels.toggleSidebar);
    expect(
      document.querySelector('[data-slot="sidebar-rail"]')
    ).toHaveAccessibleName(labels.toggleSidebar);
    expect(
      screen.getByRole("navigation", { name: labels.breadcrumb })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: labels.navigation })
    ).toBeInTheDocument();

    const dialog = await openWithSearchButton(labels.search);
    expect(dialog).toHaveAccessibleName(labels.commandTitle);
    expect(dialog).toHaveAccessibleDescription(labels.commandPlaceholder);
    expect(
      within(dialog).getByRole("listbox", { name: labels.commandTitle })
    ).toBeInTheDocument();
    const input = within(dialog).getByRole("combobox");
    expect(input).toHaveAttribute("placeholder", labels.commandPlaceholder);
    expect(
      within(dialog).getByRole("button", { name: labels.close })
    ).toBeInTheDocument();
    await userEvent.type(input, "zzzz");
    expect(within(dialog).getByText(labels.commandEmpty)).toBeInTheDocument();

    for (const text of english) {
      if (Object.values(labels).includes(text)) continue;
      expect(screen.queryByText(text)).not.toBeInTheDocument();
    }
    // The primitives' own English defaults never reach the page.
    expect(screen.queryByText("Command Palette")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Search for a command to run...")
    ).not.toBeInTheDocument();
  }

  it("uses the English defaults", async () => {
    renderShell({ breadcrumbs: [{ label: "Playground" }] });
    await expectLabels({
      toggleSidebar: "Toggle Sidebar",
      search: "Search…",
      commandTitle: "Command menu",
      commandPlaceholder: "Search pages and commands…",
      commandEmpty: "No results.",
      breadcrumb: "Breadcrumb",
      navigation: "Main navigation",
      close: "Close",
      mobileTitle: "Navigation",
    });
  });

  it("lets labels replace every default", async () => {
    renderShell({ breadcrumbs: [{ label: "Playground" }], labels: TURKISH });
    await expectLabels(TURKISH);
  });

  it("titles the mobile sheet with mobileTitle", async () => {
    mockIsMobile = true;
    renderShell({ labels: TURKISH });
    await userEvent.click(trigger());
    expect(
      screen.getByRole("dialog", { name: TURKISH.mobileTitle })
    ).toBeInTheDocument();
    expect(screen.queryByText("Navigation")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Displays the mobile sidebar.")
    ).not.toBeInTheDocument();
  });

  it("titles the mobile sheet Navigation by default", async () => {
    mockIsMobile = true;
    renderShell();
    await userEvent.click(trigger());
    expect(
      screen.getByRole("dialog", { name: "Navigation" })
    ).toBeInTheDocument();
  });
});
