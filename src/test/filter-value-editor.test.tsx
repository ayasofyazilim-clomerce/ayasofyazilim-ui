import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { FilterValueEditor } from "../custom/master-data-grid/components/filters/filter-value-editor";
import type { ServerFilterConfig } from "../custom/master-data-grid/types";

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

const str: ServerFilterConfig = {
  type: "string",
  key: "userName",
  label: "User Name",
  placeholder: "Filter with User Name",
};

const date: ServerFilterConfig = {
  type: "date",
  key: "issueDate",
  label: "Issue Date",
  placeholder: "Issue Date",
};

const dateRange: ServerFilterConfig = {
  type: "date-range",
  key: "issueDate",
  keyFrom: "issueDateFrom",
  keyTo: "issueDateTo",
  label: "Issue Date",
  placeholder: "Issue Date",
};

describe("FilterValueEditor", () => {
  it("renders a text input carrying the current value", () => {
    render(
      <FilterValueEditor filter={str} value="john" onChange={jest.fn()} />
    );
    expect(screen.getByDisplayValue("john")).toBeInTheDocument();
  });

  it("reports each keystroke through onChange", () => {
    const onChange = jest.fn();
    render(<FilterValueEditor filter={str} value="" onChange={onChange} />);
    fireEvent.change(screen.getByPlaceholderText("Filter with User Name"), {
      target: { value: "jo" },
    });
    expect(onChange).toHaveBeenCalledWith("jo");
  });

  it("commits on Enter", () => {
    const onCommit = jest.fn();
    render(
      <FilterValueEditor
        filter={str}
        value="john"
        onChange={jest.fn()}
        onCommit={onCommit}
      />
    );
    fireEvent.keyDown(screen.getByDisplayValue("john"), { key: "Enter" });
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("does not commit on blur by default", () => {
    const onCommit = jest.fn();
    render(
      <FilterValueEditor
        filter={str}
        value="john"
        onChange={jest.fn()}
        onCommit={onCommit}
      />
    );
    fireEvent.blur(screen.getByDisplayValue("john"));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("commits on blur when commitOnBlur is set", () => {
    const onCommit = jest.fn();
    render(
      <FilterValueEditor
        filter={str}
        value="john"
        onChange={jest.fn()}
        onCommit={onCommit}
        commitOnBlur
      />
    );
    fireEvent.blur(screen.getByDisplayValue("john"));
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("renders a number input for a number filter", () => {
    const num: ServerFilterConfig = {
      type: "number",
      key: "minTotalAmount",
      label: "Min total",
      placeholder: "Min total",
    };
    render(<FilterValueEditor filter={num} value={25} onChange={jest.fn()} />);
    expect(screen.getByDisplayValue("25")).toHaveAttribute("type", "number");
  });

  it("shows a validation message when one is passed", () => {
    render(
      <FilterValueEditor
        filter={str}
        value="jo"
        error="Too short"
        onChange={jest.fn()}
      />
    );
    expect(screen.getByText("Too short")).toBeInTheDocument();
  });

  it("renders a Selectable trigger carrying the filter's placeholder text for a boolean filter", () => {
    const bool: ServerFilterConfig = {
      type: "boolean",
      key: "notActive",
      label: "Active",
      placeholder: "Choose an option",
      options: [
        { label: "No", value: true },
        { label: "Yes", value: false },
      ],
    };
    render(
      <FilterValueEditor filter={bool} value={undefined} onChange={jest.fn()} />
    );
    const trigger = screen.getByText("Choose an option");
    expect(trigger.closest("button")).toBeInTheDocument();
  });

  it("adds a tag on Enter for a string-array filter", () => {
    const tags: ServerFilterConfig = {
      type: "string-array",
      key: "tagNumbers",
      label: "Tag numbers",
      placeholder: "Tag numbers",
    };
    const onChange = jest.fn();
    render(
      <FilterValueEditor filter={tags} value={["TR1"]} onChange={onChange} />
    );
    const input = screen.getByPlaceholderText("Tag numbers");
    fireEvent.change(input, { target: { value: "TR2" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(["TR1", "TR2"]);
  });

  it("does not add a duplicate tag", () => {
    const tags: ServerFilterConfig = {
      type: "string-array",
      key: "tagNumbers",
      label: "Tag numbers",
      placeholder: "Tag numbers",
    };
    const onChange = jest.fn();
    render(
      <FilterValueEditor filter={tags} value={["TR1"]} onChange={onChange} />
    );
    const input = screen.getByPlaceholderText("Tag numbers");
    fireEvent.change(input, { target: { value: "TR1" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows a clear button for a date filter with a value, and clears it on click", () => {
    const onChange = jest.fn();
    render(
      <FilterValueEditor
        filter={date}
        value="2024-01-01T00:00:00.000Z"
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByTestId("lucide-x-circle"));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("hides the clear button for a date filter with no value", () => {
    render(
      <FilterValueEditor filter={date} value={undefined} onChange={jest.fn()} />
    );
    expect(screen.queryByTestId("lucide-x-circle")).not.toBeInTheDocument();
  });

  it("shows a clear button for a date-range filter with only 'from' set, and clears it on click", () => {
    const onChange = jest.fn();
    render(
      <FilterValueEditor
        filter={dateRange}
        value={{ from: "2024-01-01T00:00:00.000Z" }}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByTestId("lucide-x-circle"));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it("does not emit on mount for a date filter that already has a value", () => {
    const onChange = jest.fn();
    const onCommit = jest.fn();
    render(
      <FilterValueEditor
        filter={date}
        value="2026-09-01T00:00:00.000Z"
        onChange={onChange}
        onCommit={onCommit}
      />
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("does not emit on mount for a date-range filter that already has a value", () => {
    const onChange = jest.fn();
    const onCommit = jest.fn();
    render(
      <FilterValueEditor
        filter={dateRange}
        value={{
          from: "2026-09-01T00:00:00.000Z",
          to: "2026-09-08T00:00:00.000Z",
        }}
        onChange={onChange}
        onCommit={onCommit}
      />
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("does not emit on a StrictMode double mount for a date filter that already has a value", () => {
    const onChange = jest.fn();
    const onCommit = jest.fn();
    render(
      <StrictMode>
        <FilterValueEditor
          filter={date}
          value="2026-09-01T00:00:00.000Z"
          onChange={onChange}
          onCommit={onCommit}
        />
      </StrictMode>
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("does not emit on a StrictMode double mount for a date-range filter that already has a value", () => {
    const onChange = jest.fn();
    const onCommit = jest.fn();
    render(
      <StrictMode>
        <FilterValueEditor
          filter={dateRange}
          value={{
            from: "2026-09-01T00:00:00.000Z",
            to: "2026-09-08T00:00:00.000Z",
          }}
          onChange={onChange}
          onCommit={onCommit}
        />
      </StrictMode>
    );
    expect(onChange).not.toHaveBeenCalled();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("still reports a real pick on a date filter that mounted with a value", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const onCommit = jest.fn();
    render(
      <FilterValueEditor
        filter={date}
        value="2026-09-01T00:00:00.000Z"
        onChange={onChange}
        onCommit={onCommit}
      />
    );
    await user.click(screen.getByTestId("issueDate_calendar_icon"));
    await user.click(screen.getByRole("button", { name: /^Today,/ }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("still reports a real pick on a date-range filter that mounted with a value", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <FilterValueEditor
        filter={dateRange}
        value={{
          from: "2026-09-01T00:00:00.000Z",
          to: "2026-09-08T00:00:00.000Z",
        }}
        onChange={onChange}
      />
    );
    await user.click(screen.getByTestId("issueDate_calendar_icon"));
    await user.click(screen.getByRole("button", { name: /^Today,/ }));
    await user.keyboard("{ArrowRight}{Enter}");
    expect(onChange).toHaveBeenCalled();
  });
});
