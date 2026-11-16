import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  AnnotatedDocumentViewer,
  DocumentPager,
  type AnnotatedDocumentViewerProps,
  type AnnotationBox,
} from "../custom/annotated-document-viewer";

// jsdom has no PointerEvent, so `fireEvent.pointerDown(el, { clientX })` would build a plain
// Event and drop the coordinates. A MouseEvent subclass carries them, which is all the viewer reads.
beforeAll(() => {
  if (!("PointerEvent" in window)) {
    class PointerEventPolyfill extends MouseEvent {}
    Object.defineProperty(window, "PointerEvent", {
      configurable: true,
      value: PointerEventPolyfill,
    });
  }
});

const PAGES: AnnotatedDocumentViewerProps["pages"] = [
  { src: "page-1.png", alt: "Invoice page 1" },
  { src: "page-2.png", alt: "Invoice page 2" },
  { src: "page-3.png", alt: "Invoice page 3" },
];

const BOXES: AnnotationBox[] = [
  { id: "total#0", page: 0, rect: [0.1, 0.1, 0.3, 0.2], group: "total", color: "red" },
  { id: "total#1", page: 0, rect: [0.1, 0.3, 0.3, 0.4], group: "total", color: "red" },
  { id: "date#0", page: 0, rect: [0.5, 0.1, 0.7, 0.2], group: "date", color: "blue" },
  { id: "iban#0", page: 1, rect: [0.2, 0.5, 0.6, 0.6], group: "iban", color: "green" },
];

function renderViewer(props: Partial<AnnotatedDocumentViewerProps> = {}) {
  const onPageChange = jest.fn();
  const utils = render(
    <AnnotatedDocumentViewer
      pages={PAGES}
      pageIndex={0}
      onPageChange={onPageChange}
      boxes={BOXES}
      {...props}
    />
  );
  return { ...utils, onPageChange };
}

function rects(container: HTMLElement) {
  return Array.from(container.querySelectorAll<SVGRectElement>("rect"));
}

function rectById(container: HTMLElement, id: string) {
  const rect = container.querySelector<SVGRectElement>(`rect[data-box-id="${id}"]`);
  if (!rect) throw new Error(`no rect for box ${id}`);
  return rect;
}

function stage(container: HTMLElement) {
  const el = container.querySelector<HTMLElement>(
    '[data-slot="annotated-document-stage"]'
  );
  if (!el) throw new Error("no stage");
  return el;
}

