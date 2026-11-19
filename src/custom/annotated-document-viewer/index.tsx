"use client";

import { Loader2, Minus, Plus, Scan } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ReactNode,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchContentRef,
} from "react-zoom-pan-pinch";
import { Button } from "@repo/ayasofyazilim-ui/components/button";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { DocumentPager } from "./document-pager";
import { markStrokeWidth, toPageFraction } from "./geometry";
import { ThumbnailStrip } from "./thumbnail-strip";
import {
  DEFAULT_ANNOTATED_DOCUMENT_VIEWER_LABELS,
  type AnnotatedDocumentViewerLabels,
  type AnnotatedDocumentViewerProps,
  type AnnotationBox,
  type AnnotationRect,
} from "./types";

export { DocumentPager } from "./document-pager";
export { markStrokeWidth, rotateRect, toPageFraction } from "./geometry";
export * from "./types";

/** Button step, an absolute scale increment: one click from 100% lands on 140%. */
const ZOOM_STEP = 0.4;
/** Wheel sensitivity, per unit of `|deltaY|`. */
const WHEEL = { step: 0.012 } as const;
/** Double-click zooms in from the fitted page and back out from anywhere else. */
const DOUBLE_CLICK = { mode: "toggle" } as const;
/**
 * Above this scale the page is magnified, which arms panning and the grab cursor. Below it panning
 * stays OFF on purpose: there is nothing to pan at fit, and the viewport `preventDefault()`s
 * `touchmove` whenever panning is live, which would swallow a phone's page scroll for anyone whose
 * finger lands on the document.
 */
const MAGNIFIED_ABOVE = 1.01;
const PANNING_ON = { disabled: false } as const;
const PANNING_OFF = { disabled: true } as const;
/** Pointer travel (px) between `pointerdown` and `click` from which the click ended a drag-pan. */
const CLICK_SLOP_PX = 4;
/** Tolerance for "at the limit": an animation approaches its target in float steps. */
const SCALE_EPSILON = 0.005;

/**
 * Box styling. The hue comes from the box's inline `color` (stroke, fill and glow use
 * `currentColor`); these classes only set weight and emphasis.
 *
 * `vector-effect: non-scaling-stroke` cancels the unit viewBox's scale, and `--annotation-stroke`
 * ({@link markStrokeWidth} of the live zoom, republished on every transform) cancels the viewport's
 * CSS scale, so an outline keeps a constant on-screen width at any zoom. The glow and the dash are
 * divided by `--annotation-zoom` for the same reason.
 */
const BOX_CLASS =
  "fill-current stroke-current opacity-90 transition-[opacity,fill-opacity] duration-200 [fill-opacity:0.11] [stroke-width:var(--annotation-stroke)] [vector-effect:non-scaling-stroke]";
const BOX_STATE_CLASS = {
  active:
    "opacity-100 [fill-opacity:0.26] [stroke-width:calc(var(--annotation-stroke)*1.75)] [filter:drop-shadow(0_0_calc(5px/var(--annotation-zoom))_currentColor)]",
  related:
    "opacity-100 [fill-opacity:0.07] [stroke-width:calc(var(--annotation-stroke)*1.25)] [stroke-dasharray:calc(5px/var(--annotation-zoom))_calc(3px/var(--annotation-zoom))]",
} as const;

type BoxState = keyof typeof BOX_STATE_CLASS;

type ZoomFlags = {
  /** Above {@link MAGNIFIED_ABOVE}: panning is on. */
  magnified: boolean;
  atMin: boolean;
  atMax: boolean;
  /** At the fitted scale the viewer starts at and resets to. */
  atRest: boolean;
};

function zoomFlags(
  scale: number,
  min: number,
  max: number,
  rest: number
): ZoomFlags {
  return {
    magnified: scale > MAGNIFIED_ABOVE,
    atMin: scale <= min + SCALE_EPSILON,
    atMax: scale >= max - SCALE_EPSILON,
    atRest: Math.abs(scale - rest) <= SCALE_EPSILON,
  };
}

function sameFlags(a: ZoomFlags, b: ZoomFlags) {
  return (
    a.magnified === b.magnified &&
    a.atMin === b.atMin &&
    a.atMax === b.atMax &&
    a.atRest === b.atRest
  );
}

