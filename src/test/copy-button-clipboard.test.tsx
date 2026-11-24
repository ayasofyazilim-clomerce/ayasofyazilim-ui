import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CopyButton, CopyableText } from "../custom/copy-button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../components/tooltip";

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

describe("CopyableText renderButton", () => {
  it("renders the default button when renderButton is absent", () => {
    const { container } = render(<CopyableText value="id-1" />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAttribute("aria-label", "Copy");
    expect(buttons[0]).toHaveAttribute("title", "Copy");
    expect(container.querySelector("span")!.lastElementChild).toBe(buttons[0]);
  });

  it("keeps one copy button, still copies, and shows the tooltip on focus", async () => {
    const user = userEvent.setup();
    const writeText = jest.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    render(
      <CopyableText
        value="id-1"
        renderButton={(button) => (
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent>id-1 - Click to copy</TooltipContent>
          </Tooltip>
        )}
      />
    );

    const button = screen.getByRole("button", { name: "Copy" });
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.queryByText("id-1 - Click to copy")).toBeNull();
    act(() => button.focus());
    expect(
      (await screen.findAllByText("id-1 - Click to copy")).length
    ).toBeGreaterThan(0);

    await user.click(button);
    expect(writeText).toHaveBeenCalledWith("id-1");
    expect(screen.getByRole("button")).toBe(button);
  });

  it("hands the button its ref", () => {
    const ref = jest.fn();
    render(
      <CopyableText
        value="id-1"
        renderButton={(button) => React.cloneElement(button, { ref } as never)}
      />
    );
    expect(ref).toHaveBeenCalledWith(screen.getByRole("button"));
  });

  it("renders a different element instead of the default button", () => {
    render(
      <CopyableText
        value="id-1"
        renderButton={() => <a href="#x">custom</a>}
      />
    );
    expect(screen.getByText("custom")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("CopyButton composed with a parent onClick", () => {
  const withParent = (onClick: (e: React.MouseEvent) => void) => (
    <CopyableText
      value="id-1"
      renderButton={(button) => React.cloneElement(button, { onClick } as never)}
    />
  );

  it("runs the parent handler once and copies once", async () => {
    const user = userEvent.setup();
    const writeText = jest.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    const parent = jest.fn();
    render(withParent(parent));

    await user.click(screen.getByRole("button"));

    expect(parent).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith("id-1");
  });

  it("does not copy when the parent calls preventDefault", async () => {
    const user = userEvent.setup();
    const writeText = jest.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    const onCopy = jest.fn();
    const parent = jest.fn((e: React.MouseEvent) => e.preventDefault());
    render(
      <CopyableText
        value="id-1"
        onCopy={onCopy}
        renderButton={(button) =>
          React.cloneElement(button, { onClick: parent } as never)
        }
      />
    );

    await user.click(screen.getByRole("button"));

    expect(parent).toHaveBeenCalledTimes(1);
    expect(writeText).not.toHaveBeenCalled();
    expect(onCopy).not.toHaveBeenCalled();
  });
});
