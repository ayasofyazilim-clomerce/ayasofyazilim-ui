import {
  filterNav,
  foldNavText,
  foldersAbove,
  navFolderIds,
  pruneNav,
} from "../custom/app-shell/nav-tree";
import type { AppShellNavGroup } from "../custom/app-shell/types";

const NAV: AppShellNavGroup[] = [
  {
    id: "main",
    label: "Main",
    items: [
      { id: "home", href: "/", label: "Home" },
      {
        id: "sales",
        label: "Sales",
        items: [
          {
            id: "orders",
            href: "/sales/orders",
            label: "Orders",
            items: [
              {
                id: "drafts",
                href: "/sales/orders/drafts",
                label: "Drafts",
                keywords: ["unsent"],
              },
            ],
          },
          { id: "customers", href: "/sales/customers", label: "Customers" },
        ],
      },
    ],
  },
];

describe("foldersAbove", () => {
  it("lists the folders above the longest match, outermost first", () => {
    expect(foldersAbove(NAV, "/sales/orders/drafts/12")).toEqual([
      "sales",
      "orders",
    ]);
  });

  it("leaves out a folder whose own page is active", () => {
    expect(foldersAbove(NAV, "/sales/orders")).toEqual(["sales"]);
  });

  it("is empty for a top-level page and for no match", () => {
    expect(foldersAbove(NAV, "/")).toEqual([]);
    expect(foldersAbove(NAV, "/elsewhere")).toEqual([]);
  });

  it("asks isActive instead when it is given", () => {
    const isActive = (href: string) => href === "/sales/customers";
    expect(foldersAbove(NAV, "/anything", isActive)).toEqual(["sales"]);
  });
});

describe("filterNav", () => {
  it("is null below two characters", () => {
    expect(filterNav(NAV, "")).toBeNull();
    expect(filterNav(NAV, " d ")).toBeNull();
  });

  it("keeps matches, their folders, and a matching folder's items", () => {
    expect(filterNav(NAV, "draf")).toEqual([
      {
        id: "main",
        label: "Main",
        items: [
          {
            id: "sales",
            label: "Sales",
            items: [NAV[0]!.items[1]!.items![0]],
          },
        ],
      },
    ]);
  });

  it("matches keywords", () => {
    const result = filterNav(NAV, "UNSENT");
    expect(result?.[0]?.items[0]?.items?.[0]?.items?.[0]?.id).toBe("drafts");
  });

  it("returns no groups when nothing matches", () => {
    expect(filterNav(NAV, "zzzz")).toEqual([]);
  });
});

describe("foldNavText", () => {
  it("folds case, accents and the dotless i", () => {
    expect(foldNavText("İstanbul")).toBe("istanbul");
    expect(foldNavText("IŞIK")).toBe("isik");
    expect(foldNavText("Café")).toBe("cafe");
    expect(foldNavText("ışık")).toBe("isik");
  });
});

describe("pruneNav", () => {
  it("keeps a nav that needs no pruning as it is", () => {
    const pruned = pruneNav(NAV);
    expect(pruned[0]).toBe(NAV[0]);
  });

  it("drops items and folders with nothing to show, and empty groups", () => {
    const pruned = pruneNav([
      {
        id: "g",
        label: "G",
        items: [
          { id: "nothing", label: "Nothing" },
          { id: "empty", label: "Empty", items: [] },
          { id: "page", label: "Page", href: "/page", items: [] },
          {
            id: "outer",
            label: "Outer",
            items: [{ id: "inner", label: "Inner", items: [] }],
          },
        ],
      },
      { id: "gone", label: "Gone", items: [{ id: "x", label: "X" }] },
    ]);
    expect(pruned).toEqual([
      {
        id: "g",
        label: "G",
        items: [{ id: "page", label: "Page", href: "/page", items: [] }],
      },
    ]);
  });
});

describe("navFolderIds", () => {
  it("lists every folder in tree order", () => {
    expect(navFolderIds(NAV)).toEqual(["sales", "orders"]);
  });
});
