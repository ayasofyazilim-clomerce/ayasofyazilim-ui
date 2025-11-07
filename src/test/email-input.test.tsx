import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmailInput } from "../custom/email-input";

describe("EmailInput", () => {
  it("renders input field", () => {
    render(<EmailInput id="email" />);
    const input = screen.getByTestId("email") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.type).toBe("email");
  });

  it("renders with label", () => {
    render(<EmailInput id="email" label="Email Address" />);
    expect(screen.getByText("Email Address")).toBeInTheDocument();
  });

  it("shows required asterisk when required", () => {
    render(<EmailInput id="email" label="Email" required />);
    const label = screen.getByText("Email");
    expect(label).toHaveClass("after:content-['*']");
  });

  it("accepts typed input", async () => {
    const user = userEvent.setup();
    render(<EmailInput id="email" />);
    const input = screen.getByTestId("email") as HTMLInputElement;

    await user.type(input, "test@example.com");
    expect(input.value).toBe("test@example.com");
  });

  it("calls onValueChange when typing", async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    render(<EmailInput id="email" onValueChange={handleChange} />);
    const input = screen.getByTestId("email");

    await user.type(input, "test");
    expect(handleChange).toHaveBeenCalled();
    expect(handleChange).toHaveBeenLastCalledWith("test");
  });

  it("shows suggestions when typing @ symbol", async () => {
    const user = userEvent.setup();
    render(<EmailInput id="email" />);
    const input = screen.getByTestId("email");

    await user.type(input, "test@");

    await waitFor(() => {
      expect(screen.getByTestId("email_suggestion_0")).toBeInTheDocument();
    });
  });

  it("filters suggestions based on domain input", async () => {
    const user = userEvent.setup();
    render(<EmailInput id="email" />);
    const input = screen.getByTestId("email");

    await user.type(input, "test@gm");

    await waitFor(() => {
      const suggestion = screen.getByTestId("email_suggestion_0");
      expect(suggestion.textContent).toContain("gmail");
    });
  });

  it("applies suggestion when clicked", async () => {
    const user = userEvent.setup();
    render(<EmailInput id="email" />);
    const input = screen.getByTestId("email") as HTMLInputElement;

    await user.type(input, "test@");

    await waitFor(() => {
      expect(screen.getByTestId("email_suggestion_0")).toBeInTheDocument();
    });

    const suggestion = screen.getByTestId("email_suggestion_0");
    await user.click(suggestion);

    expect(input.value).toContain("@");
    await waitFor(() => {
      expect(
        screen.queryByTestId("email_suggestion_0")
      ).not.toBeInTheDocument();
    });
  });

  it("navigates suggestions with arrow keys", async () => {
    const user = userEvent.setup();
    render(<EmailInput id="email" />);
    const input = screen.getByTestId("email");

    await user.type(input, "test@");

    await waitFor(() => {
      expect(screen.getByTestId("email_suggestion_0")).toBeInTheDocument();
    });

    await user.keyboard("{ArrowDown}");
    const firstSuggestion = screen.getByTestId("email_suggestion_0");
    expect(firstSuggestion).toHaveClass("bg-accent");

    await user.keyboard("{ArrowDown}");
    const secondSuggestion = screen.getByTestId("email_suggestion_1");
    expect(secondSuggestion).toHaveClass("bg-accent");
  });

  it("applies suggestion with Enter key", async () => {
    const user = userEvent.setup();
    render(<EmailInput id="email" />);
    const input = screen.getByTestId("email") as HTMLInputElement;

    await user.type(input, "test@");

    await waitFor(() => {
      expect(screen.getByTestId("email_suggestion_0")).toBeInTheDocument();
    });

    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(input.value).toContain("@");
    await waitFor(() => {
      expect(
        screen.queryByTestId("email_suggestion_0")
      ).not.toBeInTheDocument();
    });
  });

  it("closes suggestions with Escape key", async () => {
    const user = userEvent.setup();
    render(<EmailInput id="email" />);
    const input = screen.getByTestId("email");

    await user.type(input, "test@");

    await waitFor(() => {
      expect(screen.getByTestId("email_suggestion_0")).toBeInTheDocument();
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(
        screen.queryByTestId("email_suggestion_0")
      ).not.toBeInTheDocument();
    });
  });

  it("accepts custom suggestions", async () => {
    const user = userEvent.setup();
    const customDomains = ["custom.com", "example.org"];
    render(<EmailInput id="email" suggestions={customDomains} />);
    const input = screen.getByTestId("email");

    await user.type(input, "test@custom");

    await waitFor(() => {
      const suggestion = screen.getByTestId("email_suggestion_0");
      expect(suggestion.textContent).toContain("custom.com");
    });
  });

  it("forwards ref correctly", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<EmailInput id="email" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("disables input when disabled prop is true", () => {
    render(<EmailInput id="email" disabled />);
    const input = screen.getByTestId("email");
    expect(input).toBeDisabled();
  });

  it("updates value when controlled", () => {
    const { rerender } = render(
      <EmailInput id="email" value="test@example.com" onChange={() => {}} />
    );
    const input = screen.getByTestId("email") as HTMLInputElement;
    expect(input.value).toBe("test@example.com");

    rerender(
      <EmailInput id="email" value="new@example.com" onChange={() => {}} />
    );
    expect(input.value).toBe("new@example.com");
  });

  it("hides suggestions when clicking outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <EmailInput id="email" />
        <button>Outside</button>
      </div>
    );
    const input = screen.getByTestId("email");

    await user.type(input, "test@");

    await waitFor(() => {
      expect(screen.getByTestId("email_suggestion_0")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Outside"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("email_suggestion_0")
      ).not.toBeInTheDocument();
    });
  });
});