function formatZoom(scale: number) {
  return `${Math.round(scale * 100)}%`;
}

/** Each label falls back to its English default, including one passed as `undefined`. */
function resolveLabels(
  labels: AnnotatedDocumentViewerLabels | undefined
): Required<AnnotatedDocumentViewerLabels> {
  const d = DEFAULT_ANNOTATED_DOCUMENT_VIEWER_LABELS;
  return {
    previousPage: labels?.previousPage ?? d.previousPage,
    nextPage: labels?.nextPage ?? d.nextPage,
    pageOf: labels?.pageOf ?? d.pageOf,
    zoom: labels?.zoom ?? d.zoom,
    zoomIn: labels?.zoomIn ?? d.zoomIn,
    zoomOut: labels?.zoomOut ?? d.zoomOut,
    resetZoom: labels?.resetZoom ?? d.resetZoom,
    loading: labels?.loading ?? d.loading,
    thumbnails: labels?.thumbnails ?? d.thumbnails,
    pageN: labels?.pageN ?? d.pageN,
  };
}

function matches(ids: ReadonlySet<string>, box: AnnotationBox) {
  return ids.has(box.id) || (box.group !== undefined && ids.has(box.group));
}

/**
 * With thumbnails the viewer is a size container (`@container`) and lays page and strip out in an
 * inner box, since a container query styles only the container's descendants: the strip goes
 * beside the page once the VIEWER is wide, whatever the viewport is. Without them: no extra node.
 */
function Layout({ split, children }: { split: boolean; children: ReactNode }) {
  return split ? (
    <div className="flex w-full min-w-0 flex-col gap-2 @lg:flex-row-reverse">
      {children}
    </div>
  ) : (
    <>{children}</>
  );
}

type NaturalSize = { src: string; width: number; height: number };

/**
 * A page image with an evidence-box overlay, inside a zoom/pan viewport (wheel, pinch,
 * double-click and buttons), with an optional overlaid pager.
 *
 * The image and the overlay `<svg>` sit inside the SAME transformed element, so the boxes stay on
 * their words at every zoom and pan offset. Boxes are drawn in a unit viewBox from page fractions
 * (see {@link toPageFraction}); only the current page's boxes are drawn.
 */
