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
  });

  it("removes a deep-linked skipCount on mount (today's behaviour)", () => {
    setSearchParams("skipCount=20");
    renderGrid(rows(10), { rowCount: 50, pageSize: 10 });
    expect(navigateMock).toHaveBeenCalledWith(`${PATH}?`, { replace: true });
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
  });

  it("resets all server filters", async () => {
    const user = userEvent.setup();
    setSearchParams("userName=john&skipCount=10&other=keep");
    renderGrid(rows(10), { rowCount: 50, serverFilters });
    navigateMock.mockClear();

    await user.click(screen.getByTestId("server-filter-reset"));

    expect(navigateMock).toHaveBeenCalledWith(`${PATH}?other=keep`, undefined);
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

    await user.click(screen.getByRole("button", { name: /filter\.clear/ }));
    expect(routerPushMock).toHaveBeenLastCalledWith(PATH, { scroll: false });
  });
});
