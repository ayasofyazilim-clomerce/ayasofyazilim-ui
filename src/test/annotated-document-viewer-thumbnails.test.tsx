import { act, fireEvent, render, screen, within } from "@testing-library/react";
import {
  AnnotatedDocumentViewer,
  type AnnotatedDocumentViewerProps,
} from "../custom/annotated-document-viewer";

/** A controllable IntersectionObserver: tests decide which observed elements are on screen. */
class FakeObserver {
  static instances: FakeObserver[] = [];
  observed = new Set<Element>();
  root = null;
  rootMargin = "";
  thresholds = [];
  constructor(private callback: IntersectionObserverCallback) {
    FakeObserver.instances.push(this);
  }
  observe = (el: Element) => void this.observed.add(el);
  unobserve = (el: Element) => void this.observed.delete(el);
  disconnect = jest.fn(() => this.observed.clear());
  takeRecords = () => [];
  show(el: Element) {
    this.callback(
      [{ target: el, isIntersecting: true } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
}

/** Brings every currently observed element on screen. */
function showAll() {
  act(() => {
    for (const observer of [...FakeObserver.instances]) {
      for (const el of [...observer.observed]) observer.show(el);
    }
  });
}

beforeEach(() => {
  FakeObserver.instances = [];
  Object.defineProperty(window, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: FakeObserver,
  });
});

const PAGES: AnnotatedDocumentViewerProps["pages"] = [
  { src: "page-1.png" },
  { src: null },
  { src: null },
  { src: "page-4.png" },
];

function renderViewer(props: Partial<AnnotatedDocumentViewerProps> = {}) {
  const onPageChange = jest.fn();
  const onPageNeeded = jest.fn();
  const utils = render(
    <AnnotatedDocumentViewer
      pages={PAGES}
      pageIndex={0}
      onPageChange={onPageChange}
      onPageNeeded={onPageNeeded}
      thumbnails
      {...props}
    />
  );
  return { ...utils, onPageChange, onPageNeeded };
}

describe("AnnotatedDocumentViewer: thumbnails", () => {
  it("renders no strip by default", () => {
    const { container } = renderViewer({ thumbnails: undefined });
    expect(
      container.querySelector('[data-slot="annotated-document-thumbnails"]')
    ).toBeNull();
    expect(screen.queryByRole("group", { name: "Page thumbnails" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Page 1" })).toBeNull();
    expect(FakeObserver.instances).toHaveLength(0);
  });

  it("keeps the root markup unchanged when thumbnails is false", () => {
    const { container } = renderViewer({ thumbnails: false });
    expect(container.firstElementChild).toHaveAttribute(
      "class",
      "flex w-full min-w-0"
    );
  });

  it("renders a labelled strip with a button per page", () => {
    renderViewer();
    const strip = screen.getByRole("group", { name: "Page thumbnails" });
    for (let n = 1; n <= 4; n++) {
      expect(
        within(strip).getByRole("button", { name: `Page ${n}` })
      ).toBeInTheDocument();
    }
  });

  it("marks the current page with aria-current and calls onPageChange on a click", () => {
    const { onPageChange } = renderViewer({ pageIndex: 3 });
    expect(screen.getByRole("button", { name: "Page 4" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("button", { name: "Page 1" })).not.toHaveAttribute(
      "aria-current"
    );
    fireEvent.click(screen.getByRole("button", { name: "Page 2" }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("reuses a loaded page's image for its thumbnail", () => {
    renderViewer();
    const button = screen.getByRole("button", { name: "Page 4" });
    expect(button.querySelector("img")).toHaveAttribute("src", "page-4.png");
    expect(
      screen.getByRole("button", { name: "Page 2" }).querySelector("img")
    ).toBeNull();
  });

  it("asks once for each unloaded page that scrolls into view, never for a loaded one", () => {
    const { onPageNeeded } = renderViewer();
    expect(onPageNeeded).not.toHaveBeenCalled();
    showAll();
    showAll();
    expect(onPageNeeded).toHaveBeenCalledTimes(2);
    expect(onPageNeeded).toHaveBeenCalledWith(1);
    expect(onPageNeeded).toHaveBeenCalledWith(2);
  });

  it("does not ask again for a page still loading when another one arrives", () => {
    const { onPageNeeded, rerender, onPageChange } = renderViewer();
    showAll();
    rerender(
      <AnnotatedDocumentViewer
        pages={[PAGES[0]!, { src: null }, { src: "page-3.png" }, PAGES[3]!]}
        pageIndex={0}
        onPageChange={onPageChange}
        onPageNeeded={onPageNeeded}
        thumbnails
      />
    );
    showAll();
    expect(onPageNeeded).toHaveBeenCalledTimes(2);
  });

  it("asks for nothing when every page is loaded", () => {
    const { onPageNeeded } = renderViewer({
      pages: [{ src: "a.png" }, { src: "b.png" }],
    });
    showAll();
    expect(onPageNeeded).not.toHaveBeenCalled();
  });

  it("uses the label overrides", () => {
    renderViewer({
      labels: {
        thumbnails: "Sayfa küçük resimleri",
        pageN: (n) => `Sayfa ${n}`,
      },
    });
    const strip = screen.getByRole("group", { name: "Sayfa küçük resimleri" });
    expect(
      within(strip).getByRole("button", { name: "Sayfa 2" })
    ).toBeInTheDocument();
  });

  it("applies the thumbnails class slot", () => {
    renderViewer({ classNames: { thumbnails: "strip-slot" } });
    expect(screen.getByRole("group", { name: "Page thumbnails" })).toHaveClass(
      "strip-slot"
    );
  });

  it("does not re-render the strip when only strip-unrelated props change", () => {
    const pageN = jest.fn((n: number) => `Page ${n}`);
    const labels = { pageN };
    const props = {
      pages: PAGES,
      pageIndex: 0,
      onPageChange: jest.fn(),
      onPageNeeded: jest.fn(),
      thumbnails: true,
      labels,
    };
    const { rerender } = render(<AnnotatedDocumentViewer {...props} />);
    const calls = pageN.mock.calls.length;
    expect(calls).toBeGreaterThan(0);
    rerender(<AnnotatedDocumentViewer {...props} activeIds={["a"]} />);
    rerender(
      <AnnotatedDocumentViewer
        {...props}
        activeIds={["b"]}
        relatedIds={["a"]}
      />
    );
    expect(pageN.mock.calls.length).toBe(calls);
    rerender(<AnnotatedDocumentViewer {...props} pageIndex={1} />);
    expect(pageN.mock.calls.length).toBeGreaterThan(calls);
  });

  it("requests only the thumbnail that came into view", () => {
    const { onPageNeeded } = renderViewer();
    const observer = FakeObserver.instances[0]!;
    const page2 = [...observer.observed].find(
      (el) => (el as HTMLElement).dataset.pageIndex === "2"
    )!;
    expect(page2).toBeDefined();
    act(() => observer.show(page2));
    expect(onPageNeeded).toHaveBeenCalledTimes(1);
    expect(onPageNeeded).toHaveBeenCalledWith(2);
  });

  it("disconnects the observer on unmount", () => {
    const { unmount } = renderViewer();
    const observer = FakeObserver.instances[0]!;
    expect(observer.disconnect).not.toHaveBeenCalled();
    unmount();
    expect(observer.disconnect).toHaveBeenCalled();
  });

  it("asks again for a still-missing page after documentKey changes, not after a plain re-render", () => {
    const { onPageNeeded, rerender, onPageChange } = renderViewer({
      documentKey: "a",
    });
    showAll();
    expect(onPageNeeded).toHaveBeenCalledTimes(2);
    const again = (documentKey: string, pages = PAGES.map((p) => ({ ...p }))) =>
      rerender(
        <AnnotatedDocumentViewer
          pages={pages}
          pageIndex={0}
          onPageChange={onPageChange}
          onPageNeeded={onPageNeeded}
          thumbnails
          documentKey={documentKey}
        />
      );
    // A new array with the same content (a host re-rendering) resets nothing.
    again("a");
    showAll();
    expect(onPageNeeded).toHaveBeenCalledTimes(2);
    // A new document with the same null indices is requested afresh.
    again("b");
    showAll();
    expect(onPageNeeded).toHaveBeenCalledTimes(4);
    // So is one whose page count changed.
    again(
      "b",
      [...PAGES, { src: null }].map((p) => ({ ...p }))
    );
    showAll();
    expect(onPageNeeded).toHaveBeenCalledTimes(7);
  });
});
