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
  disconnect = () => this.observed.clear();
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
    expect(
      screen.getByRole("group", { name: "Page thumbnails" })
    ).toHaveClass("strip-slot");
  });
});
