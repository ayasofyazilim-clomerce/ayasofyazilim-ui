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

const statusFilter: ServerFilterConfig = {
  type: "array",
  key: "status",
  label: "Status",
  placeholder: "Filter with Status",
  options: [
    { label: "Active", value: "ACTIVE" },
    { label: "Inactive", value: "INACTIVE" },
  ],
};

const isActiveFilter: ServerFilterConfig = {
  type: "boolean",
  key: "isActive",
  label: "Is Active",
  placeholder: "Filter with Is Active",
  options: [
    { label: "Yes", value: true },
    { label: "No", value: false },
  ],
};

const issueDateFilter: ServerFilterConfig = {
  type: "date",
  key: "issueDate",
  label: "Issue Date",
  placeholder: "Filter with Issue Date",
};

const tagsFilter: ServerFilterConfig = {
  type: "string-array",
  key: "tags",
  label: "Tags",
  placeholder: "Filter with Tags",
};

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

  it("commits a select value from a chip added via the palette, reproducing the reported bug", async () => {
    const user = userEvent.setup();
    render(<ServerFilterBar config={config()} />);
    await user.click(screen.getByTestId("server-filter-add"));
    await user.click(screen.getByTestId("server-filter-option-httpMethod"));
    const trigger = document.getElementById("httpMethod") as HTMLElement;
    await user.click(trigger);
    await user.click(screen.getByText("GET"));
    expect(lastPush()).toContain("httpMethod=GET");
    expect(push).toHaveBeenCalledTimes(1);
  });

  it("commits an array value with two picks, writing both entries", async () => {
    const user = userEvent.setup();
    render(<ServerFilterBar config={config([statusFilter])} />);
    await user.click(screen.getByTestId("server-filter-add"));
    await user.click(screen.getByTestId("server-filter-option-status"));
    const trigger = document.getElementById("status") as HTMLElement;
    await user.click(trigger);
    await user.click(screen.getByText("Active"));
    await user.click(screen.getByText("Inactive"));
    await user.click(screen.getByTestId("server-filter-chip-status"));
    const url = lastPush();
    expect(url).toContain("status=ACTIVE");
    expect(url).toContain("status=INACTIVE");
  });

  it("merges a further pick into the URL value when a multi-value chip is reopened", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ServerFilterBar config={config([statusFilter])} />
    );
    await user.click(screen.getByTestId("server-filter-add"));
    await user.click(screen.getByTestId("server-filter-option-status"));
    let trigger = document.getElementById("status") as HTMLElement;
    await user.click(trigger);
    await user.click(screen.getByText("Active"));
    await user.click(screen.getByTestId("server-filter-chip-status"));
    expect(lastPush()).toContain("status=ACTIVE");

    search = new URLSearchParams("status=ACTIVE");
    rerender(<ServerFilterBar config={config([statusFilter])} />);

    await user.click(screen.getByTestId("server-filter-chip-status"));
    trigger = document.getElementById("status") as HTMLElement;
    await user.click(trigger);
    await user.click(screen.getByText("Inactive"));
    await user.click(screen.getByTestId("server-filter-chip-status"));
    const url = lastPush();
    expect(url).toContain("status=ACTIVE");
    expect(url).toContain("status=INACTIVE");
  });

  it("batches two array picks into a single push instead of one per pick", async () => {
    const user = userEvent.setup();
    render(<ServerFilterBar config={config([statusFilter])} />);
    await user.click(screen.getByTestId("server-filter-add"));
    await user.click(screen.getByTestId("server-filter-option-status"));
    const trigger = document.getElementById("status") as HTMLElement;
    await user.click(trigger);
    await user.click(screen.getByText("Active"));
    await user.click(screen.getByText("Inactive"));
    expect(push).not.toHaveBeenCalled();
    await user.click(screen.getByTestId("server-filter-chip-status"));
    expect(push).toHaveBeenCalledTimes(1);
  });

  it("commits a string-array value with two tags, writing both entries", async () => {
    const user = userEvent.setup();
    render(<ServerFilterBar config={config([tagsFilter])} />);
    await user.click(screen.getByTestId("server-filter-add"));
    await user.click(screen.getByTestId("server-filter-option-tags"));
    const input = screen.getByPlaceholderText("Filter with Tags");
    fireEvent.change(input, { target: { value: "alpha" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.change(input, { target: { value: "beta" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(push).not.toHaveBeenCalled();
    await user.click(screen.getByTestId("server-filter-chip-tags"));
    const url = lastPush();
    expect(url).toContain("tags=alpha");
    expect(url).toContain("tags=beta");
    expect(push).toHaveBeenCalledTimes(1);
  });

  it("drops a batching chip added from the palette and closed without a pick, pushing nothing", async () => {
    const user = userEvent.setup();
    render(<ServerFilterBar config={config([statusFilter])} />);
    await user.click(screen.getByTestId("server-filter-add"));
    await user.click(screen.getByTestId("server-filter-option-status"));
    expect(
      screen.getByTestId("server-filter-chip-status")
    ).toBeInTheDocument();
    await user.click(screen.getByTestId("server-filter-chip-status"));
    expect(push).not.toHaveBeenCalled();
    expect(screen.queryByTestId("server-filter-chip-status")).toBeNull();
  });

  it("commits a boolean value, including false", async () => {
    const user = userEvent.setup();
    render(<ServerFilterBar config={config([isActiveFilter])} />);
    await user.click(screen.getByTestId("server-filter-add"));
    await user.click(screen.getByTestId("server-filter-option-isActive"));
    const trigger = document.getElementById("isActive") as HTMLElement;
    await user.click(trigger);
    await user.click(screen.getByText("No"));
    expect(lastPush()).toContain("isActive=false");
    expect(push).toHaveBeenCalledTimes(1);
  });

  it("commits a date value, writing the key", async () => {
    const user = userEvent.setup();
    render(<ServerFilterBar config={config([issueDateFilter])} />);
    await user.click(screen.getByTestId("server-filter-add"));
    await user.click(screen.getByTestId("server-filter-option-issueDate"));
    const calendarIcon = screen.getByTestId("issueDate_calendar_icon");
    await user.click(calendarIcon);
    await user.click(screen.getByRole("button", { name: /^Today,/ }));
    expect(lastPush()).toContain("issueDate=");
    expect(push).toHaveBeenCalledTimes(1);
  });

  it("commits a date-range value, writing both keyFrom and keyTo", async () => {
    const user = userEvent.setup();
    render(<ServerFilterBar config={config()} />);
    await user.click(screen.getByTestId("server-filter-add"));
    await user.click(screen.getByTestId("server-filter-option-executionTime"));
    const calendarIcon = screen.getByTestId("executionTime_calendar_icon");
    await user.click(calendarIcon);
    await user.click(screen.getByRole("button", { name: /^Today,/ }));
    await user.keyboard("{ArrowRight}{Enter}");
    expect(push).not.toHaveBeenCalled();
    await user.click(screen.getByTestId("server-filter-chip-executionTime"));
    const url = lastPush();
    expect(url).toContain("startTime=");
    expect(url).toContain("endTime=");
    expect(push).toHaveBeenCalledTimes(1);
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

  it("does not push or disturb skipCount when a chip is committed without editing", async () => {
    const user = userEvent.setup();
    search = new URLSearchParams("userName=john&skipCount=20");
    render(<ServerFilterBar config={config()} />);
    await user.click(screen.getByTestId("server-filter-chip-userName"));
    const input = screen.getByPlaceholderText("Filter with User Name");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(push).not.toHaveBeenCalled();
  });

  it("still pushes and drops skipCount when a filter's value genuinely changes", async () => {
    const user = userEvent.setup();
    search = new URLSearchParams("userName=john&skipCount=20");
    render(<ServerFilterBar config={config()} />);
    await user.click(screen.getByTestId("server-filter-chip-userName"));
    const input = screen.getByPlaceholderText("Filter with User Name");
    fireEvent.change(input, { target: { value: "jane" } });
    fireEvent.keyDown(input, { key: "Enter" });
    const url = lastPush();
    expect(url).toContain("userName=jane");
    expect(url).not.toContain("skipCount");
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

  it("clears a stale validation error when reverting to the committed value", async () => {
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
    search = new URLSearchParams("email=john%40example.com");
    render(<ServerFilterBar config={config(withValidator)} />);
    await user.click(screen.getByTestId("server-filter-chip-email"));
    const input = screen.getByPlaceholderText("Filter with Email");
    fireEvent.change(input, { target: { value: "not-an-email" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("Invalid email")).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "john@example.com" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(push).not.toHaveBeenCalled();
    expect(screen.queryByText("Invalid email")).toBeNull();
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
