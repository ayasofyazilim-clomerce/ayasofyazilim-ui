import { act, renderHook } from "@testing-library/react";
import { useDelayedFlag } from "../custom/master-data-grid/hooks/use-delayed-flag";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("useDelayedFlag", () => {
  it("returns false immediately when the flag turns true", () => {
    const { result, rerender } = renderHook(
      ({ active }) => useDelayedFlag(active, 150),
      { initialProps: { active: false } }
    );
    rerender({ active: true });
    expect(result.current).toBe(false);
  });

  it("returns true once the delay elapses", () => {
    const { result, rerender } = renderHook(
      ({ active }) => useDelayedFlag(active, 150),
      { initialProps: { active: false } }
    );
    rerender({ active: true });
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(result.current).toBe(true);
  });

  it("returns false immediately when the flag turns false, with no trailing delay", () => {
    const { result, rerender } = renderHook(
      ({ active }) => useDelayedFlag(active, 150),
      { initialProps: { active: true } }
    );
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(result.current).toBe(true);

    rerender({ active: false });
    expect(result.current).toBe(false);
  });

  it("never returns true when the flag turns true then false inside the delay window", () => {
    const { result, rerender } = renderHook(
      ({ active }) => useDelayedFlag(active, 150),
      { initialProps: { active: false } }
    );
    rerender({ active: true });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    rerender({ active: false });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe(false);
  });

  it("clears its timer on unmount", () => {
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
    const { rerender, unmount } = renderHook(
      ({ active }) => useDelayedFlag(active, 150),
      { initialProps: { active: false } }
    );
    rerender({ active: true });
    clearTimeoutSpy.mockClear();
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
