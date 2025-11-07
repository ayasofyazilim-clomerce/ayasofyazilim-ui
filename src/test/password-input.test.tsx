import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordInput } from "../custom/password-input";

const getInput = () =>
  document.querySelector(
    'input[type="password"], input[type="text"]'
  ) as HTMLInputElement;

describe("PasswordInput", () => {
  it("renders input and toggle button", () => {
    render(<PasswordInput />);
    expect(getInput()).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("shows password when toggle clicked", async () => {
    render(<PasswordInput />);
    const input = getInput();
    const toggle = screen.getByRole("button");
    expect(input.type).toBe("password");
    await userEvent.click(toggle);
    expect(input.type).toBe("text");
    await userEvent.click(toggle);
    expect(input.type).toBe("password");
  });

  it("accepts value and onChange", async () => {
    const handleChange = jest.fn();
    render(<PasswordInput value="abc" onChange={handleChange} />);
    const input = getInput();
    expect(input.value).toBe("abc");
    await userEvent.type(input, "123");
    expect(handleChange).toHaveBeenCalled();
  });

  it("shows generator button if showGenerator", () => {
    render(<PasswordInput showGenerator />);
    expect(screen.getByTestId("generate-password-button")).toBeInTheDocument();
  });

  it("generates password when generator clicked", async () => {
    render(<PasswordInput showGenerator />);
    const input = getInput();
    const generator = screen.getByTestId("generate-password-button");
    await userEvent.click(generator);
    await new Promise((r) => setTimeout(r, 1000)); // Wait for async updates
    expect(input.value.length).toBeGreaterThan(0);
  });

  it("forwards ref", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<PasswordInput ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("disables input and buttons", () => {
    render(<PasswordInput disabled showGenerator />);
    expect(getInput()).toBeDisabled();
    expect(
      screen.getByTestId("toggle-password-visibility-button")
    ).toBeDisabled();
    expect(screen.getByTestId("generate-password-button")).toBeDisabled();
  });
});
