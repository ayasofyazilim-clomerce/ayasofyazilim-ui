import React from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AppShell,
  type AppShellLabels,
  type AppShellNavGroup,
  type AppShellProps,
  type AppShellShortcuts,
} from "../custom/app-shell";

const mockNavigate = jest.fn();

jest.mock("../custom/app-shell/use-app-shell-navigate", () => ({
  useAppShellNavigate: () => mockNavigate,
}));

jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
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
  useIsMobile: () => false,
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

beforeEach(() => {
  mockNavigate.mockReset();
  onImport.mockReset();
});

const NAV: AppShellNavGroup[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      { id: "dashboard", href: "/dashboard", label: "Dashboard" },
      {
        id: "orders",
        href: "/orders",
        label: "Orders",
        actions: [
          { id: "new-order", label: "New order", href: "/orders/new" },
          { id: "import-orders", label: "Import orders", onSelect: onImport },
        ],
      },
      {
        id: "sales",
        label: "Sales",
        items: [{ id: "invoices", href: "/sales/invoices", label: "Invoices" }],
      },
    ],
  },
];

/** A shell whose shortcuts live in React state, like an app would keep them. */
function Harness({
  initial = {},
  onChange,
  reserved,
  ...props
}: Partial<AppShellProps> & {
  initial?: Record<string, string>;
  onChange?: (next: Record<string, string>) => void;
  reserved?: string[];
}) {
  const [value, setValue] = React.useState(initial);
  const shortcuts: AppShellShortcuts = {
    value,
    onChange: (next) => {
      onChange?.(next);
      setValue(next);
    },
    reserved,
  };
  return (
    <AppShell
      nav={NAV}
      brand={<span>Brand</span>}
      userMenu={<button type="button">User</button>}
      shortcuts={shortcuts}
      {...props}
    >
      <input aria-label="field" />
    </AppShell>
  );
}

function openMenu() {
  act(() => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "k",
        code: "KeyK",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      })
    );
  });
  return screen.findByRole("dialog", { name: "Command menu" });
}

/** Highlights the option named `name` in the open ⌘K list. */
async function highlight(dialog: HTMLElement, name: string | RegExp) {
  await userEvent.hover(within(dialog).getByRole("option", { name }));
  await waitFor(() =>
    expect(within(dialog).getByRole("option", { name })).toHaveAttribute(
      "aria-selected",
      "true"
    )
  );
}

const assignButton = (dialog: HTMLElement) =>
  within(dialog).getByRole("button", { name: "Assign shortcut" });

describe("AppShell shortcuts: without the prop", () => {
  it("adds no shortcut bar and fires nothing", async () => {
    render(
      <AppShell nav={NAV} brand={null} userMenu={null}>
        x
      </AppShell>
    );
    const dialog = await openMenu();
    expect(
      within(dialog).queryByRole("button", { name: "Assign shortcut" })
    ).not.toBeInTheDocument();
    expect(
      dialog.querySelector('[data-slot="app-shell-shortcut-bar"]')
    ).toBeNull();
    await userEvent.keyboard("{Escape}");
    await userEvent.keyboard("{Control>}{Shift>}e{/Shift}{/Control}");
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(document.querySelector("[aria-keyshortcuts]")).toHaveAttribute(
      "aria-keyshortcuts",
      "Meta+K Control+K"
    );
  });
});

