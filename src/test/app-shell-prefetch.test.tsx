import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { AppShell, type AppShellNavGroup } from "../custom/app-shell";

const mockPrefetch = jest.fn();

jest.mock("../custom/app-shell/use-app-shell-navigate", () => ({
  useAppShellNavigate: () => jest.fn(),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => "/playground",
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: mockPrefetch,
  }),
}));

// Records the `prefetch` prop the shell passes, which the real next/link reads.
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    prefetch,
    ...props
  }: React.ComponentProps<"a"> & { prefetch?: boolean | null }) => (
    <a
      {...props}
      data-prefetch={prefetch === undefined ? "default" : String(prefetch)}
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

beforeEach(() => mockPrefetch.mockClear());

const nav: AppShellNavGroup[] = [
  {
    id: "main",
    label: "Main",
    items: [
      { id: "playground", href: "/playground", label: "Playground" },
      { id: "traces", href: "/traces", label: "Traces" },
    ],
  },
];

function renderShell(navPrefetch?: "viewport" | "intent") {
  return render(
    <AppShell
      nav={nav}
      brand={<span>Brand</span>}
      userMenu={<span>User</span>}
      navPrefetch={navPrefetch}
    >
      <p>Page</p>
    </AppShell>
  );
}

const link = (name: string) => screen.getByRole("link", { name });

describe("AppShell navPrefetch", () => {
  it("leaves Next's default prefetch alone when unset", () => {
    renderShell();
    expect(link("Traces")).toHaveAttribute("data-prefetch", "default");
    fireEvent.mouseEnter(link("Traces"));
    expect(mockPrefetch).not.toHaveBeenCalled();
  });

  it('"viewport" is the same as unset', () => {
    renderShell("viewport");
    expect(link("Traces")).toHaveAttribute("data-prefetch", "default");
  });

  it('"intent" turns off in-view prefetch and prefetches on hover, focus and touch', () => {
    renderShell("intent");
    expect(link("Playground")).toHaveAttribute("data-prefetch", "false");
    expect(link("Traces")).toHaveAttribute("data-prefetch", "false");
    expect(mockPrefetch).not.toHaveBeenCalled();

    fireEvent.mouseEnter(link("Traces"));
    expect(mockPrefetch).toHaveBeenLastCalledWith("/traces");

    fireEvent.focus(link("Playground"));
    expect(mockPrefetch).toHaveBeenLastCalledWith("/playground");

    fireEvent.touchStart(link("Traces"));
    expect(mockPrefetch).toHaveBeenCalledTimes(3);
  });
});
