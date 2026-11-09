// Import the helper FIRST: its jest.mock calls must register before the grid loads.
import { renderGrid, setupGridMocks } from "./helpers/grid-test-setup";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { navigateMock, routerPushMock, setSearchParams } = setupGridMocks();

// The helper's mocked usePathname.
const PATH = "/en/management/logs/audit";

interface Row {
  name: string;
}
const rows = (n: number): Row[] =>
  Array.from({ length: n }, (_, i) => ({ name: `Row ${i}` }));

const serverFilters = [
  {
    key: "userName",
    label: "User name",
    placeholder: "Type a name",
    type: "string" as const,
  },
];

describe("MasterDataGrid paging URL today (characterization)", () => {
  it("writes skipCount with replace on next page", async () => {
    const user = userEvent.setup();
    renderGrid(rows(10), { rowCount: 25, pageSize: 10 });
    navigateMock.mockClear();
    await user.click(screen.getByTitle("pagination.nextPage"));
    expect(navigateMock).toHaveBeenCalledWith(`${PATH}?skipCount=10`, {
      replace: true,
    });
    expect(navigateMock).toHaveBeenCalledTimes(1);
  });

  it("removes a deep-linked skipCount on mount (today's behaviour)", () => {
    setSearchParams("skipCount=20");
    renderGrid(rows(10), { rowCount: 50, pageSize: 10 });
    expect(navigateMock).toHaveBeenCalledWith(`${PATH}?`, { replace: true });
    expect(navigateMock).toHaveBeenCalledTimes(1);
  });
});

describe("MasterDataGrid paging moves today (characterization)", () => {
  beforeAll(() => {
    // Radix Select needs these, and jsdom lacks them.
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.releasePointerCapture = () => undefined;
    Element.prototype.scrollIntoView = () => undefined;
  });

  // Let the mocked URL follow each navigation, as the real router would, so
  // the next move compares against the page it is actually on.
  beforeEach(() => {
    navigateMock.mockImplementation((url: string) => {
      setSearchParams(url.split("?")[1] ?? "");
    });
  });
  afterEach(() => navigateMock.mockReset());

  it("goes back a page and to the first page", async () => {
    const user = userEvent.setup();
    renderGrid(rows(10), { rowCount: 50, pageSize: 10 });

    await user.click(screen.getByTitle("pagination.nextPage"));
    await user.click(screen.getByTitle("pagination.nextPage"));
    expect(navigateMock).toHaveBeenNthCalledWith(1, `${PATH}?skipCount=10`, {
      replace: true,
    });
    expect(navigateMock).toHaveBeenNthCalledWith(2, `${PATH}?skipCount=20`, {
      replace: true,
    });
    expect(navigateMock).toHaveBeenCalledTimes(2);

    navigateMock.mockClear();
    await user.click(screen.getByTitle("pagination.previousPage"));
    expect(navigateMock).toHaveBeenNthCalledWith(1, `${PATH}?skipCount=10`, {
      replace: true,
    });
    expect(navigateMock).toHaveBeenCalledTimes(1);

    navigateMock.mockClear();
    await user.click(screen.getByTitle("pagination.firstPage"));
    expect(navigateMock).toHaveBeenNthCalledWith(1, `${PATH}?`, {
      replace: true,
    });
    expect(navigateMock).toHaveBeenCalledTimes(1);
  });

  it("writes maxResultCount when the page size changes on page one", async () => {
    const user = userEvent.setup();
    renderGrid(rows(10), { rowCount: 50, pageSize: 10 });
    navigateMock.mockClear();

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "20" }));

    expect(navigateMock).toHaveBeenNthCalledWith(
      1,
      `${PATH}?maxResultCount=20`,
      { replace: true }
    );
    expect(navigateMock).toHaveBeenCalledTimes(1);
  });

  it("appends maxResultCount after skipCount when the page size changes on page three", async () => {
    const user = userEvent.setup();
    renderGrid(rows(10), { rowCount: 50, pageSize: 10 });
    await user.click(screen.getByTitle("pagination.nextPage"));
    await user.click(screen.getByTitle("pagination.nextPage"));
    navigateMock.mockClear();

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "20" }));

    expect(navigateMock).toHaveBeenNthCalledWith(
      1,
      `${PATH}?skipCount=20&maxResultCount=20`,
      { replace: true }
    );
    expect(navigateMock).toHaveBeenCalledTimes(1);
  });
});

describe("MasterDataGrid server filters today (characterization)", () => {
  it("commits a string server filter as an un-prefixed key and drops skipCount", async () => {
    const user = userEvent.setup();
    setSearchParams("skipCount=10");
    renderGrid(rows(10), { rowCount: 50, serverFilters });
    navigateMock.mockClear();

    await user.click(screen.getByTestId("server-filter-add"));
    await user.click(await screen.findByTestId("server-filter-option-userName"));
    const input = await screen.findByPlaceholderText("Type a name");
    await user.type(input, "john{Enter}");

    expect(navigateMock).toHaveBeenCalledWith(`${PATH}?userName=john`, undefined);
    expect(navigateMock).toHaveBeenCalledTimes(1);
  });

  it("resets all server filters", async () => {
    const user = userEvent.setup();
    setSearchParams("userName=john&skipCount=10&other=keep");
    renderGrid(rows(10), { rowCount: 50, serverFilters });
    navigateMock.mockClear();

    await user.click(screen.getByTestId("server-filter-reset"));

    expect(navigateMock).toHaveBeenCalledWith(`${PATH}?other=keep`, undefined);
    expect(navigateMock).toHaveBeenCalledTimes(1);
  });

  it("removes a single chip, dropping its key and skipCount", async () => {
    const user = userEvent.setup();
    setSearchParams("userName=john&skipCount=10&other=keep");
    renderGrid(rows(10), { rowCount: 50, serverFilters });
    navigateMock.mockClear();

    await user.click(screen.getByTestId("server-filter-remove-userName"));

    expect(navigateMock).toHaveBeenNthCalledWith(1, `${PATH}?other=keep`, undefined);
    expect(navigateMock).toHaveBeenCalledTimes(1);
  });

  it("pushes from the right-side panel with router.push and scroll:false", async () => {
    const user = userEvent.setup();
    setSearchParams("skipCount=10");
    renderGrid(rows(10), {
      rowCount: 50,
      serverFilters,
      serverFilterLocation: "right",
    });
    routerPushMock.mockClear();

    fireEvent.change(screen.getByPlaceholderText("Type a name"), {
      target: { value: "john" },
    });
    await user.click(screen.getByRole("button", { name: /filter\.apply/ }));

    expect(routerPushMock).toHaveBeenCalledWith(`${PATH}?userName=john`, {
      scroll: false,
    });
    expect(routerPushMock).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: /filter\.clear/ }));
    expect(routerPushMock).toHaveBeenLastCalledWith(PATH, { scroll: false });
    expect(routerPushMock).toHaveBeenCalledTimes(2);
  });
});
