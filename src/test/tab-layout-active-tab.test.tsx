import React from "react";
import { render, within } from "@testing-library/react";
import { TabLayout } from "../custom/tab-layout";

// Issue #1088: with a tab whose href is a prefix of another's, the parent tab
// stayed active on the child's page, because "?" was appended to the path even
// with no query string and the prefix walk then matched the parent first.

let mockPathname = "/";
let mockQuery = "";

jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(mockQuery),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }: React.ComponentProps<"a">) => (
    <a {...props}>{children}</a>
  ),
}));

function activeTabs(
  tabList: { href: string; label: string }[],
  pathname: string,
  query = ""
) {
  mockPathname = pathname;
  mockQuery = query;
  const { container, unmount } = render(
    <TabLayout tabList={tabList}>
      <div />
    </TabLayout>
  );
  const active = within(container)
    .getAllByRole("tab")
    .filter((tab) => tab.getAttribute("data-state") === "active")
    .map((tab) => tab.textContent);
  unmount();
  return active;
}

describe("TabLayout active tab", () => {
  const nested = [
    { href: "/a", label: "Parent" },
    { href: "/a/b", label: "Child" },
  ];

  it("activates the exact match over a parent prefix", () => {
    expect(activeTabs(nested, "/a/b")).toEqual(["Child"]);
  });

  it("activates the parent on its own page", () => {
    expect(activeTabs(nested, "/a")).toEqual(["Parent"]);
  });

  it("falls back to the closest parent on a deeper page", () => {
    expect(activeTabs(nested, "/a/b/c")).toEqual(["Child"]);
    expect(activeTabs(nested, "/a/x")).toEqual(["Parent"]);
  });

  it("keeps the exact match when the URL has a query string", () => {
    expect(activeTabs(nested, "/a/b", "page=2")).toEqual(["Child"]);
  });

  it("matches a tab whose href includes the query string", () => {
    const byQuery = [
      { href: "/list?view=table", label: "Table" },
      { href: "/list?view=cards", label: "Cards" },
    ];
    expect(activeTabs(byQuery, "/list", "view=cards")).toEqual(["Cards"]);
  });

  it("prefers the href with the query string over the bare path", () => {
    const tabs = [
      { href: "/list", label: "All" },
      { href: "/list?status=open", label: "Open" },
    ];
    expect(activeTabs(tabs, "/list", "status=open")).toEqual(["Open"]);
    expect(activeTabs(tabs, "/list", "status=closed")).toEqual(["All"]);
  });

  it("falls back to the first tab when nothing matches", () => {
    expect(activeTabs(nested, "/elsewhere")).toEqual(["Parent"]);
  });
});
