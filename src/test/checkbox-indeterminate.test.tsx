import { render } from "@testing-library/react";
import { Checkbox } from "../components/checkbox";

const icons = (container: HTMLElement) => ({
  check: container.querySelector('svg[data-lucide="CheckIcon"]'),
  minus: container.querySelector('svg[data-lucide="MinusIcon"]'),
});

describe("Checkbox indeterminate state", () => {
  it("shows the dash and not the check when checked is indeterminate", () => {
    const { container, getByRole } = render(
      <Checkbox checked="indeterminate" aria-label="box" />,
    );
    expect(getByRole("checkbox")).toHaveAttribute("aria-checked", "mixed");
    expect(getByRole("checkbox")).toHaveAttribute(
      "data-state",
      "indeterminate",
    );
    const { check, minus } = icons(container);
    expect(minus).toBeInTheDocument();
    // Both icons are in the DOM; the Tailwind variants swap them (jsdom has no CSS).
    expect(check?.getAttribute("class")).toContain(
      "group-data-[state=indeterminate]:hidden",
    );
    expect(minus?.getAttribute("class")).toContain(
      "group-data-[state=indeterminate]:block",
    );
  });

  it("works for an uncontrolled box that starts indeterminate", () => {
    const { container, getByRole } = render(
      <Checkbox defaultChecked="indeterminate" aria-label="box" />,
    );
    expect(getByRole("checkbox")).toHaveAttribute("aria-checked", "mixed");
    expect(icons(container).minus).toBeInTheDocument();
  });

  it("does not hide the check when checked", () => {
    const { container } = render(<Checkbox checked aria-label="box" />);
    expect(icons(container).check).toBeInTheDocument();
  });
});
