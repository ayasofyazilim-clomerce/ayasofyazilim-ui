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
    const toggle = document.getElementById("toggle-password-visibility-button");
    expect(input.type).toBe("password");
    await userEvent.click(toggle!);
    expect(input.type).toBe("text");
    await userEvent.click(toggle!);
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
    expect(
      document.getElementById("generate-password-button")
    ).toBeInTheDocument();
  });

  it("generates password when generator clicked", async () => {
    render(<PasswordInput showGenerator />);
    const input = getInput();
    const generator = document.getElementById("generate-password-button");
    await userEvent.click(generator!);
    await new Promise((r) => setTimeout(r, 100)); // Wait for async updates
    expect(input.value.length).toBeGreaterThan(0);
  });

  it("forwards ref", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<PasswordInput ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("disables input and buttons when disabled", () => {
    render(<PasswordInput disabled showGenerator />);
    expect(getInput()).toBeDisabled();
    expect(
      document.getElementById("toggle-password-visibility-button")
    ).toBeDisabled();
    expect(document.getElementById("generate-password-button")).toBeDisabled();
  });

  it("generates password with correct length", async () => {
    const passwordLength = 16;
    render(<PasswordInput showGenerator passwordLength={passwordLength} />);
    const input = getInput();
    const generator = document.getElementById("generate-password-button");
    await userEvent.click(generator!);
    await new Promise((r) => setTimeout(r, 100));
    expect(input.value.length).toBe(passwordLength);
  });

  it("generated password contains required character types", async () => {
    render(<PasswordInput showGenerator />);
    const input = getInput();
    const generator = document.getElementById("generate-password-button");
    await userEvent.click(generator!);
    await new Promise((r) => setTimeout(r, 100));
    const password = input.value;
    // Check for lowercase, uppercase, numbers, and symbols
    expect(/[a-z]/.test(password)).toBe(true);
    expect(/[A-Z]/.test(password)).toBe(true);
    expect(/[0-9]/.test(password)).toBe(true);
    expect(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)).toBe(true);
  });
});
