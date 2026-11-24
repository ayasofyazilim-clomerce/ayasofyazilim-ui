import React from "react";
import { render, screen } from "@testing-library/react";
import Stepper, { StepperContent } from "../custom/stepper";

// Issue #1087: the header hard-coded light-mode colours (text-white on
// bg-primary, text-black labels), which are unreadable in dark mode. It now
// uses theme tokens, which flip with the .dark class.

function renderStepper(
  headerProps?: React.ComponentProps<typeof Stepper>["headerProps"]
) {
  render(
    <div className="dark">
      <Stepper
        activeTabIndex={1}
        onIndexChange={() => {}}
        headerProps={headerProps}
      >
        <StepperContent title="Account">one</StepperContent>
        <StepperContent title="Profile">two</StepperContent>
        <StepperContent title="Review">three</StepperContent>
      </Stepper>
    </div>
  );
}

const stepCircle = (number: string) => screen.getByText(number);
const stepLabel = (title: string) => screen.getByText(title);

describe("Stepper header colours", () => {
  it("draws the active step with the primary tokens", () => {
    renderStepper();
    const active = stepCircle("2");
    expect(active).toHaveClass("bg-primary", "text-primary-foreground");
    expect(active).not.toHaveClass("text-white");
  });

  it("draws inactive steps with the muted tokens", () => {
    renderStepper();
    for (const number of ["1", "3"]) {
      const inactive = stepCircle(number);
      expect(inactive).toHaveClass("bg-muted", "text-muted-foreground");
      expect(inactive).not.toHaveClass("bg-zinc-200");
      expect(inactive).not.toHaveClass("text-black");
    }
  });

  it("labels the active step with text-foreground and the others muted", () => {
    renderStepper();
    expect(stepLabel("Profile")).toHaveClass("text-foreground");
    expect(stepLabel("Profile")).not.toHaveClass("text-black");
    expect(stepLabel("Account")).toHaveClass("text-muted-foreground");
    expect(stepLabel("Review")).toHaveClass("text-muted-foreground");
  });

  it("still lets activeItemClassName and inactiveItemClassName override", () => {
    renderStepper({
      activeItemClassName: "bg-green-600 text-white",
      inactiveItemClassName: "bg-transparent",
    });
    const active = stepCircle("2");
    expect(active).toHaveClass("bg-green-600", "text-white");
    expect(active).not.toHaveClass("bg-primary");
    expect(active).not.toHaveClass("text-primary-foreground");

    const inactive = stepCircle("1");
    expect(inactive).toHaveClass("bg-transparent", "text-muted-foreground");
    expect(inactive).not.toHaveClass("bg-muted");
  });
});
