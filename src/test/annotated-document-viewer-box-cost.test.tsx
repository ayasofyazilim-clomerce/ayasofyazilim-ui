import { render } from "@testing-library/react";
import {
  AnnotatedDocumentViewer,
  type AnnotationBox,
} from "../custom/annotated-document-viewer";

// A table of hundreds of cells lights every one of them when its field is chosen. A glow (a
// `drop-shadow` filter) and a fade on each box made one hover take seconds to draw, so both are
// limited to pages where they stay cheap. These tests pin the limits and that a small page is
// unchanged.

const PAGES = [{ src: "page-1.png", alt: "Page 1" }];

/** `count` boxes of one group, stacked down the page. */
function table(count: number, group = "line_items"): AnnotationBox[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${group}#${i}`,
    page: 0,
    rect: [0.1, 0.001 * i, 0.4, 0.001 * i + 0.0008] as [number, number, number, number],
    group,
    color: "red",
  }));
}

function renderBoxes(boxes: AnnotationBox[], activeIds: string[] = []) {
  const { container } = render(
    <AnnotatedDocumentViewer
      pages={PAGES}
      pageIndex={0}
      onPageChange={jest.fn()}
      boxes={boxes}
      activeIds={activeIds}
    />
  );
  return Array.from(container.querySelectorAll<SVGRectElement>("rect"));
}

const glows = (rect: SVGRectElement) => rect.getAttribute("class")!.includes("drop-shadow");
const fades = (rect: SVGRectElement) =>
  rect.getAttribute("class")!.includes("transition-[stroke-opacity,fill-opacity]");

/** A box's whole-element `opacity` class: what makes the browser draw it as an offscreen group. */
const groupOpacity = (rect: SVGRectElement) => /(^|\s)opacity-\d+(\s|$)/.test(rect.getAttribute("class")!);

describe("AnnotatedDocumentViewer: emphasis cost on a page of many boxes", () => {
  it("never fades a box with `opacity`: a stroke and a fill under it are drawn as an offscreen group each", () => {
    // At rest, lit and related, on a small page and on a large one.
    for (const count of [6, 400]) {
      for (const rect of renderBoxes(table(count), ["line_items#1"])) expect(groupOpacity(rect)).toBe(false);
    }
    const [rect] = renderBoxes(table(3));
    expect(rect!.getAttribute("class")).toContain("[stroke-opacity:0.9]");
  });

  it("keeps the glow and the fade on a small page", () => {
    const rects = renderBoxes(table(6), ["line_items"]);
    expect(rects).toHaveLength(6);
    for (const rect of rects) {
      expect(rect).toHaveAttribute("data-state", "active");
      expect(glows(rect)).toBe(true);
      expect(fades(rect)).toBe(true);
    }
  });

  it("gives the glow to 24 lit boxes, and to none once there are 25", () => {
    for (const rect of renderBoxes(table(24), ["line_items"])) expect(glows(rect)).toBe(true);
    for (const rect of renderBoxes(table(25), ["line_items"])) {
      // Still lit, by the heavier outline and fill, but without a filter pass each.
      expect(rect).toHaveAttribute("data-state", "active");
      expect(rect.getAttribute("class")).toContain("[fill-opacity:0.26]");
      expect(glows(rect)).toBe(false);
    }
  });

  it("counts only the lit boxes for the glow: one box of a large page still glows", () => {
    const rects = renderBoxes(table(100), ["line_items#3"]);
    const lit = rects.filter((rect) => rect.getAttribute("data-state") === "active");
    expect(lit).toHaveLength(1);
    expect(glows(lit[0]!)).toBe(true);
  });

  it("drops the fade past 150 boxes on the page, whatever is lit", () => {
    for (const rect of renderBoxes(table(150))) expect(fades(rect)).toBe(true);
    for (const rect of renderBoxes(table(151))) expect(fades(rect)).toBe(false);
    for (const rect of renderBoxes(table(400), ["line_items#3"])) expect(fades(rect)).toBe(false);
  });

  it("counts only the current page's boxes toward the limits", () => {
    const otherPage = table(300, "other").map((box) => ({ ...box, page: 1 }));
    const rects = renderBoxes([...table(6), ...otherPage], ["line_items"]);
    expect(rects).toHaveLength(6);
    for (const rect of rects) {
      expect(glows(rect)).toBe(true);
      expect(fades(rect)).toBe(true);
    }
  });
});
