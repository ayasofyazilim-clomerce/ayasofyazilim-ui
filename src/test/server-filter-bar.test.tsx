import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ServerFilterBar } from "../custom/master-data-grid/components/filters/server-filter-bar";
import type {
  MasterDataGridConfig,
  ServerFilterConfig,
} from "../custom/master-data-grid/types";

const push = jest.fn();
let search = new URLSearchParams();

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

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: (...args: unknown[]) => push(...args) }),
  usePathname: () => "/en/management/logs/audit",
  useSearchParams: () => search,
}));

beforeEach(() => {
  push.mockClear();
  search = new URLSearchParams();
});

const filters: ServerFilterConfig[] = [
  {
    type: "string",
    key: "userName",
    label: "User Name",
    placeholder: "Filter with User Name",
  },
  {
    type: "string",
    key: "url",
    label: "URL",
    placeholder: "Filter with URL",
  },
  {
    type: "date-range",
    key: "executionTime",
    keyFrom: "startTime",
    keyTo: "endTime",
    label: "Date",
    placeholder: "Filter with Date",
  },
  {
    type: "select",
    key: "httpMethod",
    label: "HTTP Method",
    placeholder: "Filter with HTTP Method",
    options: [
      { label: "GET", value: "GET" },
      { label: "POST", value: "POST" },
    ],
  },
];

function config(
  serverFilters: ServerFilterConfig[] = filters
): MasterDataGridConfig<{ name: string }> {
  return {
    localization: { locale: "en-GB", timeZone: "UTC", lang: "en" },
    schema: { type: "object", properties: { name: { type: "string" } } },
    serverFilters,
    t: {
      "filter.addFilter": "Add Filter",
      "filter.selectColumn": "Select column...",
      "filter.resetFilters": "Reset filters",
    } as MasterDataGridConfig<{ name: string }>["t"],
  };
}

const lastPush = () => String(push.mock.calls[push.mock.calls.length - 1][0]);

