import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppShell, type AppShellNavGroup } from "../custom/app-shell";

// The real useAppShellNavigate runs here (unlike app-shell-render.test.tsx),
// so these tests see the router call the default navigation makes.
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => "/playground",
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }: React.ComponentProps<"a">) => (
    <a {...props}>{children}</a>
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

const NAV: AppShellNavGroup[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      { id: "playground", href: "/playground", label: "Playground" },
      { id: "traces", href: "/traces", label: "Traces" },
    ],
  },
];

const onSignOut = jest.fn();

function renderShell(onNavigate?: (href: string) => void) {
  return render(
    <AppShell
      nav={NAV}
      brand={null}
      userMenu={null}
      commands={[
        {
          id: "sign-out",
          label: "Sign out",
          group: "Account",
          onSelect: onSignOut,
        },
      ]}
      onNavigate={onNavigate}
    >
      <p>Page body</p>
    </AppShell>
  );
}

async function chooseInCommandMenu(option: string) {
  await userEvent.click(screen.getByRole("button", { name: "Search…" }));
  const dialog = screen.getByRole("dialog", { name: "Command menu" });
  await userEvent.click(within(dialog).getByRole("option", { name: option }));
}

describe("AppShell: ⌘K navigation", () => {
  it("pushes the chosen nav item's href on the router by default", async () => {
    renderShell();
    await chooseInCommandMenu("Traces");
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/traces");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("hands the chosen nav item's href to onNavigate instead of pushing", async () => {
    const onNavigate = jest.fn();
    renderShell(onNavigate);
    await chooseInCommandMenu("Traces");
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith("/traces");
    expect(mockPush).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("does not route commands through onNavigate", async () => {
    const onNavigate = jest.fn();
    renderShell(onNavigate);
    await chooseInCommandMenu("Sign out");
    expect(onSignOut).toHaveBeenCalledTimes(1);
    expect(onNavigate).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("leaves sidebar links as plain links", () => {
    const onNavigate = jest.fn();
    renderShell(onNavigate);
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(within(nav).getByRole("link", { name: "Traces" })).toHaveAttribute(
      "href",
      "/traces"
    );
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
