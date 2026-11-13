import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StarRating } from "../custom/star-rating";

function radio(i: number): HTMLElement {
  const el = screen.getAllByRole("radio").at(i);
  if (!el) throw new Error(`no radio at ${i}`);
  return el;
}

describe("StarRating display mode", () => {
  it("exposes the fractional value as an img", () => {
    render(<StarRating value={3.5} />);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "3.5 of 5");
    expect(screen.queryByRole("radio")).toBeNull();
  });

  it("clamps above max and below zero, and non-finite to zero", () => {
    const { rerender } = render(<StarRating value={7} />);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "5 of 5");
    rerender(<StarRating value={-1} />);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "0 of 5");
    rerender(<StarRating value={Number.NaN} />);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "0 of 5");
  });

  it("respects max and renders that many stars", () => {
    render(<StarRating value={0} max={3} />);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "0 of 3");
    expect(screen.getAllByTestId("lucide-star")).toHaveLength(3);
  });

  it("does not leak props onto the DOM", () => {
    render(<StarRating value={1} size="lg" labels={{}} />);
    const el = screen.getByRole("img");
    expect(el).not.toHaveAttribute("size");
    expect(el).not.toHaveAttribute("labels");
  });
});

describe("StarRating input mode", () => {
  it("renders a radiogroup with one named radio per star", () => {
    render(<StarRating value={2} onValueChange={() => {}} />);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(5);
    expect(radio(0)).toHaveAccessibleName("1 of 5");
    expect(radio(1)).toHaveAttribute("aria-checked", "true");
    expect(radio(0)).toHaveAttribute("aria-checked", "false");
  });

  it("uses a roving tabindex on the checked radio", () => {
    render(<StarRating value={3} onValueChange={() => {}} />);
    expect(screen.getAllByRole("radio").map((r) => r.tabIndex)).toEqual([-1, -1, 0, -1, -1]);
  });

  it("makes the first radio the tab stop when nothing is checked", () => {
    render(<StarRating value={0} onValueChange={() => {}} />);
    expect(screen.getAllByRole("radio").map((r) => r.tabIndex)).toEqual([0, -1, -1, -1, -1]);
  });

  it("calls onValueChange with the clicked star", async () => {
    const onValueChange = jest.fn();
    render(<StarRating value={1} onValueChange={onValueChange} />);
    await userEvent.click(radio(3));
    expect(onValueChange).toHaveBeenCalledWith(4);
  });

  it("ArrowRight from 4 selects 5 and moves focus", async () => {
    const onValueChange = jest.fn();
    render(<StarRating value={4} onValueChange={onValueChange} />);
    radio(3).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenCalledWith(5);
    expect(radio(4)).toHaveFocus();
  });

  it("ArrowLeft from 1 stays at 1", async () => {
    const onValueChange = jest.fn();
    render(<StarRating value={1} onValueChange={onValueChange} />);
    radio(0).focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(onValueChange).not.toHaveBeenCalledWith(0);
    expect(onValueChange.mock.calls.every(([v]) => v === 1)).toBe(true);
  });

  it("ArrowRight from 5 stays at 5", async () => {
    const onValueChange = jest.fn();
    render(<StarRating value={5} onValueChange={onValueChange} />);
    radio(4).focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onValueChange.mock.calls.every(([v]) => v === 5)).toBe(true);
  });

  it("hover previews without calling onValueChange and restores on leave", () => {
    const onValueChange = jest.fn();
    render(<StarRating value={2} onValueChange={onValueChange} />);
    const group = screen.getByRole("radiogroup");
    fireEvent.mouseEnter(radio(3));
    fireEvent.mouseOver(radio(3));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(radio(1)).toHaveAttribute("aria-checked", "true");
    fireEvent.mouseLeave(group);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("blocks input when disabled", async () => {
    const onValueChange = jest.fn();
    render(<StarRating value={2} onValueChange={onValueChange} disabled />);
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await userEvent.click(radio(3));
    fireEvent.keyDown(radio(1), { key: "ArrowRight" });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("overrides the default labels", () => {
    render(
      <StarRating
        value={2}
        onValueChange={() => {}}
        labels={{
          rating: (v, m) => `${v}/${m} puan`,
          star: (n, m) => `${n}. yildiz / ${m}`,
        }}
      />,
    );
    expect(screen.getByRole("radiogroup")).toHaveAttribute(
      "aria-label",
      "2/5 puan",
    );
    expect(radio(0)).toHaveAccessibleName(
      "1. yildiz / 5",
    );
  });
});
