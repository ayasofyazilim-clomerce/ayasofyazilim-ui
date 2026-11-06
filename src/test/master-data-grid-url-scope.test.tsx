// Import the helper FIRST: its jest.mock calls must register before the grid loads.
import { renderGrid, setupGridMocks } from "./helpers/grid-test-setup";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getGridUrlParams } from "../custom/master-data-grid";
import type { ServerFilterConfig } from "../custom/master-data-grid/types";
import { scopedKey } from "../custom/master-data-grid/utils/url-scope";
import {
  readFilterValue,
  urlKeysOf,
} from "../custom/master-data-grid/utils/server-filter-utils";
import {
  applyFilterToParams,
  clearFiltersFromParams,
} from "../custom/master-data-grid/utils/server-filter-url";

const { navigateMock, routerPushMock, setSearchParams } = setupGridMocks();

// The helper's mocked usePathname.
const PATH = "/en/management/logs/audit";

interface Row {
  name: string;
}
const rows = (n: number): Row[] =>
  Array.from({ length: n }, (_, i) => ({ name: `Row ${i}` }));

const serverFilters: ServerFilterConfig[] = [
  {
    key: "userName",
    label: "User name",
    placeholder: "Type a name",
    type: "string",
  },
];

const range: ServerFilterConfig = {
  type: "date-range",
  key: "creationTime",
  keyFrom: "minCreationTime",
  keyTo: "maxCreationTime",
  label: "Created",
  placeholder: "p",
};

const statuses: ServerFilterConfig = {
  type: "array",
  key: "statuses",
  label: "Status",
  placeholder: "p",
  options: [
    { label: "Paid", value: "Paid" },
    { label: "Sent", value: "Sent" },
  ],
};

const pageText = () =>
  document.body.textContent?.match(
    /pagination\.page\s*\d+\s*pagination\.of\s*\d+/
  )?.[0];

async function commitUserName(
  user: ReturnType<typeof userEvent.setup>,
  value: string
) {
  await user.click(screen.getByTestId("server-filter-add"));
  await user.click(await screen.findByTestId("server-filter-option-userName"));
  const input = await screen.findByPlaceholderText("Type a name");
  await user.type(input, `${value}{Enter}`);
}