describe("AppShell shortcuts: showing", () => {
  it("shows an assigned shortcut in ⌘K and announces it on the links", async () => {
    render(
      <Harness
        initial={{
          "item:orders": "ctrl+shift+e",
          "action:import-orders": "alt+i",
        }}
      />
    );
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(within(nav).getByRole("link", { name: "Orders" })).toHaveAttribute(
      "aria-keyshortcuts",
      "Control+Shift+E"
    );
    expect(
      within(nav).getByRole("link", { name: "Dashboard" })
    ).not.toHaveAttribute("aria-keyshortcuts");

    const dialog = await openMenu();
    const orders = within(dialog).getByRole("option", { name: "Orders" });
    expect(orders).toHaveAttribute("aria-keyshortcuts", "Control+Shift+E");
    expect(
      Array.from(orders.querySelectorAll("kbd kbd")).map(
        (kbd) => kbd.textContent
      )
    ).toEqual(["Ctrl", "Shift", "E"]);
    expect(orders.querySelector('[aria-hidden="true"] kbd')).not.toBeNull();
    expect(
      within(dialog).getByRole("option", { name: /Import orders/ })
    ).toHaveAttribute("aria-keyshortcuts", "Alt+I");
  });

  it("names the highlighted entry in the shortcut bar", async () => {
    render(<Harness />);
    const dialog = await openMenu();
    await highlight(dialog, "Sales / Invoices");
    const bar = dialog.querySelector(
      '[data-slot="app-shell-shortcut-bar"]'
    ) as HTMLElement;
    expect(bar).toHaveTextContent("Sales / Invoices");
    expect(assignButton(dialog)).toHaveAccessibleDescription(
      "Sales / Invoices"
    );
    expect(assignButton(dialog)).toHaveAttribute("aria-pressed", "false");
  });
});

