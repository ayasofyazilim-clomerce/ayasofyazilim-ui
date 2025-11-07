import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Selectable } from "../custom/selectable";

interface TestOption {
  id: string;
  name: string;
  group?: string;
}

describe("Selectable Component", () => {
  const mockOptions: TestOption[] = [
    { id: "1", name: "Option 1", group: "Group A" },
    { id: "2", name: "Option 2", group: "Group A" },
    { id: "3", name: "Option 3", group: "Group B" },
    { id: "4", name: "Option 4", group: "Group B" },
  ];

  const defaultProps = {
    options: mockOptions,
    getKey: (option: TestOption) => option.id,
    getLabel: (option: TestOption) => option.name,
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render with default placeholder text", () => {
      render(<Selectable {...defaultProps} />);
      expect(screen.getByText("Make a choice...")).toBeInTheDocument();
    });

    it("should render with custom placeholder text", () => {
      render(
        <Selectable {...defaultProps} makeAChoiceText="Select an option" />
      );
      expect(screen.getByText("Select an option")).toBeInTheDocument();
    });

    it("should render with custom className", () => {
      const { container } = render(
        <Selectable {...defaultProps} className="custom-class" />
      );
      const trigger = container.querySelector(".custom-class");
      expect(trigger).toBeInTheDocument();
    });

    it("should render with default values", () => {
      render(<Selectable {...defaultProps} defaultValue={[mockOptions[0]!]} />);
      expect(screen.getByText("Option 1")).toBeInTheDocument();
    });

    it("should render with custom id", () => {
      render(<Selectable {...defaultProps} id="custom-select" />);
      const trigger = screen.getByRole("button");
      expect(trigger).toHaveAttribute("id", "custom-select");
    });
  });

  describe("Single Selection Mode", () => {
    it("should select a single option", async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(
        <Selectable {...defaultProps} singular={true} onChange={onChange} />
      );

      // Open popover
      const trigger = screen.getByRole("button");
      await user.click(trigger);

      // Select an option
      const option1 = screen.getByText("Option 1");
      await user.click(option1);

      expect(onChange).toHaveBeenCalledWith([mockOptions[0]]);
    });

    it("should replace selection when selecting another option in singular mode", async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(
        <Selectable
          {...defaultProps}
          singular={true}
          onChange={onChange}
          defaultValue={[mockOptions[0]!]}
        />
      );

      // Open popover
      const trigger = screen.getByRole("button");
      await user.click(trigger);

      // Select another option
      const option2 = screen.getByText("Option 2");
      await user.click(option2);

      expect(onChange).toHaveBeenCalledWith([mockOptions[1]]);
    });

    it("should close popover after selection in singular mode", async () => {
      const user = userEvent.setup();

      render(<Selectable {...defaultProps} singular={true} />);

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      const option1 = screen.getByText("Option 1");
      await user.click(option1);

      // Popover should close
      await waitFor(() => {
        expect(
          screen.queryByPlaceholderText("Search...")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Multiple Selection Mode", () => {
    it("should select multiple options", async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(<Selectable {...defaultProps} onChange={onChange} />);

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      // Select first option
      const option1 = screen.getByText("Option 1");
      await user.click(option1);

      expect(onChange).toHaveBeenCalledWith([mockOptions[0]]);

      // Select second option
      const option2 = screen.getByText("Option 2");
      await user.click(option2);

      expect(onChange).toHaveBeenCalledWith([mockOptions[0], mockOptions[1]]);
    });

    it("should deselect option by clicking on badge", async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(
        <Selectable
          {...defaultProps}
          onChange={onChange}
          defaultValue={[mockOptions[0]!, mockOptions[1]!]}
        />
      );

      // Find and click the badge to remove
      const badges = screen.getAllByText("Option 1");
      await user.click(badges[0]!);

      expect(onChange).toHaveBeenCalledWith([mockOptions[1]]);
    });

    it("should deselect option from selected list", async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(
        <Selectable
          {...defaultProps}
          onChange={onChange}
          defaultValue={[mockOptions[0]!]}
        />
      );

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      // Expand selected section
      const selectedHeader = screen.getByText("Selected");
      await user.click(selectedHeader);

      // Click on selected option to deselect
      const selectedOption = screen.getByRole("option", { name: /option 1/i });
      await user.click(selectedOption);

      expect(onChange).toHaveBeenCalledWith([]);
    });

    it("should keep popover open after selection in multiple mode", async () => {
      const user = userEvent.setup();

      render(<Selectable {...defaultProps} />);

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      const option1 = screen.getByText("Option 1");
      await user.click(option1);

      // Popover should remain open
      expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
    });
  });

  describe("Search Functionality", () => {
    it("should filter options based on search input", async () => {
      const user = userEvent.setup();

      render(<Selectable {...defaultProps} />);

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "Option 1");

      await waitFor(() => {
        expect(screen.getByText("Option 1")).toBeInTheDocument();
        expect(screen.queryByText("Option 2")).not.toBeInTheDocument();
      });
    });

    it("should show no results message when search returns nothing", async () => {
      const user = userEvent.setup();

      render(<Selectable {...defaultProps} noResult="No items found" />);

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "NonExistent");

      await waitFor(() => {
        expect(screen.getByText("No items found")).toBeInTheDocument();
      });
    });

    it("should use custom search placeholder text", async () => {
      const user = userEvent.setup();

      render(
        <Selectable
          {...defaultProps}
          searchPlaceholderText="Type to search..."
        />
      );

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      expect(
        screen.getByPlaceholderText("Type to search...")
      ).toBeInTheDocument();
    });

    it("should clear search when popover closes", async () => {
      const user = userEvent.setup();

      render(<Selectable {...defaultProps} />);

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "Option 1");

      // Close popover
      await user.click(trigger);

      // Reopen popover
      await user.click(trigger);

      // Search should be cleared
      const newSearchInput = screen.getByPlaceholderText("Search...");
      expect(newSearchInput).toHaveValue("");
    });
  });

  describe("Async Search", () => {
    it("should call onSearch with debounced value", async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn().mockResolvedValue([mockOptions[0]]);

      render(<Selectable {...defaultProps} options={[]} onSearch={onSearch} />);

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "test");

      // Wait for debounce
      await waitFor(
        () => {
          expect(onSearch).toHaveBeenCalledWith("test");
        },
        { timeout: 1000 }
      );
    });

    it("should show loading state during async search", async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve([mockOptions[0]]), 100);
          })
      );

      render(<Selectable {...defaultProps} options={[]} onSearch={onSearch} />);

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "test");

      // Should show skeleton loaders
      await waitFor(() => {
        const skeletons = document.querySelectorAll(".animate-pulse");
        expect(skeletons.length).toBeGreaterThan(0);
      });
    });

    it("should display search results after async search completes", async () => {
      const user = userEvent.setup();
      const searchResults = [mockOptions[0]!, mockOptions[1]!];
      const onSearch = jest.fn().mockResolvedValue(searchResults);

      render(<Selectable {...defaultProps} options={[]} onSearch={onSearch} />);

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "test");

      // Wait for debounce and search to complete
      await waitFor(
        () => {
          expect(onSearch).toHaveBeenCalledWith("test");
        },
        { timeout: 1500 }
      );

      // Verify that results were returned from the API
      expect(onSearch).toHaveReturnedWith(Promise.resolve(searchResults));
    });

    it('should show "Type to search..." when options are empty and onSearch is provided', async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn().mockResolvedValue([]);

      render(
        <Selectable
          {...defaultProps}
          options={[]}
          onSearch={onSearch}
          typeToSearchText="Type to search..."
        />
      );

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      expect(screen.getByText("Type to search...")).toBeInTheDocument();
    });

    it("should show custom typeToSearchText when provided", async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn().mockResolvedValue([]);

      render(
        <Selectable
          {...defaultProps}
          options={[]}
          onSearch={onSearch}
          typeToSearchText="Start typing to find items..."
        />
      );

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      expect(
        screen.getByText("Start typing to find items...")
      ).toBeInTheDocument();
    });

    it("should show noResult message after searching when no results found", async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn().mockResolvedValue([]);

      render(
        <Selectable
          {...defaultProps}
          options={[]}
          onSearch={onSearch}
          typeToSearchText="Type to search..."
          noResult="No results found"
        />
      );

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      // Initially should show "Type to search..."
      expect(screen.getByText("Type to search...")).toBeInTheDocument();

      // After searching, should show "No results found"
      const searchInput = screen.getByPlaceholderText("Search...");
      await user.type(searchInput, "test");

      await waitFor(
        () => {
          expect(onSearch).toHaveBeenCalledWith("test");
        },
        { timeout: 1500 }
      );

      await waitFor(
        () => {
          expect(screen.getByText("No results found")).toBeInTheDocument();
        },
        { timeout: 500 }
      );
    });

    it("should not show typeToSearchText when options are provided", async () => {
      const user = userEvent.setup();
      const onSearch = jest.fn().mockResolvedValue([]);

      render(
        <Selectable
          {...defaultProps}
          options={mockOptions}
          onSearch={onSearch}
          typeToSearchText="Type to search..."
        />
      );

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      expect(screen.queryByText("Type to search...")).not.toBeInTheDocument();
      expect(screen.getByText("Option 1")).toBeInTheDocument();
    });
  });

  describe("Grouping", () => {
    it("should group options when getGroup is provided", async () => {
      const user = userEvent.setup();

      render(
        <Selectable
          {...defaultProps}
          getGroup={(option) => option.group || ""}
        />
      );

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      expect(screen.getByText("Group A")).toBeInTheDocument();
      expect(screen.getByText("Group B")).toBeInTheDocument();
    });

    it("should sort groups alphabetically", async () => {
      const user = userEvent.setup();
      const options: TestOption[] = [
        { id: "1", name: "Option 1", group: "Zebra" },
        { id: "2", name: "Option 2", group: "Apple" },
      ];

      render(
        <Selectable
          {...defaultProps}
          options={options}
          getGroup={(option) => option.group || ""}
        />
      );

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      // Check that Apple group comes before Zebra
      const groupHeadings = screen.getAllByRole("group");
      const appleGroup = groupHeadings.find(
        (g) =>
          g.getAttribute("aria-labelledby")?.includes("Apple") ||
          g.textContent?.includes("Option 2")
      );
      expect(appleGroup).toBeInTheDocument();
    });
  });

  describe("Custom Rendering", () => {
    it("should use custom renderOption when provided", async () => {
      const user = userEvent.setup();
      const renderOption = jest.fn((option: TestOption) => (
        <div data-testid={`custom-${option.id}`}>{option.name} (Custom)</div>
      ));

      render(
        <Selectable
          {...defaultProps}
          defaultValue={[mockOptions[0]!]}
          renderOption={renderOption}
        />
      );

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      // Expand selected section
      const selectedHeader = screen.getByText("Selected");
      await user.click(selectedHeader);

      expect(screen.getByTestId("custom-1")).toBeInTheDocument();
      expect(screen.getByText("Option 1 (Custom)")).toBeInTheDocument();
    });

    it("should use custom renderTrigger when provided", () => {
      const renderTrigger = jest.fn(({ children, disabled }) => (
        <div data-testid="custom-trigger" data-disabled={disabled}>
          {children}
        </div>
      ));

      render(<Selectable {...defaultProps} renderTrigger={renderTrigger} />);

      expect(screen.getByTestId("custom-trigger")).toBeInTheDocument();
      expect(renderTrigger).toHaveBeenCalled();

      // Check the last call
      const lastCall =
        renderTrigger.mock.calls[renderTrigger.mock.calls.length - 1];
      expect(lastCall?.[0]).toMatchObject({
        disabled: false,
      });
    });

    it("should pass disabled prop to renderTrigger", () => {
      const renderTrigger = jest.fn(({ children, disabled }) => (
        <div data-testid="custom-trigger" data-disabled={disabled}>
          {children}
        </div>
      ));

      render(
        <Selectable
          {...defaultProps}
          renderTrigger={renderTrigger}
          disabled={true}
        />
      );

      expect(screen.getByTestId("custom-trigger")).toBeInTheDocument();

      // Check the last call
      const lastCall =
        renderTrigger.mock.calls[renderTrigger.mock.calls.length - 1];
      expect(lastCall?.[0]).toMatchObject({
        disabled: true,
      });

      const trigger = screen.getByTestId("custom-trigger");
      expect(trigger).toHaveAttribute("data-disabled", "true");
    });
  });

  describe("Single Line Mode", () => {
    it("should display selected options in single line", () => {
      render(
        <Selectable
          {...defaultProps}
          singleLine={true}
          defaultValue={[mockOptions[0]!, mockOptions[1]!]}
        />
      );

      const selectedText = screen.getByText("Option 1, Option 2");
      expect(selectedText).toBeInTheDocument();
      expect(selectedText.className).toContain("truncate");
    });

    it("should not show badges in single line mode", () => {
      const { container } = render(
        <Selectable
          {...defaultProps}
          singleLine={true}
          defaultValue={[mockOptions[0]!]}
        />
      );

      const badges = container.querySelectorAll('[class*="badge"]');
      expect(badges.length).toBe(0);
    });
  });

  describe("Selected Options Section", () => {
    it("should show selected section when options are selected", async () => {
      const user = userEvent.setup();

      render(<Selectable {...defaultProps} defaultValue={[mockOptions[0]!]} />);

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      expect(screen.getByText("Selected")).toBeInTheDocument();
    });

    it("should use custom selectedText", async () => {
      const user = userEvent.setup();

      render(
        <Selectable
          {...defaultProps}
          selectedText="Chosen Items"
          defaultValue={[mockOptions[0]!]}
        />
      );

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      expect(screen.getByText("Chosen Items")).toBeInTheDocument();
    });

    it("should toggle selected section on header click", async () => {
      const user = userEvent.setup();

      render(<Selectable {...defaultProps} defaultValue={[mockOptions[0]!]} />);

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      const selectedHeader = screen.getByText("Selected");

      // Check if collapsible section exists
      expect(selectedHeader).toBeInTheDocument();

      // Click to toggle
      await user.click(selectedHeader);

      // Wait for animation
      await waitFor(() => {
        const collapsible = selectedHeader.closest(
          '[data-slot="collapsible-trigger"]'
        );
        expect(collapsible).toHaveAttribute("data-state");
      });
    });

    it("should not show selected section when no options are selected", async () => {
      const user = userEvent.setup();

      render(<Selectable {...defaultProps} />);

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      expect(screen.queryByText("Selected")).not.toBeInTheDocument();
    });
  });

  describe("Option Filtering", () => {
    it("should not show selected options in selectable list", async () => {
      const user = userEvent.setup();

      render(<Selectable {...defaultProps} defaultValue={[mockOptions[0]!]} />);

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      // Option 1 should only appear in selected section
      const option1Elements = screen.getAllByText("Option 1");
      expect(option1Elements.length).toBe(1); // Only in selected section

      // Other options should be available
      expect(screen.getByText("Option 2")).toBeInTheDocument();
      expect(screen.getByText("Option 3")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty options array", async () => {
      const user = userEvent.setup();

      render(
        <Selectable
          {...defaultProps}
          options={[]}
          noResult="No options available"
        />
      );

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      expect(screen.getByText("No options available")).toBeInTheDocument();
    });

    it("should handle undefined options", async () => {
      const user = userEvent.setup();

      render(
        <Selectable
          {...defaultProps}
          options={undefined}
          noResult="No options"
        />
      );

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      expect(screen.getByText("No options")).toBeInTheDocument();
    });

    it("should handle rapid selection changes", async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(<Selectable {...defaultProps} onChange={onChange} />);

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      // Rapidly select multiple options
      await user.click(screen.getByText("Option 1"));
      await user.click(screen.getByText("Option 2"));
      await user.click(screen.getByText("Option 3"));

      expect(onChange).toHaveBeenCalledTimes(3);
    });

    it("should handle option key extraction correctly", async () => {
      const user = userEvent.setup();
      const customOptions = [
        { customId: "unique-1", label: "First" },
        { customId: "unique-2", label: "Second" },
      ];

      render(
        <Selectable
          options={customOptions}
          getKey={(opt) => opt.customId}
          getLabel={(opt) => opt.label}
          onChange={jest.fn()}
        />
      );

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", async () => {
      const user = userEvent.setup();

      render(<Selectable {...defaultProps} />);

      const trigger = screen.getByRole("button");
      expect(trigger).toBeInTheDocument();

      await user.click(trigger);

      const searchInput = screen.getByPlaceholderText("Search...");
      expect(searchInput).toBeInTheDocument();
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();

      render(<Selectable {...defaultProps} />);

      const trigger = screen.getByRole("button");

      // Open with Enter key
      trigger.focus();
      await user.keyboard("{Enter}");

      expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
    });

    it("should have id attribute on no-result element", async () => {
      const user = userEvent.setup();

      render(
        <Selectable {...defaultProps} options={[]} noResult="No results" />
      );

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      const noResultElement = document.getElementById("no-result-text");
      expect(noResultElement).toBeInTheDocument();
      expect(noResultElement).toHaveTextContent("No results");
    });
  });

  describe("Disabled State", () => {
    it("should render as disabled when disabled prop is true", () => {
      render(<Selectable {...defaultProps} disabled={true} />);

      const trigger = screen.getByRole("button");
      expect(trigger).toBeDisabled();
    });

    it("should not open popover when disabled", async () => {
      const user = userEvent.setup();

      render(<Selectable {...defaultProps} disabled={true} />);

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      // Popover should not open
      expect(
        screen.queryByPlaceholderText("Search...")
      ).not.toBeInTheDocument();
    });

    it("should not allow badge removal when disabled", async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(
        <Selectable
          {...defaultProps}
          disabled={true}
          defaultValue={[mockOptions[0]!]}
          onChange={onChange}
        />
      );

      // Try to click on badge to remove
      const badges = screen.getAllByText("Option 1");
      await user.click(badges[0]!);

      // onChange should not be called
      expect(onChange).not.toHaveBeenCalled();
    });

    it("should not trigger onChange when disabled in single mode", async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(
        <Selectable
          {...defaultProps}
          disabled={true}
          singular={true}
          onChange={onChange}
        />
      );

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      // Popover should not open, so onChange should not be called
      expect(onChange).not.toHaveBeenCalled();
    });

    it("should have disabled styling", () => {
      const { container } = render(
        <Selectable {...defaultProps} disabled={true} />
      );

      const trigger = screen.getByRole("button");
      expect(trigger).toHaveClass("disabled:pointer-events-none");
      expect(trigger).toHaveClass("disabled:opacity-50");
    });

    it("should allow enabling after being disabled", async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <Selectable {...defaultProps} disabled={true} />
      );

      const trigger = screen.getByRole("button");
      expect(trigger).toBeDisabled();

      // Re-render with disabled=false
      rerender(<Selectable {...defaultProps} disabled={false} />);

      expect(trigger).not.toBeDisabled();

      // Should be able to open popover
      await user.click(trigger);
      expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
    });
  });

  describe("Disabled Options", () => {
    it("should mark options as disabled when getDisabled returns true", async () => {
      const user = userEvent.setup();

      render(
        <Selectable
          {...defaultProps}
          getDisabled={(option) => option.id === "2"}
        />
      );

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      const option1 = screen.getByRole("option", { name: "Option 1" });
      const option2 = screen.getByRole("option", { name: "Option 2" });

      expect(option1).not.toHaveAttribute("aria-disabled", "true");
      expect(option2).toHaveAttribute("aria-disabled", "true");
    });

    it("should not allow selecting disabled options", async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(
        <Selectable
          {...defaultProps}
          getDisabled={(option) => option.id === "2"}
          onChange={onChange}
        />
      );

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      const option2 = screen.getByRole("option", { name: "Option 2" });
      await user.click(option2);

      // onChange should not be called for disabled option
      expect(onChange).not.toHaveBeenCalled();
    });

    it("should allow selecting non-disabled options", async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(
        <Selectable
          {...defaultProps}
          getDisabled={(option) => option.id === "2"}
          onChange={onChange}
        />
      );

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      const option1 = screen.getByRole("option", { name: "Option 1" });
      await user.click(option1);

      // onChange should be called for enabled option
      expect(onChange).toHaveBeenCalledWith([mockOptions[0]]);
    });

    it("should not allow deselecting disabled options from selected list", async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(
        <Selectable
          {...defaultProps}
          defaultValue={[mockOptions[0]!, mockOptions[1]!]}
          getDisabled={(option) => option.id === "1"}
          onChange={onChange}
        />
      );

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      // Expand selected section
      const selectedHeader = screen.getByText("Selected");
      await user.click(selectedHeader);

      const selectedOption1 = screen.getAllByRole("option", {
        name: /option 1/i,
      })[0];
      await user.click(selectedOption1!);

      // onChange should not be called when trying to deselect disabled option
      expect(onChange).not.toHaveBeenCalled();
    });

    it("should allow deselecting non-disabled options from selected list", async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(
        <Selectable
          {...defaultProps}
          defaultValue={[mockOptions[0]!, mockOptions[1]!]}
          getDisabled={(option) => option.id === "1"}
          onChange={onChange}
        />
      );

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      // Expand selected section
      const selectedHeader = screen.getByText("Selected");
      await user.click(selectedHeader);

      const selectedOption2 = screen.getAllByRole("option", {
        name: /option 2/i,
      })[0];
      await user.click(selectedOption2!);

      // onChange should be called when deselecting non-disabled option
      expect(onChange).toHaveBeenCalledWith([mockOptions[0]]);
    });

    it("should work without getDisabled prop", async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(<Selectable {...defaultProps} onChange={onChange} />);

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      const option1 = screen.getByRole("option", { name: "Option 1" });
      await user.click(option1);

      // All options should be selectable when getDisabled is not provided
      expect(onChange).toHaveBeenCalledWith([mockOptions[0]]);
    });

    it("should handle multiple disabled options", async () => {
      const user = userEvent.setup();

      render(
        <Selectable
          {...defaultProps}
          getDisabled={(option) => option.id === "2" || option.id === "4"}
        />
      );

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      const option1 = screen.getByRole("option", { name: "Option 1" });
      const option2 = screen.getByRole("option", { name: "Option 2" });
      const option3 = screen.getByRole("option", { name: "Option 3" });
      const option4 = screen.getByRole("option", { name: "Option 4" });

      expect(option1).not.toHaveAttribute("aria-disabled", "true");
      expect(option2).toHaveAttribute("aria-disabled", "true");
      expect(option3).not.toHaveAttribute("aria-disabled", "true");
      expect(option4).toHaveAttribute("aria-disabled", "true");
    });

    it("should prevent disabled option selection in singular mode", async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(
        <Selectable
          {...defaultProps}
          singular={true}
          getDisabled={(option) => option.id === "2"}
          onChange={onChange}
        />
      );

      const trigger = screen.getByRole("button");
      await user.click(trigger);

      const option2 = screen.getByRole("option", { name: "Option 2" });
      await user.click(option2);

      // onChange should not be called for disabled option in singular mode
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