describe("AnnotatedDocumentViewer: boxes", () => {
  it("draws only the boxes of the current page", () => {
    const { container, rerender, onPageChange } = renderViewer();
    expect(rects(container).map((r) => r.dataset.boxId)).toEqual([
      "total#0",
      "total#1",
      "date#0",
    ]);

    rerender(
      <AnnotatedDocumentViewer
        pages={PAGES}
        pageIndex={1}
        onPageChange={onPageChange}
        boxes={BOXES}
      />
    );
    expect(rects(container).map((r) => r.dataset.boxId)).toEqual(["iban#0"]);
  });

  it("places a box from its page fractions in a unit viewBox", () => {
    const { container } = renderViewer();
    const svg = container.querySelector("svg[viewBox]");
    expect(svg).toHaveAttribute("viewBox", "0 0 1 1");
    expect(svg).toHaveAttribute("preserveAspectRatio", "none");
    const rect = rectById(container, "date#0");
    expect(Number(rect.getAttribute("x"))).toBeCloseTo(0.5);
    expect(Number(rect.getAttribute("y"))).toBeCloseTo(0.1);
    expect(Number(rect.getAttribute("width"))).toBeCloseTo(0.2);
    expect(Number(rect.getAttribute("height"))).toBeCloseTo(0.1);
  });

  it("marks every box of a group active when activeIds names the group", () => {
    const { container } = renderViewer({ activeIds: ["total"] });
    expect(rectById(container, "total#0")).toHaveAttribute("data-state", "active");
    expect(rectById(container, "total#1")).toHaveAttribute("data-state", "active");
    expect(rectById(container, "date#0")).not.toHaveAttribute("data-state");
  });

  it("matches a single box by id", () => {
    const { container } = renderViewer({ activeIds: ["total#1"] });
    expect(rectById(container, "total#0")).not.toHaveAttribute("data-state");
    expect(rectById(container, "total#1")).toHaveAttribute("data-state", "active");
  });

  it("marks relatedIds related, and active wins over related", () => {
    const { container } = renderViewer({
      activeIds: ["total#0"],
      relatedIds: ["total"],
    });
    expect(rectById(container, "total#0")).toHaveAttribute("data-state", "active");
    expect(rectById(container, "total#1")).toHaveAttribute("data-state", "related");
    expect(rectById(container, "date#0")).not.toHaveAttribute("data-state");
  });

  it("hides the boxes from assistive technology", () => {
    const { container } = renderViewer();
    for (const rect of rects(container)) {
      expect(rect).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("gives the boxes no pointer events without handlers", () => {
    const { container } = renderViewer();
    expect(rects(container)).not.toHaveLength(0);
    for (const rect of rects(container)) {
      expect(rect).toHaveStyle({ pointerEvents: "none" });
    }
  });

  it("gives the boxes pointer events when a handler is passed", () => {
    const { container } = renderViewer({ onBoxHover: jest.fn() });
    for (const rect of rects(container)) {
      expect(rect).toHaveStyle({ pointerEvents: "auto" });
    }
  });

  it("calls onBoxHover with the box, then with null", () => {
    const onBoxHover = jest.fn();
    const { container } = renderViewer({ onBoxHover });
    const rect = rectById(container, "date#0");

    fireEvent.pointerEnter(rect);
    expect(onBoxHover).toHaveBeenLastCalledWith(BOXES[2]);

    fireEvent.pointerLeave(rect);
    expect(onBoxHover).toHaveBeenLastCalledWith(null);
    expect(onBoxHover).toHaveBeenCalledTimes(2);
  });

  it("calls onBoxClick for a click that moved less than 4 px", () => {
    const onBoxClick = jest.fn();
    const { container } = renderViewer({ onBoxClick });
    const rect = rectById(container, "total#1");

    fireEvent.pointerDown(rect, { clientX: 100, clientY: 100 });
    fireEvent.click(rect, { clientX: 102, clientY: 102 });
    expect(onBoxClick).toHaveBeenCalledTimes(1);
    expect(onBoxClick).toHaveBeenCalledWith(BOXES[1]);
  });

  it("does not call onBoxClick at the end of a drag (10 px or more)", () => {
    const onBoxClick = jest.fn();
    const { container } = renderViewer({ onBoxClick });
    const rect = rectById(container, "total#1");

    fireEvent.pointerDown(rect, { clientX: 100, clientY: 100 });
    fireEvent.click(rect, { clientX: 110, clientY: 100 });
    expect(onBoxClick).not.toHaveBeenCalled();
  });

  it('draws a "natural"-frame box once the image reports its size', () => {
    const { container } = renderViewer({
      boxes: [{ id: "px", page: 0, rect: [100, 200, 300, 400], frame: "natural" }],
    });
    expect(rects(container)).toHaveLength(0);

    // jsdom never decodes images, so stand in for the decoded size and fire the load.
    const img = screen.getByRole("img");
    Object.defineProperty(img, "naturalWidth", { configurable: true, value: 500 });
    Object.defineProperty(img, "naturalHeight", { configurable: true, value: 1000 });
    fireEvent.load(img);

    const rect = rectById(container, "px");
    expect(Number(rect.getAttribute("x"))).toBeCloseTo(0.2);
    expect(Number(rect.getAttribute("y"))).toBeCloseTo(0.2);
    expect(Number(rect.getAttribute("width"))).toBeCloseTo(0.4);
    expect(Number(rect.getAttribute("height"))).toBeCloseTo(0.2);
  });

  it("applies a box's frame and rotation before drawing it", () => {
    const { container } = renderViewer({
      boxes: [
        {
          id: "turned",
          page: 0,
          rect: [100, 200, 300, 400],
          frame: { width: 1000, height: 2000 },
          rotation: 90,
        },
      ],
    });
    // [0.1,0.1,0.3,0.2] turned 90° → [0.1,0.7,0.2,0.9].
    const rect = rectById(container, "turned");
    expect(Number(rect.getAttribute("x"))).toBeCloseTo(0.1);
    expect(Number(rect.getAttribute("y"))).toBeCloseTo(0.7);
    expect(Number(rect.getAttribute("width"))).toBeCloseTo(0.1);
    expect(Number(rect.getAttribute("height"))).toBeCloseTo(0.2);
  });
});

describe("AnnotatedDocumentViewer: pager", () => {
  it("pages back and forward and disables the buttons at the ends", () => {
    const { onPageChange, rerender } = renderViewer({ pageIndex: 0 });
    const previous = screen.getByRole("button", { name: "Previous page" });
    const next = screen.getByRole("button", { name: "Next page" });
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(previous).toBeDisabled();
    expect(next).toBeEnabled();

    fireEvent.click(next);
    expect(onPageChange).toHaveBeenLastCalledWith(1);

    rerender(
      <AnnotatedDocumentViewer
        pages={PAGES}
        pageIndex={2}
        onPageChange={onPageChange}
        boxes={BOXES}
      />
    );
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    expect(onPageChange).toHaveBeenLastCalledWith(1);
  });

  it("hides the overlaid pager with pager={false}", () => {
    renderViewer({ pager: false });
    expect(screen.queryByRole("button", { name: "Previous page" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Next page" })).toBeNull();
    expect(screen.queryByText("Page 1 of 3")).toBeNull();
  });

  it("renders no pager for a single page", () => {
    renderViewer({ pages: [PAGES[0]!] });
    expect(screen.queryByRole("button", { name: "Next page" })).toBeNull();
  });
});

describe("DocumentPager", () => {
  it("returns null for one page", () => {
    const { container } = render(
      <DocumentPager pageIndex={0} pageCount={1} onPageChange={jest.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("calls onPageChange with index ± 1", () => {
    const onPageChange = jest.fn();
    render(<DocumentPager pageIndex={1} pageCount={3} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    expect(onPageChange).toHaveBeenLastCalledWith(0);
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenLastCalledWith(2);
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
  });

  it("disables both ends", () => {
    const { rerender } = render(
      <DocumentPager pageIndex={0} pageCount={2} onPageChange={jest.fn()} />
    );
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();
    rerender(<DocumentPager pageIndex={1} pageCount={2} onPageChange={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Previous page" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });
});

describe("AnnotatedDocumentViewer: page and loading", () => {
  it("shows the page image with its alt text", () => {
    renderViewer();
    expect(screen.getByRole("img", { name: "Invoice page 1" })).toHaveAttribute(
      "src",
      "page-1.png"
    );
  });

  it("shows the loading label for a page whose src is null", () => {
    const { container } = renderViewer({
      pages: [{ src: null }, PAGES[1]!],
    });
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
    expect(rects(container)).toHaveLength(0);
    // The pager stays, so the reader can move to a page that has loaded.
    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();
  });
});

describe("AnnotatedDocumentViewer: zoom", () => {
  it("starts fitted at 100% with zoom out and reset disabled", () => {
    const { container } = renderViewer();
    const zoom = screen.getByRole("group", { name: "Zoom" });
    expect(zoom).toHaveTextContent("100%");
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reset zoom" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeEnabled();
    expect(stage(container)).toHaveAttribute("data-magnified", "false");
    // At fit a touch drag scrolls the page; nothing is pannable.
    const viewport = container.querySelector(".react-transform-wrapper");
    expect(viewport).toHaveClass("touch-pan-y");
    expect(viewport).not.toHaveClass("touch-none");
    expect(viewport).not.toHaveClass("cursor-grab");
  });

  it("zooms in from the button and publishes --annotation-zoom, the readout and data-magnified", async () => {
    const { container } = renderViewer();
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));

    // The button zoom animates over several frames; wait for the last one.
    await waitFor(() =>
      expect(stage(container).style.getPropertyValue("--annotation-zoom")).toBe("1.4")
    );
    expect(screen.getByRole("group", { name: "Zoom" })).toHaveTextContent("140%");
    expect(stage(container).style.getPropertyValue("--annotation-stroke")).toBe(
      `${2 / 1.4}px`
    );
    expect(stage(container)).toHaveAttribute("data-magnified", "true");
    // Magnified, the viewer owns every gesture and advertises the drag.
    const viewport = container.querySelector(".react-transform-wrapper");
    expect(viewport).toHaveClass("touch-none", "cursor-grab");
    expect(viewport).not.toHaveClass("touch-pan-y");
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Reset zoom" })).toBeEnabled();
  });

  it("goes back to 100% with reset", async () => {
    const { container } = renderViewer();
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    await waitFor(() => expect(stage(container)).toHaveAttribute("data-magnified", "true"));

    fireEvent.click(screen.getByRole("button", { name: "Reset zoom" }));
    await waitFor(() =>
      expect(stage(container).style.getPropertyValue("--annotation-zoom")).toBe("1")
    );
    expect(screen.getByRole("group", { name: "Zoom" })).toHaveTextContent("100%");
    expect(stage(container)).toHaveAttribute("data-magnified", "false");
    expect(screen.getByRole("button", { name: "Reset zoom" })).toBeDisabled();
  });
});

describe("AnnotatedDocumentViewer: labels and slots", () => {
  const labels = {
    previousPage: "Önceki sayfa",
    nextPage: "Sonraki sayfa",
    pageOf: (page: number, total: number) => `Sayfa ${page} / ${total}`,
    zoom: "Yakınlaştırma",
    zoomIn: "Yakınlaştır",
    zoomOut: "Uzaklaştır",
    resetZoom: "Yakınlaştırmayı sıfırla",
    loading: "Yükleniyor…",
  };

  it("renders every label override", () => {
    const { rerender, onPageChange } = renderViewer({ pageIndex: 1, labels });
    expect(screen.getByRole("button", { name: "Önceki sayfa" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sonraki sayfa" })).toBeInTheDocument();
    expect(screen.getByText("Sayfa 2 / 3")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Yakınlaştırma" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yakınlaştır" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Uzaklaştır" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Yakınlaştırmayı sıfırla" })
    ).toBeInTheDocument();
    for (const name of ["Previous page", "Next page", "Zoom in", "Zoom out", "Reset zoom"]) {
      expect(screen.queryByRole("button", { name })).toBeNull();
    }
    expect(screen.queryByRole("group", { name: "Zoom" })).toBeNull();
    expect(screen.queryByText("Page 2 of 3")).toBeNull();

    rerender(
      <AnnotatedDocumentViewer
        pages={[PAGES[0]!, { src: null }]}
        pageIndex={1}
        onPageChange={onPageChange}
        labels={labels}
      />
    );
    expect(screen.getByText("Yükleniyor…")).toBeInTheDocument();
    expect(screen.queryByText("Loading…")).toBeNull();
  });

  it("uses pageOf for the default alt text of a page without one", () => {
    renderViewer({ pages: [{ src: "a.png" }, { src: "b.png" }], labels });
    expect(screen.getByRole("img", { name: "Sayfa 1 / 2" })).toBeInTheDocument();
  });

  it("passes the labels to a standalone DocumentPager", () => {
    render(
      <DocumentPager
        pageIndex={0}
        pageCount={2}
        onPageChange={jest.fn()}
        labels={labels}
      />
    );
    expect(screen.getByRole("button", { name: "Önceki sayfa" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Sonraki sayfa" })).toBeEnabled();
    expect(screen.getByText("Sayfa 1 / 2")).toBeInTheDocument();
  });

  it("merges className and the classNames slots", () => {
    const { container } = renderViewer({
      className: "outer",
      classNames: {
        root: "root-slot",
        stage: "stage-slot",
        page: "page-slot",
        box: "box-slot",
        pager: "pager-slot",
        zoom: "zoom-slot",
      },
    });
    const root = container.firstElementChild;
    expect(root).toHaveClass("outer", "root-slot");
    expect(stage(container)).toHaveClass("stage-slot");
    expect(screen.getByRole("img")).toHaveClass("page-slot");
    expect(rectById(container, "date#0")).toHaveClass("box-slot");
    expect(screen.getByRole("group", { name: "Zoom" })).toHaveClass("zoom-slot");
    expect(screen.getByText("Page 1 of 3").parentElement).toHaveClass("pager-slot");
  });
});