describe("ServerFilterBar", () => {
  it("renders nothing when no filters are configured", () => {
    const { container } = render(<ServerFilterBar config={config([])} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders only the Add Filter trigger when nothing is applied", () => {
    render(<ServerFilterBar config={config()} />);
    expect(screen.getByTestId("server-filter-add")).toBeInTheDocument();
    expect(screen.queryByTestId("server-filter-chip-userName")).toBeNull();
  });

  it("renders a chip for each filter present in the URL", () => {
    search = new URLSearchParams("userName=john&httpMethod=POST");
    render(<ServerFilterBar config={config()} />);
    expect(
      screen.getByTestId("server-filter-chip-userName")
    ).toHaveTextContent("john");
    expect(
      screen.getByTestId("server-filter-chip-httpMethod")
    ).toHaveTextContent("POST");
    expect(screen.queryByTestId("server-filter-chip-url")).toBeNull();
  });

  it("renders a range chip from both endpoint keys", () => {
    search = new URLSearchParams(
      "startTime=2026-09-01T00:00:00Z&endTime=2026-09-08T00:00:00Z"
    );
    render(<ServerFilterBar config={config()} />);
    expect(
      screen.getByTestId("server-filter-chip-executionTime")
    ).toHaveTextContent("01/09/2026 – 08/09/2026");
  });

  it("offers only unset filters in the palette", async () => {
    const user = userEvent.setup();
    search = new URLSearchParams("userName=john");
    render(<ServerFilterBar config={config()} />);
    await user.click(screen.getByTestId("server-filter-add"));
    expect(screen.getByTestId("server-filter-option-url")).toBeInTheDocument();
    expect(screen.queryByTestId("server-filter-option-userName")).toBeNull();
  });

  it("never offers a filter whose when is false", async () => {
    const user = userEvent.setup();
    render(
      <ServerFilterBar
        config={config([
          ...filters,
          {
            type: "string",
            key: "secret",
            label: "Secret",
            placeholder: "Secret",
            when: false,
          },
        ])}
      />
    );
    await user.click(screen.getByTestId("server-filter-add"));
    expect(screen.queryByTestId("server-filter-option-secret")).toBeNull();
  });

  it("removes a filter and drops skipCount", () => {
    search = new URLSearchParams("userName=john&skipCount=20&sorting=url%20asc");
    render(<ServerFilterBar config={config()} />);
    fireEvent.click(screen.getByTestId("server-filter-remove-userName"));
    const url = lastPush();
    expect(url).not.toContain("userName");
    expect(url).not.toContain("skipCount");
    expect(url).toContain("sorting=url+asc");
  });

  it("removes both endpoint keys when a range chip is removed", () => {
    search = new URLSearchParams(
      "startTime=2026-09-01&endTime=2026-09-08&userName=john"
    );
    render(<ServerFilterBar config={config()} />);
    fireEvent.click(screen.getByTestId("server-filter-remove-executionTime"));
    const url = lastPush();
    expect(url).not.toContain("startTime");
    expect(url).not.toContain("endTime");
    expect(url).toContain("userName=john");
  });

  it("does not show Reset when nothing is applied", () => {
    render(<ServerFilterBar config={config()} />);
    expect(screen.queryByTestId("server-filter-reset")).toBeNull();
  });

  it("shows Reset when a filter is applied", () => {
    search = new URLSearchParams("userName=john");
    render(<ServerFilterBar config={config()} />);
    expect(screen.getByTestId("server-filter-reset")).toBeInTheDocument();
  });

  it("resets the config's keys but keeps sorting", () => {
    search = new URLSearchParams(
      "userName=john&startTime=2026-09-01&sorting=url%20asc"
    );
    render(<ServerFilterBar config={config()} />);
    fireEvent.click(screen.getByTestId("server-filter-reset"));
    const url = lastPush();
    expect(url).not.toContain("userName");
    expect(url).not.toContain("startTime");
    expect(url).toContain("sorting=url+asc");
  });

  it("commits a text value into the URL", async () => {
    const user = userEvent.setup();
    render(<ServerFilterBar config={config()} />);
    await user.click(screen.getByTestId("server-filter-add"));
    await user.click(screen.getByTestId("server-filter-option-userName"));
    const input = screen.getByPlaceholderText("Filter with User Name");
    fireEvent.change(input, { target: { value: "john" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(lastPush()).toContain("userName=john");
  });

  it("keeps a chip's editor open with no push after selecting it from the palette", async () => {
    const user = userEvent.setup();
    render(<ServerFilterBar config={config()} />);
    await user.click(screen.getByTestId("server-filter-add"));
    await user.click(screen.getByTestId("server-filter-option-userName"));
    expect(
      screen.getByTestId("server-filter-chip-userName")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Filter with User Name")
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("does not push when a chip's editor is opened and closed without editing", async () => {
    const user = userEvent.setup();
    search = new URLSearchParams("userName=john");
    render(<ServerFilterBar config={config()} />);
    await user.click(screen.getByTestId("server-filter-chip-userName"));
    const input = screen.getByPlaceholderText("Filter with User Name");
    fireEvent.blur(input);
    expect(push).not.toHaveBeenCalled();
  });

  it("does not push while a validator is failing", async () => {
    const user = userEvent.setup();
    const withValidator: ServerFilterConfig[] = [
      {
        type: "string",
        key: "email",
        label: "Email",
        placeholder: "Filter with Email",
        validator: {
          safeParse: (value: unknown) =>
            String(value).includes("@")
              ? { success: true, data: value }
              : {
                  success: false,
                  error: { issues: [{ message: "Invalid email" }] },
                },
        },
      } as unknown as ServerFilterConfig,
    ];
    render(<ServerFilterBar config={config(withValidator)} />);
    await user.click(screen.getByTestId("server-filter-add"));
    await user.click(screen.getByTestId("server-filter-option-email"));
    const input = screen.getByPlaceholderText("Filter with Email");
    fireEvent.change(input, { target: { value: "john" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByText("Invalid email")).toBeInTheDocument();
  });

  it("filters the palette by the typed query", async () => {
    const user = userEvent.setup();
    render(<ServerFilterBar config={config()} />);
    await user.click(screen.getByTestId("server-filter-add"));
    fireEvent.change(screen.getByPlaceholderText("Select column..."), {
      target: { value: "method" },
    });
    expect(
      screen.getByTestId("server-filter-option-httpMethod")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("server-filter-option-url")).toBeNull();
  });
});
