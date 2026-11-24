import React from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AppShell,
  type AppShellNavGroup,
  type AppShellProps,
} from "../custom/app-shell";

const mockNavigate = jest.fn();
let mockPathname = "/settings/profile";
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

const onImport = jest.fn();
const onReset = jest.fn();
const onEditProfile = jest.fn();

beforeEach(() => {
  mockPathname = "/settings/profile";
  mockIsMobile = false;
  mockNavigate.mockReset();
  onImport.mockReset();
  onReset.mockReset();
  onEditProfile.mockReset();
});

const NAV: AppShellNavGroup[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      {
        id: "customers",
        href: "/customers",
        label: "Customers",
        actions: [
          {
            id: "new-customer",
            label: "New customer",
            href: "/customers/new",
            dataAttributes: { "data-testid": "action-new-customer" },
          },
        ],
      },
      {
        id: "orders",
        href: "/orders",
        label: "Orders",
        badge: <span>5</span>,
        actions: [
          {
            id: "new-order",
            label: "New order",
            description: "Start a blank order",
            href: "/orders/new",
            icon: <svg data-testid="icon-new-order" />,
          },
          { id: "import-orders", label: "Import orders", onSelect: onImport },
        ],
      },
      {
        id: "settings",
        label: "Settings",
        actions: [{ id: "reset", label: "Reset settings", onSelect: onReset }],
        items: [
          {
            id: "profile",
            href: "/settings/profile",
            label: "Profile",
            actions: [
              {
                id: "edit-profile",
                label: "Edit profile",
                onSelect: onEditProfile,
              },
            ],
          },
          {
            id: "teams",
            href: "/settings/teams",
            label: "Teams",
            actions: [
              {
                id: "new-team",
                label: "New team",
                href: "/settings/teams/new",
              },
              {
                id: "invite",
                label: "Invite member",
                href: "/settings/teams/invite",
              },
            ],
          },
        ],
      },
    ],
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

const renderShell = (props: Partial<AppShellProps> = {}) =>
  render(shell(props));

const sidebarNav = () =>
  screen.getByRole("navigation", { name: "Main navigation" });
const row = (linkName: string) =>
  within(sidebarNav())
    .getByRole("link", { name: linkName })
    .closest("li") as HTMLElement;
const trigger = () =>
  document.querySelector('[data-slot="sidebar-trigger"]') as HTMLElement;