describe("AppShell shortcuts: recording", () => {
  it("records a combo for the highlighted entry from the keyboard", async () => {
    const onChange = jest.fn();
    render(<Harness onChange={onChange} />);
    const dialog = await openMenu();
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() =>
      expect(
        within(dialog).getByRole("option", { name: "Orders" })
      ).toHaveAttribute("aria-selected", "true")
    );
    // Tab leaves the search box for the bar, the keyboard's way in.
    while (document.activeElement !== assignButton(dialog)) {
      await userEvent.tab();
    }
    await userEvent.keyboard("{Enter}");
    expect(assignButton(dialog)).toHaveAttribute("aria-pressed", "true");
    expect(within(dialog).getByRole("status")).toHaveTextContent(
      "Press a key combination with Ctrl, Alt or ⌘. Esc cancels."
    );

    await userEvent.keyboard("{Control>}{Shift>}e{/Shift}{/Control}");
    expect(onChange).toHaveBeenLastCalledWith({
      "item:orders": "ctrl+shift+e",
    });
    expect(assignButton(dialog)).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("dialog", { name: "Command menu" })).toBeVisible();
    expect(
      within(dialog).getByRole("option", { name: "Orders" })
    ).toHaveAttribute("aria-keyshortcuts", "Control+Shift+E");
  });

  it("records an action's shortcut under action:<id>", async () => {
    const onChange = jest.fn();
    render(<Harness onChange={onChange} />);
    const dialog = await openMenu();
    await highlight(dialog, "Orders / Import orders");
    await userEvent.click(assignButton(dialog));
    await userEvent.keyboard("{Alt>}i{/Alt}");
    expect(onChange).toHaveBeenLastCalledWith({
      "action:import-orders": "alt+i",
    });
  });

  it.each([
    ["Ctrl+K", "{Control>}k{/Control}"],
    ["Ctrl+Shift+K", "{Control>}{Shift>}k{/Shift}{/Control}"],
    ["Ctrl+B", "{Control>}b{/Control}"],
    ["Ctrl+T", "{Control>}t{/Control}"],
    ["⌘W", "{Meta>}w{/Meta}"],
  ])("refuses %s and keeps recording", async (_name, keys) => {
    const onChange = jest.fn();
    render(<Harness onChange={onChange} />);
    const dialog = await openMenu();
    await userEvent.click(assignButton(dialog));
    await userEvent.keyboard(keys);
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "That combination is reserved. Try another."
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(assignButton(dialog)).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("dialog", { name: "Command menu" })).toBeVisible();
  });

  it("refuses the app's own reserved combos", async () => {
    const onChange = jest.fn();
    render(<Harness onChange={onChange} reserved={["Shift+Alt+X"]} />);
    const dialog = await openMenu();
    await userEvent.click(assignButton(dialog));
    await userEvent.keyboard("{Alt>}{Shift>}x{/Shift}{/Alt}");
    expect(within(dialog).getByRole("alert")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("ignores lone modifiers and keys without Ctrl, Alt or ⌘", async () => {
    const onChange = jest.fn();
    render(<Harness onChange={onChange} />);
    const dialog = await openMenu();
    await userEvent.click(assignButton(dialog));
    await userEvent.keyboard("{Shift>}a{/Shift}x{Control}");
    expect(onChange).not.toHaveBeenCalled();
    expect(assignButton(dialog)).toHaveAttribute("aria-pressed", "true");
  });

  it("cancels with Escape without closing the menu", async () => {
    const onChange = jest.fn();
    render(<Harness onChange={onChange} />);
    const dialog = await openMenu();
    await userEvent.click(assignButton(dialog));
    await userEvent.keyboard("{Escape}");
    expect(assignButton(dialog)).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("dialog", { name: "Command menu" })).toBeVisible();
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("cancels when the assign button is pressed again", async () => {
    render(<Harness />);
    const dialog = await openMenu();
    await userEvent.click(assignButton(dialog));
    await userEvent.click(assignButton(dialog));
    expect(assignButton(dialog)).toHaveAttribute("aria-pressed", "false");
  });

  it("moves a combo from the entry that had it", async () => {
    const onChange = jest.fn();
    render(
      <Harness initial={{ "item:dashboard": "alt+e" }} onChange={onChange} />
    );
    const dialog = await openMenu();
    await highlight(dialog, "Orders");
    await userEvent.click(assignButton(dialog));
    await userEvent.keyboard("{Alt>}e{/Alt}");
    expect(onChange).toHaveBeenLastCalledWith({ "item:orders": "alt+e" });
  });

  it("removes a shortcut", async () => {
    const onChange = jest.fn();
    render(
      <Harness
        initial={{ "item:orders": "alt+o", "item:dashboard": "alt+d" }}
        onChange={onChange}
      />
    );
    const dialog = await openMenu();
    await highlight(dialog, "Orders");
    const remove = within(dialog).getByRole("button", {
      name: "Remove shortcut",
    });
    expect(remove).toHaveAccessibleDescription("Orders");
    await userEvent.click(remove);
    expect(onChange).toHaveBeenLastCalledWith({ "item:dashboard": "alt+d" });
    expect(
      within(dialog).queryByRole("button", { name: "Remove shortcut" })
    ).not.toBeInTheDocument();
  });

  it("stops recording when the menu closes", async () => {
    const onChange = jest.fn();
    render(<Harness onChange={onChange} />);
    const dialog = await openMenu();
    await userEvent.click(assignButton(dialog));
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Close" })
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    await userEvent.keyboard("{Alt>}q{/Alt}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("uses the labels passed in", async () => {
    const labels: AppShellLabels = {
      assignShortcut: "Kısayol ata",
      removeShortcut: "Kısayolu kaldır",
      pressShortcut: "Bir tuş bileşimine basın.",
      shortcutReserved: "Bu bileşim ayrılmış.",
    };
    render(<Harness labels={labels} initial={{ "item:dashboard": "alt+d" }} />);
    const dialog = await openMenu();
    await highlight(dialog, /^Dashboard/);
    expect(
      within(dialog).getByRole("button", { name: "Kısayolu kaldır" })
    ).toBeInTheDocument();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Kısayol ata" })
    );
    expect(within(dialog).getByRole("status")).toHaveTextContent(
      "Bir tuş bileşimine basın."
    );
    await userEvent.keyboard("{Control>}k{/Control}");
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "Bu bileşim ayrılmış."
    );
    for (const english of [
      "Assign shortcut",
      "Remove shortcut",
      "That combination is reserved. Try another.",
    ]) {
      expect(screen.queryByText(english)).not.toBeInTheDocument();
    }
  });
});

describe("AppShell shortcuts: firing", () => {
  const shortcuts = {
    "item:orders": "ctrl+shift+e",
    "item:invoices": "alt+shift+i",
    "action:import-orders": "alt+i",
    "action:new-order": "alt+n",
    "item:gone": "alt+g",
  };

  it("navigates to an item from anywhere", async () => {
    render(<Harness initial={shortcuts} />);
    await userEvent.keyboard("{Control>}{Shift>}e{/Shift}{/Control}");
    expect(mockNavigate).toHaveBeenCalledWith("/orders");
    await userEvent.keyboard("{Alt>}{Shift>}i{/Shift}{/Alt}");
    expect(mockNavigate).toHaveBeenLastCalledWith("/sales/invoices");
  });

  it("runs an action and follows a link action", async () => {
    render(<Harness initial={shortcuts} />);
    await userEvent.keyboard("{Alt>}i{/Alt}");
    expect(onImport).toHaveBeenCalledTimes(1);
    await userEvent.keyboard("{Alt>}n{/Alt}");
    expect(mockNavigate).toHaveBeenCalledWith("/orders/new");
  });

  it("goes through onNavigate when given", async () => {
    const onNavigate = jest.fn();
    render(<Harness initial={shortcuts} onNavigate={onNavigate} />);
    await userEvent.keyboard("{Control>}{Shift>}e{/Shift}{/Control}");
    expect(onNavigate).toHaveBeenCalledWith("/orders");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("fires while a text field has focus", async () => {
    render(<Harness initial={shortcuts} />);
    await userEvent.click(screen.getByRole("textbox", { name: "field" }));
    await userEvent.keyboard("{Alt>}i{/Alt}");
    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it("closes ⌘K when it fires from there", async () => {
    render(<Harness initial={shortcuts} />);
    await openMenu();
    await userEvent.keyboard("{Alt>}i{/Alt}");
    expect(onImport).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("does not fire while recording", async () => {
    render(<Harness initial={shortcuts} />);
    const dialog = await openMenu();
    await highlight(dialog, "Sales / Invoices");
    await userEvent.click(assignButton(dialog));
    await userEvent.keyboard("{Alt>}i{/Alt}");
    expect(onImport).not.toHaveBeenCalled();
  });

  it("leaves alone a stale key, an unknown combo, and a press a page handled", async () => {
    render(<Harness initial={shortcuts} />);
    await userEvent.keyboard("{Alt>}g{/Alt}{Alt>}z{/Alt}");
    expect(mockNavigate).not.toHaveBeenCalled();

    const event = new KeyboardEvent("keydown", {
      key: "i",
      code: "KeyI",
      altKey: true,
      bubbles: true,
      cancelable: true,
    });
    event.preventDefault();
    act(() => {
      document.body.dispatchEvent(event);
    });
    expect(onImport).not.toHaveBeenCalled();
  });

  it("fires once while a combo is held", () => {
    render(<Harness initial={shortcuts} />);
    for (const repeat of [false, true, true]) {
      act(() => {
        document.body.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "i",
            code: "KeyI",
            altKey: true,
            repeat,
            bubbles: true,
            cancelable: true,
          })
        );
      });
    }
    expect(onImport).toHaveBeenCalledTimes(1);
  });

  it("never fires a reserved combo, even when stored", async () => {
    render(<Harness initial={{ "item:orders": "ctrl+t" }} />);
    await userEvent.keyboard("{Control>}t{/Control}");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("stops listening once unmounted", async () => {
    const { unmount } = render(<Harness initial={shortcuts} />);
    unmount();
    await userEvent.keyboard("{Alt>}i{/Alt}");
    expect(onImport).not.toHaveBeenCalled();
  });
});
