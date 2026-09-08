import { fireEvent, render, screen } from "@testing-library/react";
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

  it("commits on blur", () => {
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
});
