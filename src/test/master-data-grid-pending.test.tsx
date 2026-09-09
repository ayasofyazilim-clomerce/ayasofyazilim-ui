import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCallback, useState } from "react";
import { MasterDataGrid } from "../custom/master-data-grid/components/master-data-grid";
import type {
  MasterDataGridConfig,
  ServerFilterConfig,
} from "../custom/master-data-grid/types";

const navigateMock = jest.fn();
const NAV_DURATION_MS = 400;

jest.mock("../custom/master-data-grid/hooks/use-grid-navigation", () => ({
  useGridNavigation: () => {
    const [isNavigating, setIsNavigating] = useState(false);
    const navigate = useCallback(
      (url: string, options?: { replace?: boolean }) => {
        navigateMock(url, options);
        setIsNavigating(true);
        setTimeout(() => setIsNavigating(false), NAV_DURATION_MS);
      },
      []
    );
    return { navigate, isNavigating };
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/en/management/logs/audit",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }: { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

beforeAll(() => {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })) as unknown as typeof window.matchMedia;
});

beforeEach(() => {
  navigateMock.mockClear();
  jest.useFakeTimers();
});

afterEach(() => {
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

interface Row {
  name: string;
}

const data: Row[] = Array.from({ length: 10 }, (_, index) => ({
  name: `row-${index}`,
}));

const serverFilters: ServerFilterConfig[] = [
  {
    type: "string",
    key: "userName",
    label: "User Name",
    placeholder: "Filter with User Name",
  },
];

const baseConfig: MasterDataGridConfig<Row> = {
  localization: { locale: "en-US", timeZone: "UTC", lang: "en" },
  schema: { type: "object", properties: { name: { type: "string" } } },
  columns: [{ id: "name", accessorKey: "name", header: "Name" }],
  t: {
    "filter.addFilter": "Add Filter",
    "filter.selectColumn": "Select column...",
    "pagination.nextPage": "Next page",
  } as MasterDataGridConfig<Row>["t"],
};

const wrapper = () =>
  (
    document.querySelector('[data-slot="table-container"]') as HTMLElement
  ).parentElement as HTMLElement;

const advance = async (ms: number) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};

describe("MasterDataGrid pending navigation feedback", () => {
  it("raises the treatment after committing a filter, replacing the row count with a spinner", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <MasterDataGrid
        data={data}
        config={{ ...baseConfig, serverFilters, rowCount: 10 }}
      />
    );

    await user.click(screen.getByTestId("server-filter-add"));
    await user.click(screen.getByTestId("server-filter-option-userName"));
    const input = screen.getByPlaceholderText("Filter with User Name");
    fireEvent.change(input, { target: { value: "john" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(wrapper()).not.toHaveAttribute("aria-busy");
    expect(screen.queryByTestId("lucide-loader2")).toBeNull();

    await advance(150);

    expect(wrapper()).toHaveAttribute("aria-busy", "true");
    expect(screen.getByTestId("lucide-loader2")).toBeInTheDocument();
  });

  it("raises the treatment when changing page", async () => {
    const { rerender } = render(
      <MasterDataGrid
        data={data}
        config={{ ...baseConfig, rowCount: 25, pageSize: 10 }}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: baseConfig.t!["pagination.nextPage"] })
    );
    rerender(
      <MasterDataGrid
        data={data}
        config={{ ...baseConfig, rowCount: 25, pageSize: 10 }}
      />
    );

    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringContaining("skipCount=10"),
      { replace: true }
    );

    await advance(150);

    expect(wrapper()).toHaveAttribute("aria-busy", "true");
    expect(screen.getByTestId("lucide-loader2")).toBeInTheDocument();
  });

  it("raises the treatment when config.loading is true with no navigation at all", async () => {
    render(<MasterDataGrid data={data} config={{ ...baseConfig, loading: true }} />);

    expect(navigateMock).not.toHaveBeenCalled();
    expect(wrapper()).not.toHaveAttribute("aria-busy");

    await advance(150);

    expect(wrapper()).toHaveAttribute("aria-busy", "true");
    expect(screen.getByTestId("lucide-loader2")).toBeInTheDocument();
  });

  it("clears the treatment when the navigation lands", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <MasterDataGrid
        data={data}
        config={{ ...baseConfig, serverFilters, rowCount: 10 }}
      />
    );

    await user.click(screen.getByTestId("server-filter-add"));
    await user.click(screen.getByTestId("server-filter-option-userName"));
    const input = screen.getByPlaceholderText("Filter with User Name");
    fireEvent.change(input, { target: { value: "john" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await advance(150);
    expect(wrapper()).toHaveAttribute("aria-busy", "true");

    await advance(NAV_DURATION_MS - 150);
    expect(wrapper()).not.toHaveAttribute("aria-busy");
    expect(screen.queryByTestId("lucide-loader2")).toBeNull();
  });

  it("lets config.loadingComponent replace the treatment entirely", async () => {
    render(
      <MasterDataGrid
        data={data}
        config={{
          ...baseConfig,
          loading: true,
          loadingComponent: <div data-testid="custom-loader">Loading…</div>,
        }}
      />
    );

    await advance(150);

    expect(screen.getByTestId("custom-loader")).toBeInTheDocument();
    expect(wrapper().className).not.toContain("opacity-45");
    expect(screen.queryByTestId("lucide-loader2")).toBeNull();
  });

  it("keeps the filter bar's controls interactive while pending", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <MasterDataGrid
        data={data}
        config={{ ...baseConfig, serverFilters, rowCount: 10 }}
      />
    );

    await user.click(screen.getByTestId("server-filter-add"));
    await user.click(screen.getByTestId("server-filter-option-userName"));
    const input = screen.getByPlaceholderText("Filter with User Name");
    fireEvent.change(input, { target: { value: "john" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await advance(150);
    expect(wrapper()).toHaveAttribute("aria-busy", "true");

    const addButton = screen.getByTestId("server-filter-add");
    expect(addButton).not.toBeDisabled();
    await user.click(addButton);
    expect(
      screen.getByPlaceholderText("Select column...")
    ).toBeInTheDocument();
  });

  it("renders nothing before the delay elapses", () => {
    render(<MasterDataGrid data={data} config={{ ...baseConfig, loading: true }} />);

    expect(wrapper()).not.toHaveAttribute("aria-busy");
    expect(screen.queryByTestId("lucide-loader2")).toBeNull();
  });
});
