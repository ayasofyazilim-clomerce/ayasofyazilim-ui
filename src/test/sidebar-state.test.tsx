import React from "react";
import { renderToString } from "react-dom/server";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommandDialog } from "../components/command";
import {
  Sidebar,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "../components/sidebar";

jest.mock("../hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }: React.ComponentProps<"a">) => (
    <a {...props}>{children}</a>
  ),
}));

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {};
  window.ResizeObserver =
    window.ResizeObserver ||
    (class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver);
  window.matchMedia =
    window.matchMedia ||
    ((query: string) =>
      ({
        matches: false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
        onchange: null,
      }) as unknown as MediaQueryList);
});

function pressCtrlB(target: Element | Document = document.body) {
  act(() => {
    target.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "b",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      })
    );
  });
}

function Shell(props: {
  defaultOpen?: boolean | string[];
  onOpenChange?: (open: string[]) => void;
}) {
  return (
    <SidebarProvider {...props}>
      <Sidebar name="s" collapsible="icon">
        <SidebarRail name="s" />
      </Sidebar>
      <SidebarTrigger name="s" />
      <input aria-label="field" />
    </SidebarProvider>
  );
}

const trigger = () =>
  document.querySelector('[data-slot="sidebar-trigger"]') as HTMLElement;

const state = () =>
  document.querySelector('[data-slot="sidebar"]')?.getAttribute("data-state");

describe("sidebar server render", () => {
  it("renders expanded when defaultOpen", () => {
    const html = renderToString(
      <SidebarProvider defaultOpen>
        <Sidebar name="s" collapsible="icon">
          x
        </Sidebar>
      </SidebarProvider>
    );
    expect(html).toContain('data-state="expanded"');
  });

  it("renders collapsed when defaultOpen is false", () => {
    const html = renderToString(
      <SidebarProvider defaultOpen={false}>
        <Sidebar name="s" collapsible="icon">
          x
        </Sidebar>
      </SidebarProvider>
    );
    expect(html).toContain('data-state="collapsed"');
  });

  it("honours a name list", () => {
    const html = renderToString(
      <SidebarProvider defaultOpen={["other"]}>
        <Sidebar name="s" collapsible="icon">
          x
        </Sidebar>
      </SidebarProvider>
    );
    expect(html).toContain('data-state="collapsed"');
  });
});

describe("sidebar cookie", () => {
  it("writes false then true", async () => {
    const user = userEvent.setup();
    render(<Shell defaultOpen />);
    await user.click(trigger());
    expect(document.cookie).toContain("sidebar_state_s=false");
    await user.click(trigger());
    expect(document.cookie).toContain("sidebar_state_s=true");
  });
});

describe("sidebar Ctrl+B", () => {
  it("does nothing while an input has focus", () => {
    render(<Shell defaultOpen />);
    const input = screen.getByLabelText("field");
    input.focus();
    pressCtrlB(input);
    expect(state()).toBe("expanded");
  });

  it("toggles with focus on the body", () => {
    render(<Shell defaultOpen />);
    (document.activeElement as HTMLElement | null)?.blur();
    pressCtrlB(document.body);
    expect(state()).toBe("collapsed");
  });
});

describe("sidebar onOpenChange", () => {
  it("is called once per toggle with the open names", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    render(<Shell defaultOpen onOpenChange={onOpenChange} />);
    expect(onOpenChange).not.toHaveBeenCalled();
    await user.click(trigger());
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenLastCalledWith([]);
    await user.click(trigger());
    expect(onOpenChange).toHaveBeenCalledTimes(2);
    expect(onOpenChange).toHaveBeenLastCalledWith(["s"]);
  });
});

describe("labels", () => {
  it("SidebarRail uses label", () => {
    render(
      <SidebarProvider>
        <SidebarRail name="s" label="Kenar" />
      </SidebarProvider>
    );
    expect(document.querySelector('[data-slot="sidebar-rail"]')).toHaveAttribute(
      "aria-label",
      "Kenar"
    );
    expect(document.querySelector('[data-slot="sidebar-rail"]')).toHaveAttribute(
      "title",
      "Kenar"
    );
  });

  it("SidebarRail keeps the English default", () => {
    render(
      <SidebarProvider>
        <SidebarRail name="s" />
      </SidebarProvider>
    );
    expect(document.querySelector('[data-slot="sidebar-rail"]')).toHaveAttribute(
      "aria-label",
      "Toggle Sidebar"
    );
  });

  it("CommandDialog forwards closeLabel", () => {
    render(<CommandDialog open closeLabel="Kapat" />);
    expect(screen.getByRole("button", { name: "Kapat" })).toBeInTheDocument();
  });

  it("CommandDialog default close label is Close", () => {
    render(<CommandDialog open />);
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });
});
