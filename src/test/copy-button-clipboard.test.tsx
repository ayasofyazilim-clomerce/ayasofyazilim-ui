import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CopyButton, CopyableText } from "../custom/copy-button";

const original = Object.getOwnPropertyDescriptor(navigator, "clipboard");

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, "clipboard", {
    value,
    configurable: true,
  });
}

afterEach(() => {
  jest.useRealTimers();
  if (original) Object.defineProperty(navigator, "clipboard", original);
  else delete (navigator as unknown as { clipboard?: unknown }).clipboard;
});

describe("CopyButton clipboard behaviour", () => {
  it("copy writes the value", async () => {
    const user = userEvent.setup();
    const writeText = jest.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    const onCopy = jest.fn();
    render(<CopyButton value="abc-123" onCopy={onCopy} />);

    await user.click(screen.getByRole("button", { name: "Copy" }));

    expect(writeText).toHaveBeenCalledWith("abc-123");
    expect(screen.getByRole("button").getAttribute("aria-label")).toBe(
      "Copied"
    );
    expect(onCopy).toHaveBeenCalledWith(true);
  });

  it("copied resets", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    setClipboard({ writeText: jest.fn().mockResolvedValue(undefined) });
    render(<CopyButton value="x" />);

    await user.click(screen.getByRole("button"));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByRole("button").getAttribute("aria-label")).toBe(
      "Copied"
    );

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByRole("button").getAttribute("aria-label")).toBe("Copy");
  });

  it("clipboard missing", async () => {
    const user = userEvent.setup();
    setClipboard(undefined);
    const onCopy = jest.fn();
    render(<CopyButton value="x" onCopy={onCopy} />);

    await user.click(screen.getByRole("button"));

    expect(onCopy).toHaveBeenCalledWith(false);
    expect(screen.getByRole("button").getAttribute("aria-label")).toBe("Copy");
  });

  it("clipboard rejects", async () => {
    const user = userEvent.setup();
    setClipboard({ writeText: jest.fn().mockRejectedValue(new Error("no")) });
    const onCopy = jest.fn();
    render(<CopyButton value="x" onCopy={onCopy} />);

    await user.click(screen.getByRole("button"));

    expect(onCopy).toHaveBeenCalledWith(false);
    expect(screen.getByRole("button").getAttribute("aria-label")).toBe("Copy");
  });

  it("labels override", async () => {
    const user = userEvent.setup();
    setClipboard({ writeText: jest.fn().mockResolvedValue(undefined) });
    render(<CopyButton value="x" labels={{ copy: "Kopyala", copied: "Tamam" }} />);

    const button = screen.getByRole("button", { name: "Kopyala" });
    await user.click(button);
    expect(screen.getByRole("button", { name: "Tamam" })).toBeTruthy();
  });
});

describe("CopyableText", () => {
  it("shows children over value and copies value", async () => {
    const user = userEvent.setup();
    const writeText = jest.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    render(<CopyableText value="real-id">shown</CopyableText>);

    expect(screen.getByText("shown")).toBeTruthy();
    expect(screen.queryByText("real-id")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenCalledWith("real-id");
  });

  it("shows value when no children", () => {
    render(<CopyableText value="only-value" />);
    expect(screen.getByText("only-value")).toBeTruthy();
  });
});
