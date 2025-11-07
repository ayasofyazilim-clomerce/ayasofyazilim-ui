import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SelectTabs, { SelectTabsContent } from "../custom/select-tabs";

describe("SelectTabs", () => {
  const renderSelectTabs = (props = {}) => {
    const defaultProps = {
      value: "",
      onValueChange: jest.fn(),
      ...props,
    };

    return render(
      <SelectTabs {...defaultProps}>
        <SelectTabsContent value="tab1">Tab 1</SelectTabsContent>
        <SelectTabsContent value="tab2">Tab 2</SelectTabsContent>
        <SelectTabsContent value="tab3">Tab 3</SelectTabsContent>
      </SelectTabs>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders all tab contents", () => {
      renderSelectTabs();

      expect(screen.getByText("Tab 1")).toBeInTheDocument();
      expect(screen.getByText("Tab 2")).toBeInTheDocument();
      expect(screen.getByText("Tab 3")).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      const { container } = renderSelectTabs({ className: "custom-class" });

      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("renders unchecked icons for inactive tabs", () => {
      renderSelectTabs();

      const circleIcons = screen.getAllByTestId("lucide-circle");
      expect(circleIcons).toHaveLength(3);
    });
  });

  describe("Tab Selection", () => {
    it("shows checked icon for active tab", () => {
      renderSelectTabs({ value: "tab2" });

      expect(screen.getByTestId("lucide-circle-check-big")).toBeInTheDocument();
      expect(screen.getAllByTestId("lucide-circle")).toHaveLength(2);
    });

    it("applies active styles to selected tab", () => {
      renderSelectTabs({ value: "tab1" });

      const activeButton = screen.getByText("Tab 1").closest("button");
      expect(activeButton).toHaveClass("border-primary/80", "text-primary/80");
    });

    it("applies default styles to inactive tabs", () => {
      renderSelectTabs({ value: "tab1" });

      const inactiveButton = screen.getByText("Tab 2").closest("button");
      expect(inactiveButton).toHaveClass("border-gray-300", "text-gray-700/80");
    });

    it("calls onValueChange when tab is clicked", async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      renderSelectTabs({ onValueChange });

      await user.click(screen.getByText("Tab 2"));

      expect(onValueChange).toHaveBeenCalledWith("tab2");
      expect(onValueChange).toHaveBeenCalledTimes(1);
    });

    it("changes active tab when different tab is clicked", async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      renderSelectTabs({ value: "tab1", onValueChange });

      await user.click(screen.getByText("Tab 3"));

      expect(onValueChange).toHaveBeenCalledWith("tab3");
    });

    it("does not call onValueChange when same tab is clicked and deselect is false", async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      renderSelectTabs({ value: "tab1", onValueChange, deselect: false });

      await user.click(screen.getByText("Tab 1"));

      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe("Deselection Feature", () => {
    it("deselects tab when same tab is clicked and deselect is true", async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      renderSelectTabs({ value: "tab1", onValueChange, deselect: true });

      await user.click(screen.getByText("Tab 1"));

      expect(onValueChange).toHaveBeenCalledWith("");
    });

    it("shows no checked icons when tab is deselected", async () => {
      const user = userEvent.setup();
      renderSelectTabs({ value: "tab1", deselect: true });

      await user.click(screen.getByText("Tab 1"));

      expect(
        screen.queryByTestId("lucide-circle-check-big")
      ).not.toBeInTheDocument();
      expect(screen.getAllByTestId("lucide-circle")).toHaveLength(3);
    });
  });

  describe("Disabled State", () => {
    it("does not respond to clicks when disabled", async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      renderSelectTabs({ onValueChange, disabled: true });

      await user.click(screen.getByText("Tab 1"));

      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("does not deselect when disabled and deselect is true", async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      renderSelectTabs({
        value: "tab1",
        onValueChange,
        disabled: true,
        deselect: true,
      });

      await user.click(screen.getByText("Tab 1"));

      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty value prop", () => {
      renderSelectTabs({ value: "" });

      expect(
        screen.queryByTestId("lucide-circle-check-big")
      ).not.toBeInTheDocument();
      expect(screen.getAllByTestId("lucide-circle")).toHaveLength(3);
    });

    it("handles undefined onValueChange", async () => {
      const user = userEvent.setup();
      renderSelectTabs({ onValueChange: undefined });

      // Should not throw error
      await user.click(screen.getByText("Tab 1"));

      expect(screen.getByTestId("lucide-circle-check-big")).toBeInTheDocument();
    });

    it("renders with no children", () => {
      const { container } = render(<SelectTabs />);

      expect(container.firstChild).toBeInTheDocument();
      expect(container.firstChild).toHaveClass("w-full", "grid", "gap-3");
    });

    it("handles string children in SelectTabsContent", () => {
      render(
        <SelectTabs>
          <SelectTabsContent value="string-test">
            String Content
          </SelectTabsContent>
        </SelectTabs>
      );

      expect(screen.getByText("String Content")).toBeInTheDocument();
    });

    it("handles JSX children in SelectTabsContent", () => {
      render(
        <SelectTabs>
          <SelectTabsContent value="jsx-test">
            <div>JSX Content</div>
          </SelectTabsContent>
        </SelectTabs>
      );

      expect(screen.getByText("JSX Content")).toBeInTheDocument();
    });
  });

  describe("Multiple Tab Scenarios", () => {
    it("handles switching between multiple tabs", async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      renderSelectTabs({ onValueChange });

      // Click tab 1
      await user.click(screen.getByText("Tab 1"));
      expect(onValueChange).toHaveBeenCalledWith("tab1");

      // Click tab 3
      await user.click(screen.getByText("Tab 3"));
      expect(onValueChange).toHaveBeenCalledWith("tab3");

      // Click tab 2
      await user.click(screen.getByText("Tab 2"));
      expect(onValueChange).toHaveBeenCalledWith("tab2");

      expect(onValueChange).toHaveBeenCalledTimes(3);
    });

    it("maintains correct state across multiple interactions with deselect", async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      renderSelectTabs({ onValueChange, deselect: true });

      // Select tab 1
      await user.click(screen.getByText("Tab 1"));
      expect(onValueChange).toHaveBeenCalledWith("tab1");

      // Deselect tab 1
      await user.click(screen.getByText("Tab 1"));
      expect(onValueChange).toHaveBeenCalledWith("");

      // Select tab 2
      await user.click(screen.getByText("Tab 2"));
      expect(onValueChange).toHaveBeenCalledWith("tab2");

      expect(onValueChange).toHaveBeenCalledTimes(3);
    });
  });

  describe("Button Properties", () => {
    it("renders buttons with correct variant", () => {
      renderSelectTabs();

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveClass(
          "justify-between",
          "border-2",
          "gap-5",
          "flex-1"
        );
      });
    });

    it("renders buttons as clickable elements", () => {
      renderSelectTabs();

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button.tagName).toBe("BUTTON");
      });
    });
  });

  describe("Accessibility", () => {
    it("renders buttons that are keyboard accessible", async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      renderSelectTabs({ onValueChange });

      const firstButton = screen.getByText("Tab 1").closest("button");

      // Focus and press Enter
      firstButton?.focus();
      await user.keyboard("{Enter}");

      expect(onValueChange).toHaveBeenCalledWith("tab1");
    });

    it("renders buttons that are accessible via Space key", async () => {
      const user = userEvent.setup();
      const onValueChange = jest.fn();
      renderSelectTabs({ onValueChange });

      const firstButton = screen.getByText("Tab 1").closest("button");

      // Focus and press Space
      firstButton?.focus();
      await user.keyboard(" ");

      expect(onValueChange).toHaveBeenCalledWith("tab1");
    });
  });
});
