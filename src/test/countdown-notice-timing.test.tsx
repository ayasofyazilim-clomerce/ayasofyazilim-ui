import * as React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { CountdownNotice, formatCountdown } from "../custom/countdown-notice";

const NOW = new Date("2026-01-01T00:00:00Z").getTime();

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

describe("formatCountdown", () => {
  it.each([
    [0, "0:00"],
    [59, "0:59"],
    [61, "1:01"],
    [3600, "1:00:00"],
    [3661, "1:01:01"],
    [-5, "0:00"],
    [NaN, "0:00"],
    [Infinity, "0:00"],
  ])("formats %p as %p", (input, expected) => {
    expect(formatCountdown(input)).toBe(expected);
  });
});

describe("CountdownNotice timing", () => {
  const description = ({ formatted }: { formatted: string }) => (
    <span>left {formatted}</span>
  );

  it("ticks once a second", () => {
    render(<CountdownNotice until={NOW + 90_000} description={description} />);
    expect(screen.getByText("left 1:30")).toBeInTheDocument();
    advance(1000);
    expect(screen.getByText("left 1:29")).toBeInTheDocument();
  });

  it("recomputes from the clock when timers are throttled", () => {
    render(<CountdownNotice until={NOW + 90_000} description={description} />);
    act(() => {
      // The clock leaps 29 s, then the one timer tick (+1 s) lands at 30 s.
      jest.setSystemTime(NOW + 29_000);
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText("left 1:00")).toBeInTheDocument();
  });

  it("renders the elapsed state at once for a past until, firing onElapsed once", () => {
    const onElapsed = jest.fn();
    const desc = jest.fn(
      ({
        totalSeconds,
        formatted,
      }: {
        totalSeconds: number;
        formatted: string;
      }) => (
        <span>
          left {formatted} {totalSeconds}
        </span>
      ),
    );
    const { rerender } = render(
      <CountdownNotice
        until={NOW - 5000}
        description={desc}
        elapsed="Done"
        onElapsed={onElapsed}
      />,
    );
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(onElapsed).toHaveBeenCalledTimes(1);
    for (const call of desc.mock.calls) {
      expect(call[0].totalSeconds).toBeGreaterThanOrEqual(0);
    }
    rerender(
      <CountdownNotice
        until={NOW - 5000}
        description={desc}
        elapsed="Done"
        onElapsed={onElapsed}
      />,
    );
    advance(3000);
    expect(onElapsed).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("switches to elapsed when the time runs out and clears the interval", () => {
    const onElapsed = jest.fn();
    render(
      <CountdownNotice
        until={NOW + 2000}
        description={description}
        elapsed="Done"
        onElapsed={onElapsed}
      />,
    );
    expect(onElapsed).not.toHaveBeenCalled();
    advance(2000);
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.queryByText(/left/)).not.toBeInTheDocument();
    expect(onElapsed).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("shows Retry only at zero and only with onRetry", () => {
    const onRetry = jest.fn();
    const { unmount } = render(
      <CountdownNotice
        until={NOW + 1000}
        description={description}
        onRetry={onRetry}
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    advance(1000);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    unmount();

    render(<CountdownNotice until={NOW - 1} description={description} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("uses a custom retry label", () => {
    render(
      <CountdownNotice
        until={NOW - 1}
        description={description}
        onRetry={() => undefined}
        labels={{ retry: "Try again" }}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });

  it("does not make the ticking text a live region", () => {
    const { container } = render(
      <CountdownNotice
        until={NOW + 5000}
        title="Wait"
        description={description}
      />,
    );
    expect(container.querySelector("[role='alert']")).toBeNull();
    expect(container.querySelector("[aria-live]")).toBeNull();
  });

  it("clears the interval on unmount", () => {
    const { unmount } = render(
      <CountdownNotice until={NOW + 60_000} description={description} />,
    );
    expect(jest.getTimerCount()).toBe(1);
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe("CountdownNotice onElapsed once per target", () => {
  const description = ({ formatted }: { formatted: string }) => (
    <span>{formatted}</span>
  );

  it("fires once under StrictMode for a past until", () => {
    const onElapsed = jest.fn();
    render(
      <React.StrictMode>
        <CountdownNotice
          until={NOW - 5000}
          description={description}
          onElapsed={onElapsed}
        />
      </React.StrictMode>,
    );
    advance(3000);
    expect(onElapsed).toHaveBeenCalledTimes(1);
  });

  it("fires again when until changes to a new target that then elapses", () => {
    const onElapsed = jest.fn();
    const { rerender } = render(
      <CountdownNotice
        until={NOW - 1}
        description={description}
        onElapsed={onElapsed}
      />,
    );
    expect(onElapsed).toHaveBeenCalledTimes(1);
    rerender(
      <CountdownNotice
        until={NOW + 2000}
        description={description}
        onElapsed={onElapsed}
      />,
    );
    expect(onElapsed).toHaveBeenCalledTimes(1);
    advance(2000);
    expect(onElapsed).toHaveBeenCalledTimes(2);
    expect(jest.getTimerCount()).toBe(0);
  });
});
