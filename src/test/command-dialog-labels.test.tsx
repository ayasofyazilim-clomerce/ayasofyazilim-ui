import React from "react";
import { render, screen } from "@testing-library/react";
import { CommandDialog, CommandInput } from "../components/command";

// The spies call through, so any other message still shows in the output.
function consoleSpies() {
  return [jest.spyOn(console, "error"), jest.spyOn(console, "warn")];
}

function dialogWarnings(spies: jest.SpyInstance[]) {
  return spies
    .flatMap((spy) => spy.mock.calls)
    .map((args) => args.map(String).join(" "))
    .filter((text) => /DialogTitle|DialogContent|aria-describedby/.test(text));
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("CommandDialog labels", () => {
  it("renders nothing of its title or description while closed", () => {
    render(
      <CommandDialog open={false} title="Menu" description="Find things" />
    );
    expect(screen.queryByText("Menu")).not.toBeInTheDocument();
    expect(screen.queryByText("Find things")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("names and describes the dialog from inside it", () => {
    render(<CommandDialog open title="Menu" description="Find things" />);
    const dialog = screen.getByRole("dialog", { name: "Menu" });
    expect(dialog).toHaveAccessibleDescription("Find things");
    expect(dialog).toContainElement(
      screen.getByRole("heading", { name: "Menu" })
    );
    expect(dialog).toContainElement(screen.getByText("Find things"));
  });

  it("keeps the English defaults", () => {
    render(<CommandDialog open />);
    const dialog = screen.getByRole("dialog", { name: "Command Palette" });
    expect(dialog).toHaveAccessibleDescription(
      "Search for a command to run..."
    );
  });

  it("names the search input after the title by default", () => {
    render(
      <CommandDialog open title="Menu">
        <CommandInput placeholder="Type here" />
      </CommandDialog>
    );
    expect(screen.getByRole("combobox")).toHaveAccessibleName("Menu");
  });

  it("names the search input with inputLabel", () => {
    render(
      <CommandDialog open title="Menu" inputLabel="Search pages">
        <CommandInput placeholder="Type here" />
      </CommandDialog>
    );
    expect(screen.getByRole("combobox")).toHaveAccessibleName("Search pages");
  });

  it("does not warn about a missing title or description when opened", () => {
    const spies = consoleSpies();
    render(
      <CommandDialog open title="Menu" description="Find things">
        <CommandInput aria-label="Search" />
      </CommandDialog>
    );
    expect(dialogWarnings(spies)).toEqual([]);
  });
});
