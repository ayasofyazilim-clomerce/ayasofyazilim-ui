// Import the helper FIRST: its jest.mock calls must register before the grid loads.
import { renderGrid, setupGridMocks } from "./helpers/grid-test-setup";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getGridUrlParams } from "../custom/master-data-grid";
import type {
  GridUrlState,
  ServerFilterConfig,
} from "../custom/master-data-grid/types";
import {
  isPrefixUrlState,
  scopedKey,
  urlPrefixOf,
} from "../custom/master-data-grid/utils/url-scope";

const { navigateMock, routerPushMock, setSearchParams } = setupGridMocks();

// The helper's mocked usePathname.
const PATH = "/en/management/logs/audit";

const rows = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ name: `Row ${i}` }));

const serverFilters: ServerFilterConfig[] = [
  {
    key: "userName",
    label: "User name",
    placeholder: "Type a name",
    type: "string",
  },
];

const pageText = () =>
  document.body.textContent?.match(
    /pagination\.page\s*\d+\s*pagination\.of\s*\d+/
  )?.[0];

const blankPrefixes: Array<[string, GridUrlState]> = [
  ["an empty prefix", { prefix: "" }],
  ["a whitespace prefix", { prefix: "  " }],
];

let warn: jest.SpyInstance;
beforeEach(() => {
  warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
});
afterEach(() => warn.mockRestore());

describe.each(blankPrefixes)(
  "urlState with %s is default mode",
  (_, urlState) => {
    it("removes a deep-linked skipCount on mount and pages with un-prefixed keys", async () => {
      const user = userEvent.setup();
      setSearchParams("skipCount=20");
      renderGrid(rows(10), { rowCount: 50, pageSize: 10, urlState });
      expect(navigateMock).toHaveBeenNthCalledWith(1, `${PATH}?`, {
        replace: true,
      });
      expect(navigateMock).toHaveBeenCalledTimes(1);
      expect(pageText()).toBe("pagination.page 1 pagination.of 5");

      setSearchParams("");
      navigateMock.mockClear();
      await user.click(screen.getByTitle("pagination.nextPage"));
      expect(navigateMock).toHaveBeenNthCalledWith(1, `${PATH}?skipCount=10`, {
        replace: true,
      });
      expect(navigateMock).toHaveBeenCalledTimes(1);
    });

    it("clears every key from the right-side panel, as a default grid does", async () => {
      const user = userEvent.setup();
      setSearchParams("userName=john&other=keep");
      renderGrid(rows(10), {
        rowCount: 50,
        serverFilters,
        serverFilterLocation: "right",
        urlState,
      });

      fireEvent.change(screen.getByPlaceholderText("Type a name"), {
        target: { value: "jane" },
      });
      await user.click(screen.getByRole("button", { name: /filter\.apply/ }));
      await user.click(screen.getByRole("button", { name: /filter\.clear/ }));

      expect(routerPushMock).toHaveBeenNthCalledWith(
        1,
        `${PATH}?other=keep&userName=jane`,
        { scroll: false }
      );
      expect(routerPushMock).toHaveBeenNthCalledWith(2, PATH, {
        scroll: false,
      });
      expect(routerPushMock).toHaveBeenCalledTimes(2);
    });

    it("warns in development", () => {
      renderGrid(rows(1), { urlState });
      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0]?.[0])).toMatch(
        /urlState\.prefix is empty/
      );
    });

    it("reads un-prefixed keys in getGridUrlParams", () => {
      const prefix = (urlState as { prefix: string }).prefix;
      const { skipCount, maxResultCount, filters } = getGridUrlParams(
        { skipCount: "20", userName: "x", "a.skipCount": "40" },
        { prefix, filters: serverFilters }
      );
      expect({ skipCount, maxResultCount, filters }).toEqual({
        skipCount: 20,
        maxResultCount: 10,
        filters: { userName: "x" },
      });
    });
  }
);

describe("the blank-prefix warning", () => {
  it("stays silent in production", () => {
    const env = jest.replaceProperty(
      process.env as Record<string, string | undefined>,
      "NODE_ENV",
      "production"
    );
    try {
      renderGrid(rows(1), { urlState: { prefix: "" } });
    } finally {
      env.restore();
    }
    expect(warn).not.toHaveBeenCalled();
  });

  it("stays silent for a real prefix, the default and none", () => {
    renderGrid(rows(1), { urlState: { prefix: "a" } });
    renderGrid(rows(1), {});
    renderGrid(rows(1), { urlState: "none" });
    expect(warn).not.toHaveBeenCalled();
  });
});

describe("URL scope helpers treat a blank prefix as none", () => {
  it.each(["", "  "])("prefix %j", (prefix) => {
    expect(isPrefixUrlState({ prefix })).toBe(false);
    expect(urlPrefixOf({ prefix })).toBeUndefined();
    expect(scopedKey("skipCount", prefix)).toBe("skipCount");
  });

  it("keeps a real prefix", () => {
    expect(isPrefixUrlState({ prefix: "a" })).toBe(true);
    expect(urlPrefixOf({ prefix: "a" })).toBe("a");
    expect(scopedKey("skipCount", "a")).toBe("a.skipCount");
  });
});