export function AnnotatedDocumentViewer({
  pages,
  pageIndex,
  onPageChange,
  boxes,
  activeIds,
  relatedIds,
  onBoxHover,
  onBoxClick,
  minZoom = 1,
  maxZoom = 8,
  pager = true,
  thumbnails = false,
  onPageNeeded,
  documentKey,
  labels,
  className,
  classNames,
}: AnnotatedDocumentViewerProps) {
  const text = resolveLabels(labels);
  const pageCount = pages.length;
  const page = pages[pageIndex];
  const src = page?.src ?? null;
  /** The fitted page, clamped into the zoom range: where the viewer starts and resets to. */
  const restScale = Math.min(Math.max(1, minZoom), maxZoom);

  const stageRef = useRef<HTMLDivElement>(null);
  const levelRef = useRef<HTMLSpanElement>(null);
  const zoomRef = useRef<ReactZoomPanPinchContentRef | null>(null);
  const pointerDownAt = useRef<{ x: number; y: number } | null>(null);
  const [flags, setFlags] = useState(() =>
    zoomFlags(restScale, minZoom, maxZoom, restScale)
  );
  const [natural, setNatural] = useState<NaturalSize | null>(null);

  /**
   * Publishes the live magnification. The continuous parts go straight to the DOM, because wheel
   * and pinch fire many times per gesture and a React render per frame would drop frames: the CSS
   * variables the overlay's marks divide by, and the readout text. The flags are React state
   * because they are discrete (each flips at most once per gesture) and they drive markup: the
   * panning prop, the buttons' disabled state and `data-magnified`. An unchanged flag set bails
   * out before re-rendering.
   */
  const applyScale = useCallback(
    (scale: number) => {
      const stage = stageRef.current;
      if (stage) {
        stage.style.setProperty("--annotation-zoom", String(scale));
        stage.style.setProperty(
          "--annotation-stroke",
          `${markStrokeWidth(scale)}px`
        );
      }
      if (levelRef.current) levelRef.current.textContent = formatZoom(scale);
      const next = zoomFlags(scale, minZoom, maxZoom, restScale);
      setFlags((previous) => (sameFlags(previous, next) ? previous : next));
    },
    [minZoom, maxZoom, restScale]
  );

  // A new page gets a fresh viewport: the previous pan offset points at a region that may not
  // exist on it, and a carried-over zoom would hide the rest of the page. `centerView` rather than
  // `resetTransform`, because the fitted position is the CENTRE of the stage, not the origin, and
  // it always fires a transform (so `applyScale` runs) without this effect touching state.
  useEffect(() => {
    zoomRef.current?.centerView(restScale, 0);
  }, [src, restScale]);

  // An image that had already loaded before this component attached its `onLoad` (a
  // server-rendered page, say) still reports its natural size.
  const captureCompleteImage = useCallback((img: HTMLImageElement | null) => {
    const current = img?.getAttribute("src");
    if (img && current && img.complete && img.naturalWidth > 0) {
      setNatural({
        src: current,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    }
  }, []);

  const naturalSize = natural && natural.src === src ? natural : undefined;
  const active = new Set(activeIds);
  const related = new Set(relatedIds);
  const drawn: {
    box: AnnotationBox;
    rect: AnnotationRect;
    state?: BoxState;
  }[] = [];
  for (const box of boxes ?? []) {
    if (box.page !== pageIndex) continue;
    const rect = toPageFraction(box, naturalSize);
    if (!rect) continue;
    const state = matches(active, box)
      ? "active"
      : matches(related, box)
        ? "related"
        : undefined;
    drawn.push({ box, rect, state });
  }

  const interactive = onBoxHover !== undefined || onBoxClick !== undefined;
  const handlePointerDown = (event: ReactPointerEvent<SVGRectElement>) => {
    pointerDownAt.current = { x: event.clientX, y: event.clientY };
  };
  const handleClick = (
    box: AnnotationBox,
    event: ReactMouseEvent<SVGRectElement>
  ) => {
    const down = pointerDownAt.current;
    pointerDownAt.current = null;
    // The viewport pans on a drag that starts on a box; the click that ends it is not a click.
    if (
      down &&
      Math.hypot(event.clientX - down.x, event.clientY - down.y) >=
        CLICK_SLOP_PX
    ) {
      return;
    }
    onBoxClick?.(box);
  };

  return (
    <div
      data-slot="annotated-document-viewer"
      className={cn(
        "flex w-full min-w-0",
        thumbnails && "@container",
        classNames?.root,
        className
      )}
    >
      <Layout split={thumbnails}>
        <div
          ref={stageRef}
          data-slot="annotated-document-stage"
          data-magnified={flags.magnified}
          className={cn(
            "bg-muted relative min-w-0 flex-1 overflow-hidden rounded-md border [--annotation-stroke:2px] [--annotation-zoom:1]",
            classNames?.stage
          )}
        >
          {pager && (
            <DocumentPager
              pageIndex={pageIndex}
              pageCount={pageCount}
              onPageChange={onPageChange}
              labels={text}
              className={cn(
                "absolute top-2 left-1/2 z-10 -translate-x-1/2",
                classNames?.pager
              )}
            />
          )}
          {src === null ? (
            <div
              role="status"
              className="text-muted-foreground flex aspect-[3/4] max-h-[80vh] w-full items-center justify-center gap-2 text-sm"
            >
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              {text.loading}
            </div>
          ) : (
            <>
              <TransformWrapper
                ref={zoomRef}
                minScale={minZoom}
                maxScale={maxZoom}
                initialScale={restScale}
                // The library owns the slack around a page smaller than the stage: `centerOnInit`
                // centres it at mount and `centerZoomedOut` keeps it centred while it still fits.
                // Centring in CSS would fight the transform, whose origin is the frame's top-left.
                centerOnInit
                centerZoomedOut
                wheel={WHEEL}
                doubleClick={DOUBLE_CLICK}
                panning={flags.magnified ? PANNING_ON : PANNING_OFF}
                onTransform={(_ref, state) => applyScale(state.scale)}
                // A remounted viewport (after a loading page) starts fitted; sync the flags to it.
                onInit={(ref) => applyScale(ref.state.scale)}
              >
                {/* The wrapper fills the stage (the library defaults it to the page's width, which
                  would leave a slit for a narrow page) and clips; the content element is what
                  the viewport transforms, and it shrink-wraps the image so the overlay tracks it. */}
                <TransformComponent
                  wrapperClass={cn(
                    "w-full!",
                    flags.magnified
                      ? "cursor-grab touch-none active:cursor-grabbing"
                      : "touch-pan-y"
                  )}
                  contentClass="relative w-fit max-w-full"
                >
                  <img
                    ref={captureCompleteImage}
                    src={src}
                    alt={page?.alt ?? text.pageOf(pageIndex + 1, pageCount)}
                    draggable={false}
                    className={cn(
                      "block h-auto max-h-[80vh] w-auto max-w-full select-none",
                      classNames?.page
                    )}
                    onLoad={(event) => {
                      const img = event.currentTarget;
                      setNatural({
                        src,
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                      });
                      // Only now does the frame have its real size. `centerOnInit` handles the
                      // first image only, so re-centre for every later one.
                      zoomRef.current?.centerView(restScale, 0);
                    }}
                  />
                  {drawn.length > 0 && (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 1 1"
                      preserveAspectRatio="none"
                      className="text-primary pointer-events-none absolute inset-0 size-full overflow-visible"
                    >
                      {drawn.map(({ box, rect, state }) => (
                        <rect
                          key={box.id}
                          data-box-id={box.id}
                          data-state={state}
                          aria-hidden="true"
                          className={cn(
                            BOX_CLASS,
                            state && BOX_STATE_CLASS[state],
                            onBoxClick && "cursor-pointer",
                            classNames?.box
                          )}
                          style={{
                            color: box.color,
                            pointerEvents: interactive ? "auto" : "none",
                          }}
                          x={rect[0]}
                          y={rect[1]}
                          width={rect[2] - rect[0]}
                          height={rect[3] - rect[1]}
                          onPointerEnter={
                            onBoxHover ? () => onBoxHover(box) : undefined
                          }
                          onPointerLeave={
                            onBoxHover ? () => onBoxHover(null) : undefined
                          }
                          onPointerDown={
                            onBoxClick ? handlePointerDown : undefined
                          }
                          onClick={
                            onBoxClick
                              ? (event) => handleClick(box, event)
                              : undefined
                          }
                        >
                          {box.label ? <title>{box.label}</title> : null}
                        </rect>
                      ))}
                    </svg>
                  )}
                </TransformComponent>
              </TransformWrapper>
              {/* Outside the viewport, so pressing a button is never read as the start of a pan. */}
              <div
                role="group"
                aria-label={text.zoom}
                data-slot="annotated-document-zoom"
                className={cn(
                  "bg-popover text-popover-foreground absolute right-2 bottom-2 z-10 flex items-center gap-0.5 rounded-full border p-0.5 shadow-md",
                  classNames?.zoom
                )}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="rounded-full"
                  aria-label={text.zoomOut}
                  disabled={flags.atMin}
                  onClick={() => zoomRef.current?.zoomOut(ZOOM_STEP)}
                >
                  <Minus aria-hidden="true" />
                </Button>
                <span
                  ref={levelRef}
                  className="text-muted-foreground min-w-11 text-center font-mono text-xs tabular-nums select-none"
                >
                  {formatZoom(restScale)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="rounded-full"
                  aria-label={text.zoomIn}
                  disabled={flags.atMax}
                  onClick={() => zoomRef.current?.zoomIn(ZOOM_STEP)}
                >
                  <Plus aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="rounded-full"
                  aria-label={text.resetZoom}
                  disabled={flags.atRest}
                  onClick={() => zoomRef.current?.centerView(restScale)}
                >
                  <Scan aria-hidden="true" />
                </Button>
              </div>
            </>
          )}
        </div>
        {thumbnails && (
          <ThumbnailStrip
            pages={pages}
            pageIndex={pageIndex}
            onPageChange={onPageChange}
            onPageNeeded={onPageNeeded}
            label={text.thumbnails}
            pageN={text.pageN}
            documentKey={documentKey}
            className={classNames?.thumbnails}
          />
        )}
      </Layout>
    </div>
  );
}
