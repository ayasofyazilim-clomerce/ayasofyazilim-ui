import {
  markStrokeWidth,
  rotateRect,
  toPageFraction,
} from "../custom/annotated-document-viewer/geometry";
import type {
  AnnotationBox,
  AnnotationRect,
} from "../custom/annotated-document-viewer/types";

/** Compares two rects corner by corner, tolerating floating-point noise. */
function expectRect(actual: AnnotationRect | null, expected: AnnotationRect) {
  expect(actual).not.toBeNull();
  const rect = actual as AnnotationRect;
  expect(rect).toHaveLength(4);
  expected.forEach((value, i) => expect(rect[i]).toBeCloseTo(value, 10));
}

function box(partial: Partial<AnnotationBox>): AnnotationBox {
  return { id: "b", page: 0, rect: [0, 0, 0, 0], ...partial };
}

describe("rotateRect", () => {
  const rect: AnnotationRect = [0.1, 0.2, 0.3, 0.4];

  it("leaves the rect unchanged at 0", () => {
    expectRect(rotateRect(rect, 0), [0.1, 0.2, 0.3, 0.4]);
  });

  it("maps a 90° counter-clockwise page turn", () => {
    expectRect(rotateRect(rect, 90), [0.2, 0.7, 0.4, 0.9]);
  });

  it("maps a 180° page turn", () => {
    expectRect(rotateRect(rect, 180), [0.7, 0.6, 0.9, 0.8]);
  });

  it("maps a 270° counter-clockwise page turn", () => {
    expectRect(rotateRect(rect, 270), [0.6, 0.1, 0.8, 0.3]);
  });

  it("normalises the angle: -90 equals 270 and 450 equals 90", () => {
    expect(rotateRect(rect, -90)).toEqual(rotateRect(rect, 270));
    expect(rotateRect(rect, 450)).toEqual(rotateRect(rect, 90));
  });

  it("treats a non-cardinal angle as the identity", () => {
    expectRect(rotateRect(rect, 45), [0.1, 0.2, 0.3, 0.4]);
  });
});

describe("toPageFraction", () => {
  it("divides a pixel rect by its frame", () => {
    expectRect(
      toPageFraction(
        box({ rect: [100, 200, 300, 400], frame: { width: 1000, height: 2000 } })
      ),
      [0.1, 0.1, 0.3, 0.2]
    );
  });

  it('returns null for frame "natural" while the natural size is unknown', () => {
    expect(
      toPageFraction(box({ rect: [100, 200, 300, 400], frame: "natural" }))
    ).toBeNull();
  });

  it('divides by the natural size for frame "natural"', () => {
    expectRect(
      toPageFraction(box({ rect: [100, 200, 300, 400], frame: "natural" }), {
        width: 500,
        height: 1000,
      }),
      [0.2, 0.2, 0.6, 0.4]
    );
  });

  it("returns null for a natural size that has not decoded yet (0×0)", () => {
    expect(
      toPageFraction(box({ rect: [100, 200, 300, 400], frame: "natural" }), {
        width: 0,
        height: 0,
      })
    ).toBeNull();
  });

  it("normalises inverted corners to min/max", () => {
    expectRect(toPageFraction(box({ rect: [0.3, 0.4, 0.1, 0.2] })), [
      0.1, 0.2, 0.3, 0.4,
    ]);
    expectRect(
      toPageFraction(
        box({ rect: [300, 400, 100, 200], frame: { width: 1000, height: 2000 } })
      ),
      [0.1, 0.1, 0.3, 0.2]
    );
  });

  it("applies the frame division first, then the rotation", () => {
    // [100,200,300,400] / 1000×2000 = [0.1,0.1,0.3,0.2]; turned 90° → [0.1,0.7,0.2,0.9].
    expectRect(
      toPageFraction(
        box({
          rect: [100, 200, 300, 400],
          frame: { width: 1000, height: 2000 },
          rotation: 90,
        })
      ),
      [0.1, 0.7, 0.2, 0.9]
    );
  });

  it("passes a fraction rect without a frame through the rotation only", () => {
    expectRect(toPageFraction(box({ rect: [0.1, 0.2, 0.3, 0.4], rotation: 180 })), [
      0.7, 0.6, 0.9, 0.8,
    ]);
  });
});

describe("markStrokeWidth", () => {
  it("is the base width at 100%", () => {
    expect(markStrokeWidth(1)).toBe(2);
  });

  it("halves at 200%, so the on-screen width stays constant", () => {
    expect(markStrokeWidth(2)).toBe(1);
  });

  it("is capped below 100%", () => {
    expect(markStrokeWidth(0.5)).toBe(2.5);
  });

  it("takes a custom base and cap", () => {
    expect(markStrokeWidth(4, 3, 10)).toBe(0.75);
    expect(markStrokeWidth(0.1, 3, 4)).toBe(4);
  });
});
