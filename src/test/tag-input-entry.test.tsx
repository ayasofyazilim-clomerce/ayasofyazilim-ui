import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TagInput } from "../custom/tag-input";

function setup(props: Partial<React.ComponentProps<typeof TagInput>> = {}) {
  const onValueChange = jest.fn();
  render(
    <TagInput
      value={[]}
      onValueChange={onValueChange}
      aria-label="Tags"
      {...props}
    />
  );
  return { onValueChange, input: screen.getByRole("textbox") };
}

describe("TagInput", () => {
  it("adds the trimmed text on Enter and clears the input", async () => {
    const { onValueChange, input } = setup();
    await userEvent.type(input, " a {Enter}");
    expect(onValueChange).toHaveBeenCalledWith(["a"]);
    expect(input).toHaveValue("");
  });

  it("adds on comma", async () => {
    const { onValueChange, input } = setup();
    await userEvent.type(input, "b,");
    expect(onValueChange).toHaveBeenCalledWith(["b"]);
    expect(input).toHaveValue("");
  });

  it("splits a paste on commas and newlines in one change", async () => {
    const { onValueChange, input } = setup({ value: ["x"] });
    await userEvent.click(input);
    await userEvent.paste("c, d\ne");
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(["x", "c", "d", "e"]);
  });

  it("adds pending text on blur", async () => {
    const { onValueChange, input } = setup();
    await userEvent.type(input, "z");
    await userEvent.tab();
    expect(onValueChange).toHaveBeenCalledWith(["z"]);
  });

  it("adds nothing for whitespace only", async () => {
    const { onValueChange, input } = setup();
    await userEvent.type(input, "   {Enter}");
    await userEvent.tab();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("rejects a duplicate and keeps the text", async () => {
    const { onValueChange, input } = setup({ value: ["a"] });
    await userEvent.type(input, "a{Enter}");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Already added");
    expect(input).toHaveValue("a");
  });

  it("allows duplicates when asked", async () => {
    const { onValueChange, input } = setup({
      value: ["a"],
      allowDuplicates: true,
    });
    await userEvent.type(input, "a{Enter}");
    expect(onValueChange).toHaveBeenCalledWith(["a", "a"]);
  });

  it("rejects entries over maxItems", async () => {
    const { onValueChange, input } = setup({ value: ["a"], maxItems: 1 });
    await userEvent.type(input, "b{Enter}");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Maximum reached");
  });

  it("shows the validate message and does not add", async () => {
    const { onValueChange, input } = setup({
      validate: (t) => (t.length < 3 ? "Too short" : null),
    });
    await userEvent.type(input, "ab{Enter}");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Too short");
  });

  it("removes the last chip on Backspace in an empty input", async () => {
    const { onValueChange, input } = setup({ value: ["a", "b"] });
    await userEvent.type(input, "{Backspace}");
    expect(onValueChange).toHaveBeenCalledWith(["a"]);
  });

  it("does not remove a chip on Backspace while there is text", async () => {
    const { onValueChange, input } = setup({ value: ["a"] });
    await userEvent.type(input, "q{Backspace}");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("removes a chip with its labelled button", async () => {
    const { onValueChange } = setup({ value: ["a", "b"] });
    await userEvent.click(screen.getByRole("button", { name: "Remove a" }));
    expect(onValueChange).toHaveBeenCalledWith(["b"]);
  });

  it("on a partial paste adds the valid pieces and returns rejected ones to the input", async () => {
    const { onValueChange, input } = setup({ value: ["a"] });
    await userEvent.type(input, "ab");
    await userEvent.paste("c,a,d");
    expect(onValueChange).toHaveBeenCalledWith(["a", "abc", "d"]);
    expect(screen.getByRole("alert")).toHaveTextContent("Already added");
    expect(input).toHaveValue("a");
  });

  it("returns pieces over maxItems to the input", async () => {
    const { onValueChange, input } = setup({ maxItems: 2 });
    await userEvent.click(input);
    await userEvent.paste("a,b,c,d");
    expect(onValueChange).toHaveBeenCalledWith(["a", "b"]);
    expect(screen.getByRole("alert")).toHaveTextContent("Maximum reached");
    expect(input).toHaveValue("c, d");
  });

  it("ignores Enter during IME composition", () => {
    const { onValueChange, input } = setup();
    fireEvent.change(input, { target: { value: "か" } });
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    expect(onValueChange).not.toHaveBeenCalled();
    expect(input).toHaveValue("か");
  });

  it("blocks every change when disabled", async () => {
    const { onValueChange, input } = setup({ value: ["a"], disabled: true });
    expect(input).toBeDisabled();
    expect(screen.getByRole("button", { name: "Remove a" })).toBeDisabled();
    fireEvent.change(input, { target: { value: "b" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.keyDown(input, { key: "Backspace" });
    fireEvent.blur(input);
    fireEvent.click(screen.getByRole("button", { name: "Remove a" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