describe("AppShell item actions: one action", () => {
  it("renders a link button on the row, named by the action", () => {
    renderShell();
    const action = within(row("Customers")).getByRole("link", {
      name: "New customer",
    });
    expect(action).toHaveAttribute("href", "/customers/new");
    expect(action).toHaveAttribute("title", "New customer");
    expect(action).toHaveAttribute("data-testid", "action-new-customer");
    expect(action).toHaveAttribute("data-sidebar", "menu-action");
    // Without an icon of its own it shows a plus, hidden from assistive tech.
    expect(
      action.querySelector('[aria-hidden="true"] [data-lucide="PlusIcon"]')
    ).not.toBeNull();
  });

  it("renders a button that runs onSelect", async () => {
    renderShell();
    const profile = row("Profile");
    const edit = within(profile).getByRole("button", { name: "Edit profile" });
    // Inside a folder it is marked so the top-level row ignores it.
    expect(edit).toHaveAttribute("data-sidebar", "menu-sub-action");
    await userEvent.click(edit);
    expect(onEditProfile).toHaveBeenCalledTimes(1);
  });

  it("puts a folder's action on the folder's row", async () => {
    renderShell();
    const settings = within(sidebarNav())
      .getByRole("button", { name: "Settings" })
      .closest("li") as HTMLElement;
    await userEvent.click(
      within(settings).getAllByRole("button", { name: "Reset settings" })[0]!
    );
    expect(onReset).toHaveBeenCalledTimes(1);
    // The folder stays as it was.
    expect(
      within(sidebarNav()).getByRole("button", { name: "Settings" })
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("runs from the keyboard", async () => {
    renderShell();
    const edit = within(row("Profile")).getByRole("button", {
      name: "Edit profile",
    });
    act(() => edit.focus());
    await userEvent.keyboard("{Enter}");
    expect(onEditProfile).toHaveBeenCalledTimes(1);
  });
});

describe("AppShell item actions: several actions", () => {
  async function openOrdersMenu() {
    await userEvent.click(
      within(row("Orders")).getByRole("button", { name: "More actions" })
    );
    return screen.findByRole("menu");
  }

  it("renders a more button that opens a dropdown of the actions", async () => {
    renderShell();
    const more = within(row("Orders")).getByRole("button", {
      name: "More actions",
    });
    expect(more).toHaveAttribute("aria-haspopup", "menu");
    const menu = await openOrdersMenu();
    expect(within(menu).getByText("Orders")).toBeInTheDocument();
    const items = within(menu).getAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "New orderStart a blank order",
      "Import orders",
    ]);
    expect(items[0]).toHaveAttribute("href", "/orders/new");
    expect(
      screen.getByTestId("icon-new-order").closest('[aria-hidden="true"]')
    ).not.toBeNull();
  });

  it("runs an onSelect action and closes", async () => {
    renderShell();
    const menu = await openOrdersMenu();
    await userEvent.click(
      within(menu).getByRole("menuitem", { name: "Import orders" })
    );
    expect(onImport).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByRole("menu")).not.toBeInTheDocument()
    );
  });

  it("opens and chooses from the keyboard", async () => {
    renderShell();
    const more = within(row("Orders")).getByRole("button", {
      name: "More actions",
    });
    act(() => more.focus());
    await userEvent.keyboard("{Enter}");
    const menu = await screen.findByRole("menu");
    await waitFor(() =>
      expect(
        within(menu).getByRole("menuitem", { name: /New order/ })
      ).toHaveFocus()
    );
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it("works on a nested item", async () => {
    renderShell();
    await userEvent.click(
      within(row("Teams")).getByRole("button", { name: "More actions" })
    );
    const menu = await screen.findByRole("menu");
    expect(
      within(menu).getByRole("menuitem", { name: "Invite member" })
    ).toHaveAttribute("href", "/settings/teams/invite");
  });

  it("moves the badge left of the action button", () => {
    renderShell();
    expect(
      within(row("Orders"))
        .getByText("5")
        .closest('[data-sidebar="menu-badge"]')
    ).toHaveClass("right-7");
  });

  it("uses the moreActions label", () => {
    renderShell({ labels: { moreActions: "Diğer işlemler" } });
    expect(
      within(row("Orders")).getByRole("button", { name: "Diğer işlemler" })
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("More actions")).not.toBeInTheDocument();
  });
});

describe("AppShell item actions: icon rail and mobile sheet", () => {
  it("hides the row actions in the icon rail, like the primitive's", () => {
    renderShell({ defaultOpen: false });
    expect(
      within(row("Customers")).getByRole("link", { name: "New customer" })
    ).toHaveClass("group-data-[collapsible=icon]:hidden");
    expect(
      within(row("Orders")).getByRole("button", { name: "More actions" })
    ).toHaveClass("group-data-[collapsible=icon]:hidden");
  });

  it("closes the sheet after a link action", async () => {
    mockIsMobile = true;
    renderShell();
    await userEvent.click(trigger());
    const sheet = screen.getByRole("dialog", { name: "Navigation" });
    await userEvent.click(
      within(sheet).getByRole("link", { name: "New customer" })
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Navigation" })
      ).not.toBeInTheDocument()
    );
  });

  it("runs a dropdown action from the sheet and closes it", async () => {
    mockIsMobile = true;
    renderShell();
    await userEvent.click(trigger());
    const sheet = screen.getByRole("dialog", { name: "Navigation" });
    const orders = within(sheet)
      .getByRole("link", { name: "Orders" })
      .closest("li") as HTMLElement;
    await userEvent.click(
      within(orders).getByRole("button", { name: "More actions" })
    );
    await userEvent.click(
      await screen.findByRole("menuitem", { name: "Import orders" })
    );
    expect(onImport).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Navigation" })
      ).not.toBeInTheDocument()
    );
  });
});

describe("AppShell item actions: ⌘K", () => {
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

  it("lists each item's actions under it", async () => {
    renderShell();
    const dialog = await openMenu();
    expect(
      within(within(dialog).getByRole("group", { name: "Workspace" }))
        .getAllByRole("option")
        .map((option) => option.textContent)
    ).toEqual([
      "Customers",
      "Customers / New customer",
      "Orders5",
      "Orders / New order",
      "Orders / Import orders",
      "Settings / Reset settings",
      "Settings / Profile",
      "Settings / Profile / Edit profile",
      "Settings / Teams",
      "Settings / Teams / New team",
      "Settings / Teams / Invite member",
    ]);
  });

  it("navigates to a link action", async () => {
    renderShell();
    const dialog = await openMenu();
    await userEvent.click(
      within(dialog).getByRole("option", { name: "Orders / New order" })
    );
    expect(mockNavigate).toHaveBeenCalledWith("/orders/new");
  });

  it("runs an onSelect action and closes", async () => {
    renderShell();
    const dialog = await openMenu();
    await userEvent.click(
      within(dialog).getByRole("option", { name: "Settings / Reset settings" })
    );
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("finds an action by its description", async () => {
    renderShell();
    const dialog = await openMenu();
    await userEvent.type(within(dialog).getByRole("combobox"), "blank");
    expect(
      within(dialog)
        .getAllByRole("option")
        .map((option) => option.textContent)
    ).toEqual(["Orders / New order"]);
  });
});
