import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import userEvent from "@testing-library/user-event";
import { useTheme } from "next-themes";
import { ThemeToggle } from "../custom/theme-toggle";

jest.mock("next-themes", () => ({ useTheme: jest.fn() }));

const setTheme = jest.fn();

function mockTheme(theme: string | undefined) {
  (useTheme as jest.Mock).mockReturnValue({ theme, setTheme });
}

beforeEach(() => {
  setTheme.mockReset();
  mockTheme("system");
});

describe("ThemeToggle modes", () => {
  it("controlled: shows the value and calls only onValueChange", async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    render(<ThemeToggle value="dark" onValueChange={onValueChange} />);

    expect(screen.getByRole("radio", { name: "Dark" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await user.click(screen.getByRole("radio", { name: "Light" }));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("light");
    expect(setTheme).not.toHaveBeenCalled();
  });

  it("uncontrolled: reads the next-themes theme and writes via setTheme", async () => {
    const user = userEvent.setup();
    mockTheme("light");
    render(<ThemeToggle />);

    expect(screen.getByRole("radio", { name: "Light" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await user.click(screen.getByRole("radio", { name: "Dark" }));

    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("clicking the active item calls nothing and keeps it selected", async () => {
    const user = userEvent.setup();
    const onValueChange = jest.fn();
    const { rerender } = render(
      <ThemeToggle value="dark" onValueChange={onValueChange} />,
    );
    await user.click(screen.getByRole("radio", { name: "Dark" }));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "Dark" })).toHaveAttribute(
      "data-state",
      "on",
    );

    mockTheme("dark");
    rerender(<ThemeToggle />);
    await user.click(screen.getByRole("radio", { name: "Dark" }));
    expect(setTheme).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "Dark" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("iconOnly puts the labels into aria-labels", () => {
    render(<ThemeToggle iconOnly value="system" />);

    expect(screen.getByRole("radio", { name: "System" })).toHaveAttribute(
      "aria-label",
      "System",
    );
    expect(screen.getByRole("radio", { name: "Light" })).toHaveAttribute(
      "aria-label",
      "Light",
    );
    expect(screen.getByRole("radio", { name: "Dark" })).toHaveAttribute(
      "aria-label",
      "Dark",
    );
    expect(screen.queryByText("Light")).not.toBeInTheDocument();
  });

  it("shows visible labels and the group label by default", () => {
    render(<ThemeToggle value="system" />);

    expect(screen.getByRole("radiogroup", { name: "Theme" })).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
    expect(screen.getByText("Light")).toBeInTheDocument();
    expect(screen.getByText("Dark")).toBeInTheDocument();
  });

  it("passed labels override the defaults", () => {
    render(
      <ThemeToggle
        value="light"
        labels={{
          group: "Tema",
          system: "Sistem",
          light: "Acik",
          dark: "Koyu",
        }}
      />,
    );

    expect(screen.getByRole("radiogroup", { name: "Tema" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Sistem" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Acik" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Koyu" })).toBeInTheDocument();
  });

  it("server render: uncontrolled marks no option selected", () => {
    mockTheme("dark");
    const html = renderToString(<ThemeToggle />);

    expect(html).toContain("Theme");
    expect(html).not.toContain('aria-checked="true"');
    expect(html).not.toContain('data-state="on"');
  });
});