describe("default mode is unchanged", () => {
  it("removes a deep-linked skipCount on mount and pages with un-prefixed keys", async () => {
    const user = userEvent.setup();
    setSearchParams("skipCount=20");
    renderGrid(rows(10), { rowCount: 50, pageSize: 10 });
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

  it("commits, removes and resets server filters with un-prefixed keys", async () => {
    const user = userEvent.setup();
    setSearchParams("skipCount=10&other=keep");
    renderGrid(rows(10), { rowCount: 50, serverFilters });
    navigateMock.mockClear();

    await commitUserName(user, "john");
    expect(navigateMock).toHaveBeenNthCalledWith(
      1,
      `${PATH}?other=keep&userName=john`,
      undefined
    );
    expect(navigateMock).toHaveBeenCalledTimes(1);
  });

  it("removes a chip and resets with un-prefixed keys", async () => {
    const user = userEvent.setup();
    setSearchParams("userName=john&skipCount=10&other=keep");
    renderGrid(rows(10), { rowCount: 50, serverFilters });
    navigateMock.mockClear();

    await user.click(screen.getByTestId("server-filter-remove-userName"));
    expect(navigateMock).toHaveBeenNthCalledWith(
      1,
      `${PATH}?other=keep`,
      undefined
    );
    expect(navigateMock).toHaveBeenCalledTimes(1);
  });

  it("pushes the right-side panel's filters with un-prefixed keys", async () => {
    const user = userEvent.setup();
    setSearchParams("skipCount=10");
    renderGrid(rows(10), {
      rowCount: 50,
      serverFilters,
      serverFilterLocation: "right",
    });

    fireEvent.change(screen.getByPlaceholderText("Type a name"), {
      target: { value: "john" },
    });
    await user.click(screen.getByRole("button", { name: /filter\.apply/ }));
    await user.click(screen.getByRole("button", { name: /filter\.clear/ }));

    expect(routerPushMock).toHaveBeenNthCalledWith(1, `${PATH}?userName=john`, {
      scroll: false,
    });
    expect(routerPushMock).toHaveBeenNthCalledWith(2, PATH, { scroll: false });
    expect(routerPushMock).toHaveBeenCalledTimes(2);
  });
});

describe("prefix mode", () => {
  const a = { prefix: "a" };

  it("writes a.skipCount and keeps b.skipCount", async () => {
    const user = userEvent.setup();
    setSearchParams("b.skipCount=10");
    renderGrid(rows(10), { rowCount: 25, pageSize: 10, urlState: a });
    expect(navigateMock).not.toHaveBeenCalled();

    await user.click(screen.getByTitle("pagination.nextPage"));

    expect(navigateMock).toHaveBeenNthCalledWith(
      1,
      `${PATH}?b.skipCount=10&a.skipCount=10`,
      { replace: true }
    );
    expect(navigateMock).toHaveBeenCalledTimes(1);
  });

  it("starts on the page the URL names", () => {
    setSearchParams("a.skipCount=20&skipCount=40&b.skipCount=30");
    renderGrid(rows(10), { rowCount: 50, pageSize: 10, urlState: a });

    expect(pageText()).toBe("pagination.page 3 pagination.of 5");
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("takes the page size from a.maxResultCount", () => {
    setSearchParams("a.skipCount=40&a.maxResultCount=20&maxResultCount=50");
    renderGrid(rows(10), { rowCount: 50, pageSize: 10, urlState: a });

    expect(pageText()).toBe("pagination.page 3 pagination.of 3");
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("leaves a.maxResultCount out while it equals the grid's pageSize", async () => {
    const user = userEvent.setup();
    renderGrid(rows(10), { rowCount: 100, pageSize: 20, urlState: a });
    expect(navigateMock).not.toHaveBeenCalled();

    await user.click(screen.getByTitle("pagination.nextPage"));

    expect(navigateMock).toHaveBeenNthCalledWith(1, `${PATH}?a.skipCount=20`, {
      replace: true,
    });
    expect(navigateMock).toHaveBeenCalledTimes(1);
  });

  it("goes back to page one by deleting only a.skipCount", async () => {
    const user = userEvent.setup();
    setSearchParams("skipCount=5&a.skipCount=10");
    renderGrid(rows(10), { rowCount: 50, pageSize: 10, urlState: a });
    expect(pageText()).toBe("pagination.page 2 pagination.of 5");

    await user.click(screen.getByTitle("pagination.firstPage"));

    expect(navigateMock).toHaveBeenNthCalledWith(1, `${PATH}?skipCount=5`, {
      replace: true,
    });
    expect(navigateMock).toHaveBeenCalledTimes(1);
  });

  it("commits filters as a.key and drops only a.skipCount", async () => {
    const user = userEvent.setup();
    setSearchParams("skipCount=5&b.skipCount=10&b.userName=bob&a.skipCount=20");
    renderGrid(rows(10), { rowCount: 50, serverFilters, urlState: a });
    expect(navigateMock).not.toHaveBeenCalled();
    // b's userName belongs to the other grid.
    expect(screen.queryByTestId("server-filter-chip-userName")).toBeNull();

    await commitUserName(user, "john");

    expect(navigateMock).toHaveBeenNthCalledWith(
      1,
      `${PATH}?skipCount=5&b.skipCount=10&b.userName=bob&a.userName=john`,
      undefined
    );
    expect(navigateMock).toHaveBeenCalledTimes(1);
  });

  it("shows a.key as a chip and removes only a's keys", async () => {
    const user = userEvent.setup();
    setSearchParams(
      "userName=root&a.userName=john&a.skipCount=10&b.skipCount=10"
    );
    renderGrid(rows(10), { rowCount: 50, serverFilters, urlState: a });
    expect(screen.getByTestId("server-filter-chip-userName")).toHaveTextContent(
      "john"
    );

    await user.click(screen.getByTestId("server-filter-remove-userName"));

    expect(navigateMock).toHaveBeenNthCalledWith(
      1,
      `${PATH}?userName=root&b.skipCount=10`,
      undefined
    );
    expect(navigateMock).toHaveBeenCalledTimes(1);
  });

  it("pushes nothing when a chip is committed unchanged, whatever a.skipCount holds", async () => {
    const user = userEvent.setup();
    setSearchParams("a.userName=john&a.skipCount=10");
    renderGrid(rows(10), { rowCount: 50, serverFilters, urlState: a });

    await user.click(screen.getByTestId("server-filter-chip-userName"));
    await user.type(await screen.findByDisplayValue("john"), "{Enter}");

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("resets only a's filter keys and a.skipCount", async () => {
    const user = userEvent.setup();
    setSearchParams(
      "userName=root&a.userName=john&a.skipCount=20&a.maxResultCount=20&b.userName=bob"
    );
    renderGrid(rows(10), { rowCount: 50, serverFilters, urlState: a });
    expect(navigateMock).not.toHaveBeenCalled();

    await user.click(screen.getByTestId("server-filter-reset"));

    expect(navigateMock).toHaveBeenNthCalledWith(
      1,
      `${PATH}?userName=root&a.maxResultCount=20&b.userName=bob`,
      undefined
    );
    expect(navigateMock).toHaveBeenCalledTimes(1);
  });

  it("reads and writes a.key from the right-side panel", async () => {
    const user = userEvent.setup();
    setSearchParams(
      "userName=root&a.userName=john&a.skipCount=10&b.skipCount=10"
    );
    renderGrid(rows(10), {
      rowCount: 50,
      serverFilters,
      serverFilterLocation: "right",
      urlState: a,
    });
    const input = screen.getByPlaceholderText("Type a name");
    expect(input).toHaveValue("john");

    fireEvent.change(input, { target: { value: "jane" } });
    await user.click(screen.getByRole("button", { name: /filter\.apply/ }));
    expect(routerPushMock).toHaveBeenNthCalledWith(
      1,
      `${PATH}?userName=root&b.skipCount=10&a.userName=jane`,
      { scroll: false }
    );

    await user.click(screen.getByRole("button", { name: /filter\.clear/ }));
    expect(routerPushMock).toHaveBeenNthCalledWith(
      2,
      `${PATH}?userName=root&b.skipCount=10`,
      { scroll: false }
    );
    expect(routerPushMock).toHaveBeenCalledTimes(2);
    expect(navigateMock).not.toHaveBeenCalled();
  });
});

describe("none mode", () => {
  it("never navigates and reports page changes", async () => {
    const user = userEvent.setup();
    const onPaginationChange = jest.fn();
    setSearchParams("skipCount=20");
    renderGrid(rows(10), {
      rowCount: 50,
      pageSize: 10,
      urlState: "none",
      onPaginationChange,
    });
    expect(pageText()).toBe("pagination.page 1 pagination.of 5");

    await user.click(screen.getByTitle("pagination.nextPage"));

    expect(navigateMock).not.toHaveBeenCalled();
    expect(onPaginationChange).toHaveBeenCalledWith({
      pageIndex: 1,
      pageSize: 10,
    });
    expect(pageText()).toBe("pagination.page 2 pagination.of 5");
  });

  it("never navigates and reports server filter changes", async () => {
    const user = userEvent.setup();
    const onServerFiltersChange = jest.fn();
    setSearchParams("userName=root");
    renderGrid(rows(10), {
      rowCount: 50,
      serverFilters,
      urlState: "none",
      onServerFiltersChange,
    });
    // The URL's userName is not this grid's.
    expect(screen.queryByTestId("server-filter-chip-userName")).toBeNull();

    await commitUserName(user, "john");
    expect(onServerFiltersChange).toHaveBeenNthCalledWith(1, {
      userName: "john",
    });
    expect(screen.getByTestId("server-filter-chip-userName")).toHaveTextContent(
      "john"
    );

    await user.click(screen.getByTestId("server-filter-remove-userName"));
    expect(onServerFiltersChange).toHaveBeenNthCalledWith(2, {});
    expect(screen.queryByTestId("server-filter-chip-userName")).toBeNull();

    await commitUserName(user, "jane");
    await user.click(screen.getByTestId("server-filter-reset"));
    expect(onServerFiltersChange).toHaveBeenNthCalledWith(3, {
      userName: "jane",
    });
    expect(onServerFiltersChange).toHaveBeenNthCalledWith(4, {});
    expect(onServerFiltersChange).toHaveBeenCalledTimes(4);

    expect(navigateMock).not.toHaveBeenCalled();
    expect(routerPushMock).not.toHaveBeenCalled();
  });

  it("reports the right-side panel's filters instead of pushing", async () => {
    const user = userEvent.setup();
    const onServerFiltersChange = jest.fn();
    setSearchParams("userName=root");
    renderGrid(rows(10), {
      rowCount: 50,
      serverFilters,
      serverFilterLocation: "right",
      urlState: "none",
      onServerFiltersChange,
    });
    const input = screen.getByPlaceholderText("Type a name");
    expect(input).toHaveValue("");

    fireEvent.change(input, { target: { value: "john" } });
    await user.click(screen.getByRole("button", { name: /filter\.apply/ }));
    expect(onServerFiltersChange).toHaveBeenNthCalledWith(1, {
      userName: "john",
    });

    await user.click(screen.getByRole("button", { name: /filter\.clear/ }));
    expect(onServerFiltersChange).toHaveBeenNthCalledWith(2, {});
    expect(onServerFiltersChange).toHaveBeenCalledTimes(2);

    expect(routerPushMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});

describe("getGridUrlParams", () => {
  it("reads one grid's keys", () => {
    expect(
      getGridUrlParams(
        { "a.skipCount": "20", "a.userName": "x", skipCount: "5" },
        { prefix: "a", filters: serverFilters }
      )
    ).toEqual({
      skipCount: 20,
      maxResultCount: 10,
      filters: { userName: "x" },
    });
  });

  it("reads un-prefixed keys, repeated values and ranges from URLSearchParams", () => {
    const params = new URLSearchParams(
      "skipCount=30&maxResultCount=15&statuses=Paid&statuses=Sent&minCreationTime=2026-01-01&a.userName=x"
    );
    expect(
      getGridUrlParams(params, {
        filters: [...serverFilters, statuses, range],
      })
    ).toEqual({
      skipCount: 30,
      maxResultCount: 15,
      filters: {
        statuses: ["Paid", "Sent"],
        creationTime: { from: "2026-01-01", to: undefined },
      },
    });
  });

  it("reads array values from a page's searchParams record", () => {
    expect(
      getGridUrlParams(
        { "b.statuses": ["Paid", "Sent"], "b.userName": undefined },
        { prefix: "b", filters: [...serverFilters, statuses] }
      ).filters
    ).toEqual({ statuses: ["Paid", "Sent"] });
  });

  it("falls back to pageSize and to zero for missing or bad numbers", () => {
    expect(getGridUrlParams({}, { pageSize: 25 })).toEqual({
      skipCount: 0,
      maxResultCount: 25,
      filters: {},
    });
    expect(
      getGridUrlParams({ skipCount: "-5", maxResultCount: "abc" })
    ).toEqual({ skipCount: 0, maxResultCount: 10, filters: {} });
  });
});

describe("URL helpers take an optional prefix", () => {
  it("scopes a key only when a prefix is given", () => {
    expect(scopedKey("skipCount")).toBe("skipCount");
    expect(scopedKey("skipCount", "a")).toBe("a.skipCount");
  });

  it("scopes a filter's URL keys", () => {
    expect(urlKeysOf(range)).toEqual(["minCreationTime", "maxCreationTime"]);
    expect(urlKeysOf(range, "a")).toEqual([
      "a.minCreationTime",
      "a.maxCreationTime",
    ]);
    expect(urlKeysOf(statuses, "a")).toEqual(["a.statuses"]);
  });

  it("reads a filter from its scoped keys only", () => {
    const params = new URLSearchParams(
      "statuses=Sent&a.statuses=Paid&minCreationTime=x&a.maxCreationTime=2026-02-01"
    );
    expect(readFilterValue(statuses, params, "a")).toEqual(["Paid"]);
    expect(readFilterValue(range, params, "a")).toEqual({
      from: undefined,
      to: "2026-02-01",
    });
    expect(readFilterValue(statuses, params)).toEqual(["Sent"]);
  });

  it("applies a filter to scoped keys and drops only the scoped skipCount", () => {
    const params = new URLSearchParams(
      "skipCount=5&a.skipCount=10&a.statuses=Sent&statuses=Paid"
    );
    expect(
      applyFilterToParams(params, statuses, ["Paid", "Sent"], "a").toString()
    ).toBe("skipCount=5&statuses=Paid&a.statuses=Paid&a.statuses=Sent");
    expect(
      applyFilterToParams(
        params,
        range,
        { from: "2026-01-01", to: "2026-01-31" },
        "a"
      ).toString()
    ).toBe(
      "skipCount=5&a.statuses=Sent&statuses=Paid&a.minCreationTime=2026-01-01&a.maxCreationTime=2026-01-31"
    );
  });

  it("clears scoped filter keys and the scoped skipCount only", () => {
    const params = new URLSearchParams(
      "skipCount=5&a.skipCount=10&a.statuses=Sent&statuses=Paid&a.minCreationTime=x&sorting=name"
    );
    expect(
      clearFiltersFromParams(params, [statuses, range], "a").toString()
    ).toBe("skipCount=5&statuses=Paid&sorting=name");
  });
});
